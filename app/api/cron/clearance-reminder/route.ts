import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const FROM = process.env.RESEND_FROM_EMAIL || 'TradeDesk <onboarding@resend.dev>';

export async function GET(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date();
  const in30 = new Date(today.getTime() + 30 * 86400000).toISOString().split('T')[0];
  const in31 = new Date(today.getTime() + 31 * 86400000).toISOString().split('T')[0];

  // Find contractors whose cert expires in exactly 30 days
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, clearance_cert_expiry')
    .gte('clearance_cert_expiry', in30)
    .lt('clearance_cert_expiry', in31);

  if (!profiles?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;
  for (const profile of profiles) {
    if (!profile.email) continue;
    const name = profile.full_name?.split(' ')[0] || 'there';
    const expiryDate = new Date(profile.clearance_cert_expiry).toLocaleDateString('en-CA', {
      month: 'long', day: 'numeric', year: 'numeric',
    });

    await resend.emails.send({
      from: FROM,
      to: profile.email,
      subject: `Action required: Your WSIB Clearance Certificate expires ${expiryDate}`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h2 style="color: #7f1d1d; margin: 0 0 8px; font-size: 18px;">Clearance Certificate Expiring Soon</h2>
            <p style="color: #991b1b; margin: 0; font-size: 15px;">Expires <strong>${expiryDate}</strong> — 30 days from today</p>
          </div>
          <p style="color: #374151; font-size: 15px; line-height: 1.7;">Hi ${name}, your WSIB Clearance Certificate expires in 30 days. Without a valid certificate, general contractors in Ontario cannot legally hire you for their projects.</p>
          <div style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="color: #374151; font-size: 14px; font-weight: 700; margin: 0 0 8px;">How to renew:</p>
            <p style="color: #374151; font-size: 14px; margin: 0 0 6px;">1. Visit <a href="https://www.wsib.ca/en/clearance-certificates" style="color: #16a34a;">wsib.ca/clearance-certificates</a></p>
            <p style="color: #374151; font-size: 14px; margin: 0 0 6px;">2. Log in and ensure your account is in good standing</p>
            <p style="color: #374151; font-size: 14px; margin: 0;">3. Update the expiry date in TradeDesk under WSIB Tracking</p>
          </div>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tradedesk.ca'}/wsib" style="background: #16a34a; color: white; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px;">Update Certificate in TradeDesk</a>
          </div>
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">This reminder was sent because you have a clearance certificate expiry date saved in TradeDesk.</p>
        </div>
      `,
    });
    sent++;
  }

  return NextResponse.json({ sent });
}
