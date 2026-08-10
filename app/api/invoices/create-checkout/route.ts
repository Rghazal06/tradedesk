import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { rateLimit } from '../../../../lib/rateLimit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Public endpoint — no auth required (customer is paying via the /pay page).
// payment_token is the authorization mechanism.
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!rateLimit(`invoice-checkout-${ip}`, 10, 3600000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-03-31.basil',
  });

  try {
    const { token, tipAmount } = await req.json();
    if (!token || typeof token !== 'string' || token.length > 200) {
      return NextResponse.json({ error: 'Invalid token.' }, { status: 400 });
    }

    const tip = Number(tipAmount) || 0;
    if (tip < 0) {
      return NextResponse.json({ error: 'Invalid tip amount.' }, { status: 400 });
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, user_id, customer_name, customer_email, total, status')
      .eq('payment_token', token)
      .single();

    if (invoiceError) {
      console.error('invoices/create-checkout query error:', invoiceError);
    }

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
    }

    if (String(invoice.status).toLowerCase() === 'paid') {
      return NextResponse.json({ error: 'This invoice is already paid.' }, { status: 400 });
    }

    const invoiceAmountCents = Math.round(Number(invoice.total) * 100);
    if (!Number.isFinite(invoiceAmountCents) || invoiceAmountCents < 50) {
      return NextResponse.json({ error: 'Invoice amount is invalid.' }, { status: 400 });
    }

    const lineItems = [{
      price_data: {
        currency: 'cad',
        unit_amount: invoiceAmountCents,
        product_data: { name: `Invoice — ${invoice.customer_name || 'TradeDesk'}` },
      },
      quantity: 1,
    }];

    const tipCents = Math.round(tip * 100);
    if (tipCents > 0) {
      lineItems.push({
        price_data: {
          currency: 'cad',
          unit_amount: tipCents,
          product_data: { name: 'Tip' },
        },
        quantity: 1,
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mytradedesk.ca';
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: invoice.customer_email || undefined,
      line_items: lineItems,
      metadata: {
        kind: 'invoice_payment',
        invoice_id: invoice.id,
        user_id: invoice.user_id,
        tip_amount: tipCents > 0 ? (tipCents / 100).toFixed(2) : '0',
      },
      success_url: `${appUrl}/pay?token=${encodeURIComponent(token)}`,
      cancel_url: `${appUrl}/pay?token=${encodeURIComponent(token)}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('invoices/create-checkout error:', error);
    return NextResponse.json({ error: 'Failed to start payment.' }, { status: 500 });
  }
}
