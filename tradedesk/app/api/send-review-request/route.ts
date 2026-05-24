import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(req: NextRequest) {
  try {
    const { customerPhone, customerName, contractorName, googleReviewLink } = await req.json();

    if (!customerPhone) {
      return NextResponse.json({ error: 'Customer phone number is required' }, { status: 400 });
    }

    const message = await client.messages.create({
      body: `Hi ${customerName}! Thanks for choosing ${contractorName}. Please leave us a Google Review: ${googleReviewLink || 'https://g.page/r/review'} Thank you!`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: customerPhone,
    });

    return NextResponse.json({ success: true, messageId: message.sid });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}