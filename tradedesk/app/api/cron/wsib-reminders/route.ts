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
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0];

    const { data: entries, error } = await supabase
      .from('wsib_entries')
      .select('*')
      .eq('status', 'pending')
      .lte('due_date', threeDaysStr);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!entries || entries.length === 0) return NextResponse.json({ message: 'No WSIB reminders needed', sent: 0 });

    let sent = 0;
    for (const entry of entries) {
      const { data: profile } = await supabase.from('profiles').select('email, full_name').eq('id', entry.user_id).single();
      const { data: { user } } = await supabase.auth.admin.getUserById(entry.user_id);
      const email = profile?.email || user?.email;
      const name = profile?.full_name || 'Contractor';
      if (!email) continue;

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'TradeDesk <onboarding@resend.dev>',
        to: email,
        subject: `⚠️ WSIB Payment Due Soon — $${entry.premium_owing?.toFixed(2)}`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px;">
            <div style="background: #16a34a; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <h1 style="color: white; margin: 0; font-size: 22px;">TradeDesk WSIB Alert</h1>
            </div>
            <p style="color: #374151;">Hi <strong>${name}</strong>,</p>
            <p style="color: #374151;">Your WSIB payment is due in 3 days. Don't miss the deadline to avoid penalties.</p>
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <p style="color: #6b7280; margin: 0 0 8px;">Premium Owing</p>
              <p style="color: #dc2626; font-size: 32px; font-weight: 800; margin: 0;">$${entry.premium_owing?.toFixed(2)}</p>
              <p style="color: #6b7280; margin: 8px 0 0;">Due: ${new Date(entry.due_date).toLocaleDateString('en-CA')}</p>
            </div>
            <p style="color: #6b7280; font-size: 13px;">Log in to TradeDesk to mark as paid once filed.</p>
          </div>
        `,
      });
      sent++;
    }

    return NextResponse.json({ message: `Sent ${sent} WSIB reminders`, sent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
