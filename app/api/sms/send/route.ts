import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '../../../../lib/apiAuth';
import { rateLimit } from '../../../../lib/rateLimit';
import { sanitizeString } from '../../../../lib/validate';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Contractor sends a text to a known customer from their own Twilio number
// (profiles.twilio_phone — the same number missed-call leads already use).
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!rateLimit(`sms-send-${user.id}`, 30, 3600000)) {
    return NextResponse.json({ error: 'Too many messages. Please wait.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const customerPhone = sanitizeString(body.customerPhone || '', 20);
    const customerName = sanitizeString(body.customerName || '', 100);
    const messageBody = sanitizeString(body.body || '', 1600);

    if (!customerPhone || !messageBody) {
      return NextResponse.json({ error: 'customerPhone and body are required.' }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('twilio_phone')
      .eq('id', user.id)
      .single();

    if (!profile?.twilio_phone) {
      return NextResponse.json({ error: 'Set up your Twilio number in Settings before texting clients.' }, { status: 400 });
    }

    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID!;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN!;

    const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        From: profile.twilio_phone,
        To: customerPhone,
        Body: messageBody,
      }).toString(),
    });

    if (!twilioRes.ok) {
      const twilioError = await twilioRes.json().catch(() => null);
      console.error('sms/send twilio error:', twilioError);
      // Trial Twilio accounts can only text numbers verified in the Twilio Console —
      // this is the most common real-world failure and the generic message gave no clue why.
      if (twilioError?.code === 21608) {
        return NextResponse.json({ error: 'Your Twilio account is still in trial mode, which can only text verified numbers. Add a payment method in the Twilio Console to upgrade and text real clients.' }, { status: 502 });
      }
      return NextResponse.json({ error: 'Failed to send message. Double-check your Twilio number in Settings.' }, { status: 502 });
    }

    const { data: existing, error: lookupError } = await supabase
      .from('sms_conversations')
      .select('id, messages')
      .eq('user_id', user.id)
      .eq('customer_phone', customerPhone)
      .single();

    if (lookupError) {
      console.error('sms/send lookup error:', lookupError);
    }

    const newMessage = { direction: 'outbound', body: messageBody, ts: new Date().toISOString() };

    if (existing) {
      const updated = [...(existing.messages || []), newMessage];
      const { error: updateError } = await supabase.from('sms_conversations').update({
        messages: updated,
        last_message_at: new Date().toISOString(),
        ...(customerName ? { customer_name: customerName } : {}),
      }).eq('id', existing.id);
      if (updateError) {
        console.error('sms/send update error:', updateError);
        return NextResponse.json({ error: 'Message sent but failed to save to conversation history.' }, { status: 500 });
      }
      return NextResponse.json({ success: true, messages: updated });
    } else {
      const messages = [newMessage];
      const { error: insertError } = await supabase.from('sms_conversations').insert({
        user_id: user.id,
        customer_phone: customerPhone,
        customer_name: customerName || null,
        messages,
        last_message_at: new Date().toISOString(),
      });
      if (insertError) {
        console.error('sms/send insert error:', insertError);
        return NextResponse.json({ error: 'Message sent but failed to save to conversation history.' }, { status: 500 });
      }
      return NextResponse.json({ success: true, messages });
    }
  } catch (error) {
    console.error('sms/send error:', error);
    return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 });
  }
}
