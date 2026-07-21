import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const FROM = process.env.RESEND_FROM_EMAIL || 'TradeDesk <onboarding@resend.dev>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://tradedesk.ca';

// Email sequence definitions
const SEQUENCE = [
  {
    day: 0,
    subject: 'Welcome to TradeDesk — Create your first quote',
    html: (name: string) => `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
        <div style="background: #16a34a; border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background: white; border-radius: 8px; padding: 6px 14px; margin-bottom: 12px;">
            <span style="color: #16a34a; font-weight: 800; font-size: 18px;">TradeDesk</span>
          </div>
          <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 700;">Welcome, ${name}!</h1>
        </div>
        <p style="color: #374151; font-size: 16px; line-height: 1.7;">Your 14-day free trial is now active. Here's how to create your first AI-powered quote in under 2 minutes:</p>
        <div style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <p style="color: #374151; font-size: 14px; margin: 0 0 8px;"><strong>Step 1:</strong> Go to Quotes → New Quote</p>
          <p style="color: #374151; font-size: 14px; margin: 0 0 8px;"><strong>Step 2:</strong> Enter the customer name and describe the job</p>
          <p style="color: #374151; font-size: 14px; margin: 0;"><strong>Step 3:</strong> Click "Generate with AI" — done</p>
        </div>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${APP_URL}/quotes/new" style="background: #16a34a; color: white; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px;">Create Your First Quote</a>
        </div>
        <p style="color: #6b7280; font-size: 13px; text-align: center;">Questions? Just reply to this email — we're here to help.</p>
      </div>
    `,
  },
  {
    day: 1,
    subject: 'TradeDesk: Set up WSIB tracking (takes 2 minutes)',
    html: (name: string) => `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
        <h2 style="color: #111; font-size: 20px; font-weight: 700;">Hey ${name}, don't get caught by WSIB</h2>
        <p style="color: #374151; font-size: 15px; line-height: 1.7;">Ontario contractors who miss WSIB filing deadlines face penalties and interest. TradeDesk tracks it automatically.</p>
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <p style="color: #991b1b; font-weight: 700; margin: 0 0 8px;">Without TradeDesk:</p>
          <p style="color: #374151; font-size: 14px; margin: 0;">Manual spreadsheets, missed deadlines, surprise penalties</p>
        </div>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <p style="color: #15803d; font-weight: 700; margin: 0 0 8px;">With TradeDesk:</p>
          <p style="color: #374151; font-size: 14px; margin: 0;">Automatic reminders 3 days before each due date, one-click logging, premium auto-calculated</p>
        </div>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${APP_URL}/wsib" style="background: #16a34a; color: white; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px;">Set Up WSIB Tracking</a>
        </div>
      </div>
    `,
  },
  {
    day: 2,
    subject: 'Get paid 3x faster with payment links',
    html: (name: string) => `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
        <h2 style="color: #111; font-size: 20px; font-weight: 700;">Hey ${name}, stop chasing payments</h2>
        <p style="color: #374151; font-size: 15px; line-height: 1.7;">TradeDesk connects to Stripe so you can attach a payment link directly to every invoice — customers pay by credit card, Interac, or bank transfer.</p>
        <div style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <p style="color: #374151; font-size: 14px; margin: 0 0 12px;">Here's what contractors say about payment links:</p>
          <p style="color: #374151; font-size: 14px; margin: 0; font-style: italic;">"I used to wait 30+ days for cheques. Now customers pay the same day I send the invoice."</p>
        </div>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${APP_URL}/invoices" style="background: #16a34a; color: white; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px;">Create an Invoice with Payment Link</a>
        </div>
      </div>
    `,
  },
  {
    day: 4,
    subject: 'Your AI assistant knows your business',
    html: (name: string) => `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
        <h2 style="color: #111; font-size: 20px; font-weight: 700;">Hey ${name}, meet your AI assistant</h2>
        <p style="color: #374151; font-size: 15px; line-height: 1.7;">Unlike generic AI tools, TradeDesk's AI assistant has access to your actual business data — your quotes, invoices, jobs, and revenue.</p>
        <div style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <p style="color: #374151; font-size: 14px; font-weight: 700; margin: 0 0 12px;">Try asking:</p>
          <p style="color: #374151; font-size: 14px; margin: 0 0 6px;">"What were my top 5 jobs this month?"</p>
          <p style="color: #374151; font-size: 14px; margin: 0 0 6px;">"Which invoices are still unpaid?"</p>
          <p style="color: #374151; font-size: 14px; margin: 0;">"How much revenue did I collect last month?"</p>
        </div>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${APP_URL}/assistant" style="background: #16a34a; color: white; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px;">Open AI Assistant</a>
        </div>
      </div>
    `,
  },
  {
    day: 7,
    subject: 'Your free trial ends in 7 days — upgrade now',
    html: (name: string) => `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
        <h2 style="color: #111; font-size: 20px; font-weight: 700;">Hey ${name}, your trial ends in 7 days</h2>
        <p style="color: #374151; font-size: 15px; line-height: 1.7;">Don't lose access to your quotes, invoices, and client data. Upgrade to keep everything.</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0;">
          <div style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px;">
            <p style="color: #111; font-weight: 700; margin: 0 0 4px;">Starter</p>
            <p style="color: #16a34a; font-size: 24px; font-weight: 800; margin: 0 0 8px;">$99/mo</p>
            <p style="color: #6b7280; font-size: 13px; margin: 0;">Quotes, Invoices, Jobs, WSIB, Appointments</p>
          </div>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px;">
            <p style="color: #111; font-weight: 700; margin: 0 0 4px;">Pro</p>
            <p style="color: #16a34a; font-size: 24px; font-weight: 800; margin: 0 0 8px;">$199/mo</p>
            <p style="color: #6b7280; font-size: 13px; margin: 0;">Everything + AI features + priority support</p>
          </div>
        </div>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${APP_URL}/settings" style="background: #16a34a; color: white; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px;">Upgrade Now</a>
        </div>
        <p style="color: #6b7280; font-size: 13px; text-align: center;">Questions about which plan is right for you? Reply to this email.</p>
      </div>
    `,
  },
];

// POST /api/onboarding — triggered on new signup, sends day-0 email and records sequence
export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { userId, email, fullName } = await req.json();
    if (!userId || !email) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const name = fullName?.split(' ')[0] || 'there';

    // Send day-0 email immediately
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: SEQUENCE[0].subject,
      html: SEQUENCE[0].html(name),
    });

    // Record all emails as pending in onboarding_emails
    const records = SEQUENCE.map(s => ({
      user_id: userId,
      email,
      full_name: fullName || '',
      day: s.day,
      sent: s.day === 0,
      sent_at: s.day === 0 ? new Date().toISOString() : null,
    }));

    await supabase.from('onboarding_emails').insert(records);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
