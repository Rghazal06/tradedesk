import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { rateLimit } from '../../../../lib/rateLimit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Public endpoint — no auth required (customer is paying a deposit via portal link).
// portal_token is the authorization mechanism, same as /api/quotes/approve.
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!rateLimit(`quote-deposit-${ip}`, 10, 3600000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-03-31.basil',
  });

  try {
    const { token } = await req.json();
    if (!token || typeof token !== 'string' || token.length > 200) {
      return NextResponse.json({ error: 'Invalid token.' }, { status: 400 });
    }

    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('id, user_id, customer_name, customer_email, deposit_amount, deposit_paid, approved')
      .eq('portal_token', token)
      .single();

    if (quoteError) {
      console.error('create-deposit-checkout query error:', quoteError);
    }

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found.' }, { status: 404 });
    }

    if (!quote.deposit_amount || Number(quote.deposit_amount) <= 0) {
      return NextResponse.json({ error: 'No deposit required for this quote.' }, { status: 400 });
    }

    if (quote.deposit_paid) {
      return NextResponse.json({ error: 'Deposit already paid.' }, { status: 400 });
    }

    const unitAmountCents = Math.round(Number(quote.deposit_amount) * 100);
    if (unitAmountCents < 50) {
      return NextResponse.json({ error: 'Deposit amount is too small for Stripe (minimum 50 cents CAD).' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mytradedesk.ca';
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: quote.customer_email || undefined,
      line_items: [{
        price_data: {
          currency: 'cad',
          unit_amount: unitAmountCents,
          product_data: { name: `Deposit for quote — ${quote.customer_name || 'TradeDesk quote'}` },
        },
        quantity: 1,
      }],
      metadata: { kind: 'quote_deposit', quote_id: quote.id, user_id: quote.user_id },
      success_url: `${appUrl}/portal?token=${encodeURIComponent(token)}`,
      cancel_url: `${appUrl}/portal?token=${encodeURIComponent(token)}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('create-deposit-checkout error:', error);
    return NextResponse.json({ error: 'Failed to start deposit payment.' }, { status: 500 });
  }
}
