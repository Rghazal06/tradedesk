import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateTwilioSignature } from '../../../../lib/twilioValidate';

/** Escape XML special chars to prevent TwiML injection. */
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

// Twilio SMS webhook — called for every inbound SMS to the contractor's Twilio number.
// Uses OpenAI to generate a reply that qualifies the lead (job type, location, urgency, budget).
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Validate Twilio signature — prevents spoofed requests that could
  // create fake leads, send fake SMS replies, or burn OpenAI tokens
  const isValid = await validateTwilioSignature(req, rawBody);
  if (!isValid) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const params = new URLSearchParams(rawBody);
  const callerPhone = params.get('From') || '';
  const toPhone = params.get('To') || '';
  // Cap at 1600 chars (max SMS length) to prevent prompt stuffing via unusually long messages
  const incomingMessage = (params.get('Body') || '').slice(0, 1600);

  // Find the contractor
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, company_name, trade_type, sms_bot_enabled')
    .eq('twilio_phone', toPhone)
    .single();

  if (!profile || !profile.sms_bot_enabled) {
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    );
  }

  // Find existing lead record
  const { data: lead } = await supabase
    .from('sms_leads')
    .select('*')
    .eq('user_id', profile.id)
    .eq('caller_phone', callerPhone)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const existingMessages: Array<{ role: string; content: string; ts: string }> = lead?.messages || [];

  // Add the user's message
  const updatedMessages = [
    ...existingMessages,
    { role: 'user', content: incomingMessage, ts: new Date().toISOString() },
  ];

  const contractorName = profile.company_name || profile.full_name || 'the contractor';
  const trade = profile.trade_type || 'trades';

  const systemPrompt = `You are a friendly, professional assistant for ${contractorName}, a ${trade} contractor in Ontario, Canada. Your job is to qualify potential customers who text in after a missed call.

Your goal across the conversation:
1. Find out what job they need done (be specific)
2. Ask for their address or rough location
3. Ask about urgency (emergency, this week, flexible)
4. Optionally ask about their budget if appropriate

Keep replies short (2-3 sentences max). Be warm and professional. Once you have job type, location, and urgency, tell them "${contractorName} will review your request and get back to you shortly with a quote." Do not book appointments or make commitments — just collect information.

Never mention you're an AI unless they ask directly. If they ask, say you're an assistant helping manage inquiries.`;

  const openaiMessages = [
    { role: 'system', content: systemPrompt },
    ...updatedMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ];

  // Instantiate OpenAI inside the handler (never at module level)
  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  let aiReply = "Thanks for your message! The contractor will get back to you soon.";
  let qualified = false;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: openaiMessages,
      max_tokens: 200,
      temperature: 0.7,
    });
    aiReply = completion.choices[0]?.message?.content?.trim() || aiReply;

    // Check if lead is qualified (AI mentioned getting back with a quote / reviewing request)
    qualified = aiReply.toLowerCase().includes('get back to you') || aiReply.toLowerCase().includes('review your request');
  } catch {
    // Fall back to default message on error
  }

  // Append AI reply to messages
  const finalMessages = [
    ...updatedMessages,
    { role: 'assistant', content: aiReply, ts: new Date().toISOString() },
  ];

  // Extract job summary from the first user message
  const jobSummary = updatedMessages.find(m => m.role === 'user')?.content?.slice(0, 120) || '';

  // Upsert lead record
  if (lead) {
    await supabase.from('sms_leads').update({
      messages: finalMessages,
      status: qualified ? 'qualified' : 'active',
      job_summary: jobSummary,
      updated_at: new Date().toISOString(),
    }).eq('id', lead.id);
  } else {
    await supabase.from('sms_leads').insert({
      user_id: profile.id,
      caller_phone: callerPhone,
      status: 'active',
      messages: finalMessages,
      job_summary: jobSummary,
    });
  }

  // Send reply via Twilio REST API
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID!;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN!;

  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      From: toPhone,
      To: callerPhone,
      Body: aiReply,
    }).toString(),
  });

  // Empty TwiML response (SMS sent manually above)
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  );
}
