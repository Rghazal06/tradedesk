import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { getAuthUser } from '../../../lib/apiAuth';
import { rateLimit } from '../../../lib/rateLimit';
import { sanitizeString } from '../../../lib/validate';

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 10 review requests per hour per user
  if (!rateLimit(`review-${user.id}`, 10, 3600000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait.' }, { status: 429 });
  }

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  try {
    const body = await req.json();
    const customerPhone = sanitizeString(body.customerPhone || '', 20);
    const customerName = sanitizeString(body.customerName || '', 100);
    const contractorName = sanitizeString(body.contractorName || '', 100);
    const googleReviewLink = sanitizeString(body.googleReviewLink || '', 300);

    if (!customerPhone) {
      return NextResponse.json({ error: 'Customer phone number is required' }, { status: 400 });
    }

    const message = await client.messages.create({
      body: `Hi ${customerName}! Thanks for choosing ${contractorName}. Please leave us a Google Review: ${googleReviewLink || 'https://g.page/r/review'} Thank you!`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: customerPhone,
    });

    return NextResponse.json({ success: true, messageId: message.sid });
  } catch (error) {
    console.error('send-review-request error:', error);
    return NextResponse.json({ error: 'Failed to send review request.' }, { status: 500 });
  }
}
