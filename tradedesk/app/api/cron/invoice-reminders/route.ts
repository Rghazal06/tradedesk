import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('status', 'unpaid')
      .lte('created_at', sevenDaysAgo.toISOString())
      .not('customer_email', 'is', null);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!invoices || invoices.length === 0) return NextResponse.json({ message: 'No overdue invoices', sent: 0 });

    let sent = 0;
    for (const invoice of invoices) {
      if (!invoice.customer_email) continue;
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'TradeDesk <onboarding@resend.dev>',
        to: invoice.customer_email,
        subject: `Payment Reminder — Invoice for $${invoice.total?.toFixed(2)}`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto;">
            <div style="background: #16a34a; padding: 32px; text-align: center; border-radius: 16px 16px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Payment Reminder</h1>
            </div>
            <div style="padding: 32px; background: white; border: 1px solid #e5e7eb; border-radius: 0 0 16px 16px;">
              <p style="color: #374151;">Hi <strong>${invoice.customer_name}</strong>,</p>
              <p style="color: #374151;">This is a friendly reminder that your invoice is still outstanding.</p>
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                <p style="color: #6b7280; margin: 0 0 8px;">Amount Due</p>
                <p style="color: #16a34a; font-size: 40px; font-weight: 800; margin: 0;">$${invoice.total?.toFixed(2)}</p>
              </div>
              ${invoice.payment_link ? `<div style="text-align: center;"><a href="${invoice.payment_link}" style="background: #16a34a; color: white; padding: 16px 40px; border-radius: 50px; text-decoration: none; font-weight: 700;">Pay Now →</a></div>` : ''}
              <p style="color: #6b7280; font-size: 13px; text-align: center; margin-top: 24px;">Sent via TradeDesk</p>
            </div>
          </div>
        `,
      });
      sent++;
    }

    return NextResponse.json({ message: `Sent ${sent} invoice reminders`, sent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
