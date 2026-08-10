import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '../../../../lib/rateLimit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Public endpoint — no auth required (customer is viewing a quote via portal link).
// portal_token is the authorization mechanism. Uses service role so RLS doesn't need
// to grant the anon role broad read access to the quotes table (which holds customer
// PII for every contractor) — this route only ever returns the one row matching the
// token supplied in the request.
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!rateLimit(`quote-by-token-${ip}`, 30, 3600000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const token = req.nextUrl.searchParams.get('token');
  if (!token || token.length > 200) {
    return NextResponse.json({ error: 'Invalid token.' }, { status: 400 });
  }

  const { data: quote, error } = await supabase
    .from('quotes')
    .select('id, customer_name, job_description, line_items, subtotal, hst, total, notes, approved, deposit_amount, deposit_paid')
    .eq('portal_token', token)
    .single();

  if (error) {
    console.error('quotes/by-token query error:', error);
  }

  if (!quote) {
    return NextResponse.json({ error: 'Quote not found.' }, { status: 404 });
  }

  return NextResponse.json({ quote });
}
