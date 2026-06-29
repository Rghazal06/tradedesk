import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { rateLimit } from '../../../../../lib/rateLimit';
import { sanitizeString } from '../../../../../lib/validate';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const FROM = process.env.RESEND_FROM_EMAIL || 'TradeDesk <onboarding@resend.dev>';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { slug } = await params;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!rateLimit(`booking-create-${ip}`, 5, 3600000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const date         = sanitizeString(body.date || '', 10);
    const time         = sanitizeString(body.time || '', 5);
    const customerName = sanitizeString(body.customerName || '', 100);
    const customerPhone= sanitizeString(body.customerPhone || '', 20);
    const customerEmail= sanitizeString(body.customerEmail || '', 200);
    const jobType      = sanitizeString(body.jobType || '', 100);
    const notes        = sanitizeString(body.notes || '', 500);

    if (!date || !time || !customerName || !jobType) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
      return NextResponse.json({ error: 'Invalid date or time.' }, { status: 400 });
    }

    // Load contractor
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name, company_name, booking_enabled, booking_slot_minutes')
      .eq('public_slug', slug)
      .eq('is_public', true)
      .single();

    if (!profile || !profile.booking_enabled) {
      return NextResponse.json({ error: 'Booking not available.' }, { status: 404 });
    }

    const slotMins = profile.booking_slot_minutes || 60;

    // Re-check the slot is still free (race condition guard)
    const [h, m] = time.split(':').map(Number);
    const slotStart = h * 60 + m;
    const slotEnd   = slotStart + slotMins;

    const { data: conflicts } = await supabase
      .from('appointments')
      .select('id, scheduled_time, duration_minutes')
      .eq('user_id', profile.id)
      .eq('scheduled_date', date)
      .neq('status', 'cancelled');

    const hasConflict = (conflicts || []).some(appt => {
      if (!appt.scheduled_time) return false;
      const [ah, am] = appt.scheduled_time.split(':').map(Number);
      const as_ = ah * 60 + am;
      const ae  = as_ + (appt.duration_minutes || slotMins);
      return slotStart < ae && slotEnd > as_;
    });

    if (hasConflict) {
      return NextResponse.json({ error: 'That time slot was just booked. Please pick another.' }, { status: 409 });
    }

    // Create the appointment
    const { data: appt, error: insertError } = await supabase
      .from('appointments')
      .insert({
        user_id:          profile.id,
        customer_name:    customerName,
        customer_phone:   customerPhone,
        customer_email:   customerEmail,
        job_type:         jobType,
        scheduled_date:   date,
        scheduled_time:   time,
        duration_minutes: slotMins,
        status:           'pending',
        notes:            notes,
        reminder_sent:    false,
      })
      .select('id')
      .single();

    if (insertError || !appt) {
      return NextResponse.json({ error: 'Failed to create booking.' }, { status: 500 });
    }

    const contractorName = profile.company_name || profile.full_name || 'Your contractor';
    const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const displayTime = new Date(`${date}T${time}:00`).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', hour12: true });

    // Notify contractor — bell
    await supabase.from('notifications').insert({
      user_id: profile.id,
      title:   'New Booking Request',
      message: `${customerName} booked a ${jobType} appointment for ${displayDate} at ${displayTime}.`,
      type:    'quote',
      read:    false,
    });

    // Email contractor
    if (profile.email) {
      await resend.emails.send({
        from: FROM,
        to: profile.email,
        subject: `New booking: ${customerName} — ${displayDate}`,
        html: `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:40px 20px;">
  <div style="max-width:540px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
    <div style="background:#0f0f0f;padding:22px 28px;">
      <span style="color:white;font-weight:800;font-size:16px;">TradeDesk</span>
    </div>
    <div style="padding:32px 28px;">
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
        <span style="font-size:14px;font-weight:700;color:#15803d;">New booking request</span>
      </div>
      <p style="color:#374151;font-size:15px;margin:0 0 20px;">Hi ${contractorName},<br><br>You have a new appointment request from <strong>${customerName}</strong>.</p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;font-size:13px;color:#6b7280;width:120px;">Date</td><td style="padding:6px 0;font-size:13px;font-weight:600;color:#111;">${displayDate}</td></tr>
          <tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">Time</td><td style="padding:6px 0;font-size:13px;font-weight:600;color:#111;">${displayTime}</td></tr>
          <tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">Job type</td><td style="padding:6px 0;font-size:13px;font-weight:600;color:#111;">${jobType}</td></tr>
          <tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">Customer</td><td style="padding:6px 0;font-size:13px;font-weight:600;color:#111;">${customerName}</td></tr>
          ${customerPhone ? `<tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">Phone</td><td style="padding:6px 0;font-size:13px;color:#374151;">${customerPhone}</td></tr>` : ''}
          ${customerEmail ? `<tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">Email</td><td style="padding:6px 0;font-size:13px;color:#374151;">${customerEmail}</td></tr>` : ''}
          ${notes ? `<tr><td style="padding:6px 0;font-size:13px;color:#6b7280;vertical-align:top;">Notes</td><td style="padding:6px 0;font-size:13px;color:#374151;">${notes}</td></tr>` : ''}
        </table>
      </div>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tradedesk.ca'}/appointments" style="display:inline-block;background:#16a34a;color:white;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:700;font-size:14px;">View in TradeDesk</a>
    </div>
    <div style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:16px 28px;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">TradeDesk — Business software for Ontario contractors</p>
    </div>
  </div>
</body></html>`,
      });
    }

    // Confirmation email to customer
    if (customerEmail) {
      await resend.emails.send({
        from: FROM,
        to: customerEmail,
        subject: `Your appointment with ${contractorName} is confirmed`,
        html: `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:40px 20px;">
  <div style="max-width:540px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
    <div style="background:#0f0f0f;padding:22px 28px;">
      <span style="color:white;font-weight:800;font-size:16px;">TradeDesk</span>
    </div>
    <div style="padding:32px 28px;">
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
        <span style="font-size:14px;font-weight:700;color:#15803d;">Appointment confirmed</span>
      </div>
      <p style="color:#374151;font-size:15px;margin:0 0 20px;">Hi ${customerName},<br><br>Your appointment with <strong>${contractorName}</strong> has been received.</p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;font-size:13px;color:#6b7280;width:100px;">Date</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#111;">${displayDate}</td></tr>
          <tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">Time</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#111;">${displayTime}</td></tr>
          <tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">Service</td><td style="padding:6px 0;font-size:13px;color:#374151;">${jobType}</td></tr>
        </table>
      </div>
      <p style="color:#6b7280;font-size:13px;margin:0;">${contractorName} will confirm your appointment shortly. If you need to make changes, contact them directly.</p>
    </div>
    <div style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:16px 28px;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">Powered by TradeDesk</p>
    </div>
  </div>
</body></html>`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('booking/book error:', error);
    return NextResponse.json({ error: 'Booking failed. Please try again.' }, { status: 500 });
  }
}
