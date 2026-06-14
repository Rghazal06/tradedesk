import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM_EMAIL || 'TradeDesk <onboarding@resend.dev>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://tradedesk.ca';

// These match the sequence in /api/onboarding/route.ts
const EMAIL_CONTENT: Record<number, { subject: string; html: (name: string) => string }> = {
  1: {
    subject: 'TradeDesk: Set up WSIB tracking (takes 2 minutes)',
    html: (name) => `
      <div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:32px 16px;">
        <h2 style="color:#111;font-size:20px;font-weight:700;">Hey ${name}, don't get caught by WSIB</h2>
        <p style="color:#374151;font-size:15px;line-height:1.7;">Ontario contractors who miss WSIB filing deadlines face penalties. TradeDesk tracks it automatically.</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${APP_URL}/wsib" style="background:#16a34a;color:white;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Set Up WSIB Tracking</a>
        </div>
      </div>
    `,
  },
  2: {
    subject: 'Get paid 3x faster with payment links',
    html: (name) => `
      <div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:32px 16px;">
        <h2 style="color:#111;font-size:20px;font-weight:700;">Hey ${name}, stop chasing payments</h2>
        <p style="color:#374151;font-size:15px;line-height:1.7;">Attach a Stripe payment link to every invoice — customers pay by card the same day.</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${APP_URL}/invoices" style="background:#16a34a;color:white;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Create Invoice with Payment Link</a>
        </div>
      </div>
    `,
  },
  4: {
    subject: 'Your AI assistant knows your business',
    html: (name) => `
      <div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:32px 16px;">
        <h2 style="color:#111;font-size:20px;font-weight:700;">Hey ${name}, meet your AI assistant</h2>
        <p style="color:#374151;font-size:15px;line-height:1.7;">Ask it anything about your business — revenue, unpaid invoices, top customers.</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${APP_URL}/assistant" style="background:#16a34a;color:white;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Open AI Assistant</a>
        </div>
      </div>
    `,
  },
  7: {
    subject: 'Your free trial ends in 7 days — upgrade now',
    html: (name) => `
      <div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:32px 16px;">
        <h2 style="color:#111;font-size:20px;font-weight:700;">Hey ${name}, your trial ends in 7 days</h2>
        <p style="color:#374151;font-size:15px;line-height:1.7;">Upgrade to keep all your quotes, invoices, and client data.</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${APP_URL}/settings" style="background:#16a34a;color:white;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Upgrade Now</a>
        </div>
      </div>
    `,
  },
};

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find unsent onboarding emails where signup was N days ago
    const daysToCheck = [1, 2, 4, 7];
    let totalSent = 0;

    for (const day of daysToCheck) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - day);
      const dateStr = targetDate.toISOString().split('T')[0];

      const { data: pending } = await supabase
        .from('onboarding_emails')
        .select('*')
        .eq('day', day)
        .eq('sent', false)
        .gte('created_at', `${dateStr}T00:00:00Z`)
        .lte('created_at', `${dateStr}T23:59:59Z`);

      if (!pending?.length) continue;

      const content = EMAIL_CONTENT[day];
      if (!content) continue;

      for (const record of pending) {
        const name = record.full_name?.split(' ')[0] || 'there';
        await resend.emails.send({
          from: FROM,
          to: record.email,
          subject: content.subject,
          html: content.html(name),
        });

        await supabase
          .from('onboarding_emails')
          .update({ sent: true, sent_at: new Date().toISOString() })
          .eq('id', record.id);

        totalSent++;
      }
    }

    return NextResponse.json({ message: `Sent ${totalSent} onboarding emails`, sent: totalSent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
