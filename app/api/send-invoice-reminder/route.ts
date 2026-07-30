import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getAuthUser } from '../../../lib/apiAuth';
import { rateLimit } from '../../../lib/rateLimit';
import { sanitizeString } from '../../../lib/validate';

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 20 email reminders per hour per user
  if (!rateLimit(`invoice-reminder-${user.id}`, 20, 3600000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait.' }, { status: 429 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const body = await req.json();
    const customerEmail = sanitizeString(body.customerEmail || '', 200);
    const customerName = sanitizeString(body.customerName || '', 100);
    const invoiceTotal = sanitizeString(String(body.invoiceTotal || ''), 20);
    const invoiceId = sanitizeString(body.invoiceId || '', 36);
    const contractorName = sanitizeString(body.contractorName || '', 100);
    const contractorPhone = sanitizeString(body.contractorPhone || '', 20);
    const paymentLink = sanitizeString(body.paymentLink || '', 500);

    if (!customerEmail) {
      return NextResponse.json({ error: 'Customer email is required' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'TradeDesk <onboarding@resend.dev>',
      to: customerEmail,
      subject: `Payment Reminder — Invoice for $${invoiceTotal}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 40px 20px;">
          <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 32px; text-align: center;">
              <div style="display: inline-block; background: white; border-radius: 10px; padding: 8px 16px; margin-bottom: 16px;">
                <span style="color: #1e40af; font-weight: 800; font-size: 20px; letter-spacing: -0.5px;">TradeDesk</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Payment Reminder</h1>
            </div>

            <!-- Body -->
            <div style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
                Hi <strong>${customerName}</strong>,
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                This is a friendly reminder that your invoice from <strong>${contractorName}</strong> is still outstanding.
              </p>

              <!-- Invoice Box -->
              <div style="background: #f0f7ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">Amount Due</p>
                <p style="color: #1e40af; font-size: 40px; font-weight: 800; margin: 0 0 8px;">$${invoiceTotal}</p>
                <p style="color: #6b7280; font-size: 13px; margin: 0;">Invoice #${invoiceId.slice(0, 8).toUpperCase()}</p>
              </div>

              <!-- Pay Button -->
              ${paymentLink ? `
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${paymentLink}" style="display: inline-block; background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-weight: 700; font-size: 16px; letter-spacing: 0.3px;">
                  Pay Now
                </a>
              </div>
              ` : ''}

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 8px;">
                If you have any questions, please contact:
              </p>
              <p style="color: #374151; font-size: 14px; font-weight: 600; margin: 0;">
                ${contractorName} ${contractorPhone ? `• ${contractorPhone}` : ''}
              </p>
            </div>

            <!-- Footer -->
            <div style="background: #f8fafc; border-top: 1px solid #e5e7eb; padding: 20px 32px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Sent via TradeDesk — Business software for Ontario contractors
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) return NextResponse.json({ error: 'Failed to send reminder.' }, { status: 400 });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('send-invoice-reminder error:', error);
    return NextResponse.json({ error: 'Failed to send reminder.' }, { status: 500 });
  }
}
