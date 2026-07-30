import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { rateLimit } from '../../../../lib/rateLimit';

const FROM = process.env.RESEND_FROM_EMAIL || 'TradeDesk <onboarding@resend.dev>';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  // Public endpoint — no auth required (customer is approving via portal link)
  // Rate limit by IP to prevent abuse
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!rateLimit(`quote-approve-${ip}`, 10, 3600000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  try {
    const { token } = await req.json();
    if (!token || typeof token !== 'string' || token.length > 200) {
      return NextResponse.json({ error: 'Invalid token.' }, { status: 400 });
    }

    // Look up the quote by portal_token — this is the authorization mechanism
    const { data: quote } = await supabase
      .from('quotes')
      .select('id, user_id, customer_name, total, status, approved, job_description')
      .eq('portal_token', token)
      .single();

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found.' }, { status: 404 });
    }

    // Idempotent — already approved, return success
    if (quote.approved) {
      return NextResponse.json({ success: true, alreadyApproved: true });
    }

    // Update the quote
    const { error: updateError } = await supabase
      .from('quotes')
      .update({ approved: true, status: 'Approved' })
      .eq('id', quote.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to approve quote.' }, { status: 500 });
    }

    // Notify the contractor — service role bypasses RLS so this always works
    await supabase.from('notifications').insert({
      user_id: quote.user_id,
      title: 'Quote Approved',
      message: `${quote.customer_name} approved your quote for $${Number(quote.total).toFixed(2)}.`,
      type: 'quote',
      read: false,
    });

    // Email the contractor so they know even if they're not in the app
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name, company_name')
      .eq('id', quote.user_id)
      .single();

    if (profile?.email) {
      const contractorName = profile.company_name || profile.full_name || 'there';
      await resend.emails.send({
        from: FROM,
        to: profile.email,
        subject: `Quote approved by ${quote.customer_name}`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:40px 20px;">
  <div style="max-width:540px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
    <div style="background:#0f0f0f;padding:22px 28px;display:flex;align-items:center;gap:10px;">
      <span style="color:white;font-weight:800;font-size:16px;letter-spacing:-0.3px;">TradeDesk</span>
    </div>
    <div style="padding:32px 28px;">
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:18px 20px;margin-bottom:24px;display:flex;align-items:center;gap:12px;">
        <div style="width:10px;height:10px;background:#16a34a;border-radius:50%;flex-shrink:0;"></div>
        <span style="font-size:15px;font-weight:700;color:#15803d;">Quote approved</span>
      </div>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">Hi ${contractorName},</p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
        <strong>${quote.customer_name}</strong> just approved your quote.
      </p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:${quote.job_description ? '12px' : '0'};">
          <span style="font-size:13px;color:#6b7280;">Amount</span>
          <span style="font-size:22px;font-weight:800;color:#16a34a;">$${Number(quote.total).toFixed(2)}</span>
        </div>
        ${quote.job_description ? `<p style="font-size:13px;color:#6b7280;margin:0;border-top:1px solid #e5e7eb;padding-top:12px;">${quote.job_description}</p>` : ''}
      </div>
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Log in to TradeDesk to convert this quote to an invoice and send it to your customer.
      </p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tradedesk.ca'}/quotes"
         style="display:inline-block;background:#16a34a;color:white;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:700;font-size:14px;">
        View Quote
      </a>
    </div>
    <div style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:18px 28px;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">TradeDesk — Business software for Ontario contractors</p>
    </div>
  </div>
</body>
</html>`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('quote-approve error:', error);
    return NextResponse.json({ error: 'Failed to approve quote.' }, { status: 500 });
  }
}
