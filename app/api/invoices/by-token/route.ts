import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '../../../../lib/rateLimit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Public endpoint — no auth required (customer is viewing/paying an invoice via pay link).
// payment_token is the authorization mechanism, same pattern as quotes' portal_token.
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!rateLimit(`invoice-by-token-${ip}`, 30, 3600000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const token = req.nextUrl.searchParams.get('token');
  if (!token || token.length > 200) {
    return NextResponse.json({ error: 'Invalid token.' }, { status: 400 });
  }

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('id, user_id, customer_name, line_items, subtotal, hst, total, status, notes, tip_amount')
    .eq('payment_token', token)
    .single();

  if (error) {
    console.error('invoices/by-token query error:', error);
  }

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_name, full_name')
    .eq('id', invoice.user_id)
    .single();

  const { user_id, ...invoiceFields } = invoice;
  void user_id;

  return NextResponse.json({
    invoice: invoiceFields,
    contractorName: profile?.company_name || profile?.full_name || 'TradeDesk',
  });
}
