import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAuthUser } from '../../../lib/apiAuth';

// Server-side source of truth for price -> plan. Never trust a client-supplied plan name.
const PLAN_BY_PRICE_ID: Record<string, string> = {
  [process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || 'price_1TYyLwHtCISkRQL6TBKz9xQh']: 'starter',
  [process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_1TYyMaHtCISkRQL6RWAB2eoo']: 'pro',
};

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-03-31.basil',
  });

  try {
    const { priceId } = await req.json();
    const plan = PLAN_BY_PRICE_ID[priceId];
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan selected.' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: { user_id: user.id, plan },
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscribed=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('create-checkout error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}