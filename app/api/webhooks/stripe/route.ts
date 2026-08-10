import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

// Public endpoint by design — Stripe has no user session to send. Authenticity is
// verified via the stripe-signature header against STRIPE_WEBHOOK_SECRET, not getAuthUser.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PLAN_PRICE_CENTS_CAD: Record<string, number> = {
  starter: 9900,
  pro: 19900,
};

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing']);

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-03-31.basil',
  });

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(stripe, event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription, false);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription, true);
        break;
      default:
        break;
    }
  } catch (error) {
    // Ack with 200 anyway — we don't want Stripe retrying forever on a bug on our end
    // while a human investigates. The error is logged for follow-up.
    console.error('stripe webhook handler error:', event.type, error);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(stripe: Stripe, session: Stripe.Checkout.Session) {
  if (session.mode === 'subscription') {
    const userId = session.client_reference_id;
    const plan = session.metadata?.plan;
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
    if (!userId || !plan || !customerId) return;

    await supabase
      .from('profiles')
      .update({ subscription_status: 'active', subscription_plan: plan, stripe_customer_id: customerId })
      .eq('id', userId);

    await applyReferralRewardIfEligible(stripe, userId, plan, customerId);
    return;
  }

  if (session.mode === 'payment') {
    const invoiceId = session.metadata?.invoice_id;
    const userId = session.metadata?.user_id;
    if (!invoiceId || !userId) return;

    const { data: invoice } = await supabase
      .from('invoices')
      .select('id, status, customer_name, customer_phone')
      .eq('id', invoiceId)
      .eq('user_id', userId)
      .single();

    if (!invoice || invoice.status === 'paid') return;

    await supabase.from('invoices').update({ status: 'paid' }).eq('id', invoiceId).eq('user_id', userId);

    await sendReviewRequestIfPossible(userId, invoice.customer_name, invoice.customer_phone);
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription, canceled: boolean) {
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
  if (!customerId) return;

  const status = canceled
    ? 'canceled'
    : ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)
      ? 'active'
      : subscription.status; // e.g. past_due, unpaid — anything not 'active' already blocks access in middleware

  await supabase
    .from('profiles')
    .update({ subscription_status: status })
    .eq('stripe_customer_id', customerId);
}

// Grants a real Stripe balance credit (previously this was a fake notification with no
// actual credit applied — see referral bug fix). Guarded by referral_reward_granted so
// a retried webhook delivery or a future resubscribe can't double-credit.
async function applyReferralRewardIfEligible(
  stripe: Stripe,
  newUserId: string,
  plan: string,
  newUserStripeCustomerId: string
) {
  const { data: newUserProfile } = await supabase
    .from('profiles')
    .select('referred_by, referral_reward_granted')
    .eq('id', newUserId)
    .single();

  if (!newUserProfile?.referred_by || newUserProfile.referral_reward_granted) return;

  const { data: referrer } = await supabase
    .from('profiles')
    .select('id, email, stripe_customer_id')
    .eq('id', newUserProfile.referred_by)
    .single();

  if (!referrer) return;

  const creditCents = PLAN_PRICE_CENTS_CAD[plan] ?? PLAN_PRICE_CENTS_CAD.starter;

  let referrerCustomerId = referrer.stripe_customer_id;
  if (!referrerCustomerId) {
    const customer = await stripe.customers.create({ email: referrer.email });
    referrerCustomerId = customer.id;
    await supabase.from('profiles').update({ stripe_customer_id: referrerCustomerId }).eq('id', referrer.id);
  }

  await stripe.customers.createBalanceTransaction(referrerCustomerId, {
    amount: -creditCents,
    currency: 'cad',
    description: 'Referral bonus - a contractor you referred subscribed to TradeDesk',
  });

  await stripe.customers.createBalanceTransaction(newUserStripeCustomerId, {
    amount: -creditCents,
    currency: 'cad',
    description: 'Referral bonus - thanks for signing up with a referral code',
  });

  await supabase.from('profiles').update({ referral_reward_granted: true }).eq('id', newUserId);

  await supabase.from('notifications').insert({
    user_id: referrer.id,
    title: 'Referral Bonus Applied',
    message: 'Someone signed up using your referral link and subscribed — you both got a credit applied to your account.',
    type: 'referral',
    read: false,
  });
}

async function sendReviewRequestIfPossible(
  userId: string,
  customerName: string | null,
  customerPhone: string | null
) {
  if (!customerPhone) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('google_review_link, company_name, full_name')
    .eq('id', userId)
    .single();

  if (!profile) return;

  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const contractorName = profile.company_name || profile.full_name || 'us';
    await client.messages.create({
      body: `Hi ${customerName || 'there'}! Thanks for choosing ${contractorName}. Please leave us a Google Review: ${profile.google_review_link || 'https://g.page/r/review'} Thank you!`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: customerPhone,
    });
  } catch (error) {
    console.error('post-payment review SMS failed (non-fatal):', error);
  }
}
