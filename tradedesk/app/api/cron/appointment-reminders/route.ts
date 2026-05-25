import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function GET() {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('scheduled_date', tomorrowStr)
      .eq('status', 'confirmed')
      .eq('reminder_sent', false)
      .not('customer_phone', 'is', null);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!appointments || appointments.length === 0) return NextResponse.json({ message: 'No appointments tomorrow', sent: 0 });

    let sent = 0;
    for (const apt of appointments) {
      if (!apt.customer_phone) continue;
      await client.messages.create({
        body: `Hi ${apt.customer_name}! Reminder: you have an appointment tomorrow at ${apt.scheduled_time?.slice(0, 5)}. See you then!`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: apt.customer_phone,
      });
      await supabase.from('appointments').update({ reminder_sent: true }).eq('id', apt.id);
      sent++;
    }

    return NextResponse.json({ message: `Sent ${sent} appointment reminders`, sent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
