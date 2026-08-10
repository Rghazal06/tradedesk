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
      return NextResponse.json({ error: 'Failed to send message.' }, { status: 502 });
    }

    const { data: existing } = await supabase
      .from('sms_conversations')
      .select('id, messages')
      .eq('user_id', user.id)
      .eq('customer_phone', customerPhone)
      .single();

    const newMessage = { direction: 'outbound', body: messageBody, ts: new Date().toISOString() };

    if (existing) {
      const updated = [...(existing.messages || []), newMessage];
      await supabase.from('sms_conversations').update({
        messages: updated,
        last_message_at: new Date().toISOString(),
        ...(customerName ? { customer_name: customerName } : {}),
      }).eq('id', existing.id);
      return NextResponse.json({ success: true, messages: updated });
    } else {
      const messages = [newMessage];
      await supabase.from('sms_conversations').insert({
        user_id: user.id,
        customer_phone: customerPhone,
        customer_name: customerName || null,
        messages,
        last_message_at: new Date().toISOString(),
      });
      return NextResponse.json({ success: true, messages });
    }
  } catch (error) {
    console.error('sms/send error:', error);
    return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 });
  }
}
