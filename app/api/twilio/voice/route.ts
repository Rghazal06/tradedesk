import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateTwilioSignature } from '../../../../lib/twilioValidate';

/** Escape XML special chars to prevent TwiML injection via contractor name or caller data. */
function xmlEscape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Twilio voice webhook — called when a call is missed / goes to voicemail.
// Responds with TwiML to play a message, then sends the caller an SMS to kick off the AI qualification flow.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Validate Twilio signature — prevents spoofed requests that could
  // send SMS to arbitrary phones at Twilio expense or create fake leads
  const isValid = await validateTwilioSignature(req, rawBody);
  if (!isValid) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const params = new URLSearchParams(rawBody);
  const callerPhone = params.get('From') || '';
  const toPhone = params.get('To') || '';   // contractor's Twilio number

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, company_name, sms_bot_enabled')
    .eq('twilio_phone', toPhone)
    .single();

  // If bot is disabled or contractor not found, just hang up gracefully
  if (!profile || !profile.sms_bot_enabled) {
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    );
  }

  const contractorName = xmlEscape(profile.company_name || profile.full_name || 'your contractor');

  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID!;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN!;

  const smsBody = `Hi! You just called ${contractorName}. They're on a job right now. I'm their assistant — can I help you get a quote or book a time? What's the work you need done?`;

  // Insert a lead record to track this conversation
  await supabase.from('sms_leads').insert({
    user_id: profile.id,
    caller_phone: callerPhone,
    status: 'new',
    messages: [{ role: 'assistant', content: smsBody, ts: new Date().toISOString() }],
  });

  // Send the initial SMS via Twilio REST API
  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      From: toPhone,
      To: callerPhone,
      Body: smsBody,
    }).toString(),
  });

  // TwiML response: brief message then hang up
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Thanks for calling ${contractorName}. They are on a job right now, so we just sent you a text message to help get you sorted out. Check your texts!</Say>
  <Hangup/>
</Response>`;

  return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } });
}
