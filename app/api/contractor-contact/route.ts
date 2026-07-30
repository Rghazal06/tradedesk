import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '../../../lib/rateLimit';
import { sanitizeString } from '../../../lib/validate';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  // IP-based rate limit — this is a public endpoint (no auth required)
  // but we must prevent spam flooding a contractor's notifications
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!rateLimit(`contractor-contact-${ip}`, 5, 3600000)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const contractorId = sanitizeString(body.contractorId || '', 36);
    const name = sanitizeString(body.name || '', 100);
    const email = sanitizeString(body.email || '', 200);
    const phone = sanitizeString(body.phone || '', 20);
    const description = sanitizeString(body.description || '', 500);

    if (!contractorId || !name || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the contractorId is a real user before inserting a notification
    const { data: contractor } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', contractorId)
      .single();

    if (!contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }

    const { error } = await supabase.from('notifications').insert({
      user_id: contractorId,
      title: 'New Quote Request',
      message: `${name} is requesting a quote: "${description.slice(0, 120)}${description.length > 120 ? '...' : ''}"${email ? ` — ${email}` : ''}${phone ? ` / ${phone}` : ''}`,
      type: 'quote_request',
      read: false,
    });

    if (error) {
      return NextResponse.json({ error: 'Failed to send request.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('contractor-contact error:', error);
    return NextResponse.json({ error: 'Failed to send request.' }, { status: 500 });
  }
}
