import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const FROM = process.env.RESEND_FROM_EMAIL || 'TradeDesk <onboarding@resend.dev>';

// Daily at 9am. Warns a contractor 30 days before an insurance policy or a
// subcontractor's COI on file expires. Matches the exact-30-days-out pattern
// used by /api/cron/clearance-reminder — a given policy only ever falls in
// this window once, so no separate sent-tracking column is needed.
export async function GET(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date();
  const in30 = new Date(today.getTime() + 30 * 86400000).toISOString().split('T')[0];
  const in31 = new Date(today.getTime() + 31 * 86400000).toISOString().split('T')[0];

  const { data: docs, error } = await supabase
    .from('insurance_docs')
    .select('id, user_id, doc_type, insurer, policy_number, expiry_date, subcontractor_name')
    .gte('expiry_date', in30)
    .lt('expiry_date', in31);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!docs?.length) return NextResponse.json({ message: 'No insurance reminders needed', sent: 0 });

  let sent = 0;
  for (const doc of docs) {
    const { data: profile } = await supabase.from('profiles').select('email, full_name').eq('id', doc.user_id).single();
    const { data: { user } } = await supabase.auth.admin.getUserById(doc.user_id);
    const email = profile?.email || user?.email;
    if (!email) continue;

    const name = profile?.full_name?.split(' ')[0] || 'there';
    const expiryDate = new Date(doc.expiry_date + 'T00:00:00').toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' });
    const isSubcontractor = !!doc.subcontractor_name;
    const subject = isSubcontractor
      ? `Action needed: ${doc.subcontractor_name}'s insurance expires ${expiryDate}`
      : `Action needed: Your ${doc.doc_type} insurance expires ${expiryDate}`;
    const bodyIntro = isSubcontractor
      ? `Your subcontractor <strong>${doc.subcontractor_name}</strong>'s ${doc.doc_type} insurance on file expires in 30 days. Get an updated Certificate of Insurance before they're back on a job site — an expired COI can put your own coverage at risk.`
      : `Your ${doc.doc_type} insurance policy expires in 30 days. Renew it to stay covered without a gap.`;

    await resend.emails.send({
      from: FROM,
      to: email,
      subject,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h2 style="color: #7f1d1d; margin: 0 0 8px; font-size: 18px;">${isSubcontractor ? `${doc.subcontractor_name}'s Insurance` : 'Your Insurance'} Expiring Soon</h2>
            <p style="color: #991b1b; margin: 0; font-size: 15px;">Expires <strong>${expiryDate}</strong> — 30 days from today</p>
          </div>
          <p style="color: #374151; font-size: 15px; line-height: 1.7;">Hi ${name}, ${bodyIntro}</p>
          ${doc.insurer || doc.policy_number ? `
          <div style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 20px 0;">
            ${doc.insurer ? `<p style="color: #374151; font-size: 14px; margin: 0 0 6px;"><strong>Insurer:</strong> ${doc.insurer}</p>` : ''}
            ${doc.policy_number ? `<p style="color: #374151; font-size: 14px; margin: 0;"><strong>Policy #:</strong> ${doc.policy_number}</p>` : ''}
          </div>` : ''}
          <div style="text-align: center; margin: 28px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://mytradedesk.ca'}/insurance" style="background: #16a34a; color: white; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px;">Update in TradeDesk</a>
          </div>
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">This reminder was sent because you have this policy's expiry date saved in TradeDesk.</p>
        </div>
      `,
    });
    sent++;
  }

  return NextResponse.json({ sent });
}
