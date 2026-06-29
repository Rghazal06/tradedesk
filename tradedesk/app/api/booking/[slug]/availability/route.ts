import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '../../../../../lib/rateLimit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Returns available time slots for a given contractor + date.
// GET /api/booking/[slug]/availability?date=YYYY-MM-DD
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!rateLimit(`booking-avail-${ip}`, 60, 60000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const date = req.nextUrl.searchParams.get('date');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date.' }, { status: 400 });
  }

  // Load contractor profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, booking_enabled, booking_hours_start, booking_hours_end, booking_days, booking_notice_hours, booking_slot_minutes')
    .eq('public_slug', slug)
    .eq('is_public', true)
    .single();

  if (!profile || !profile.booking_enabled) {
    return NextResponse.json({ error: 'Booking not available.' }, { status: 404 });
  }

  const startHour = parseInt((profile.booking_hours_start || '08:00').split(':')[0]);
  const endHour   = parseInt((profile.booking_hours_end   || '17:00').split(':')[0]);
  const slotMins  = profile.booking_slot_minutes || 60;
  const noticeMins = (profile.booking_notice_hours || 24) * 60;
  const workingDays: number[] = profile.booking_days || [1, 2, 3, 4, 5]; // Mon–Fri

  // Check if the requested day is a working day (0=Sun, 1=Mon … 6=Sat)
  const requestedDay = new Date(date + 'T12:00:00').getDay();
  if (!workingDays.includes(requestedDay)) {
    return NextResponse.json({ slots: [], reason: 'not_working_day' });
  }

  // Generate all possible slots for the day
  const allSlots: string[] = [];
  for (let h = startHour; h + slotMins / 60 <= endHour; h += slotMins / 60) {
    const hh = Math.floor(h).toString().padStart(2, '0');
    const mm = ((h % 1) * 60).toString().padStart(2, '0');
    allSlots.push(`${hh}:${mm}`);
  }

  // Filter out slots too soon (minimum notice)
  const nowMs = Date.now();
  const availableSlots = allSlots.filter(slot => {
    const slotMs = new Date(`${date}T${slot}:00`).getTime();
    return slotMs - nowMs >= noticeMins * 60 * 1000;
  });

  if (availableSlots.length === 0) {
    return NextResponse.json({ slots: [], reason: 'no_slots' });
  }

  // Fetch existing appointments on this date
  const { data: appointments } = await supabase
    .from('appointments')
    .select('scheduled_time, duration_minutes')
    .eq('user_id', profile.id)
    .eq('scheduled_date', date)
    .neq('status', 'cancelled');

  // Fetch jobs on this date that have a scheduled_time
  const { data: jobs } = await supabase
    .from('jobs')
    .select('scheduled_time, estimated_hours')
    .eq('user_id', profile.id)
    .eq('scheduled_date', date)
    .not('scheduled_time', 'is', null)
    .neq('status', 'cancelled');

  // Build list of blocked minute ranges [startMin, endMin]
  const blocked: Array<[number, number]> = [];

  for (const appt of appointments || []) {
    if (!appt.scheduled_time) continue;
    const [h, m] = appt.scheduled_time.split(':').map(Number);
    const startMin = h * 60 + m;
    const endMin   = startMin + (appt.duration_minutes || slotMins);
    blocked.push([startMin, endMin]);
  }

  for (const job of jobs || []) {
    if (!job.scheduled_time) continue;
    const [h, m] = job.scheduled_time.split(':').map(Number);
    const startMin = h * 60 + m;
    const endMin   = startMin + Math.round((job.estimated_hours || 4) * 60);
    blocked.push([startMin, endMin]);
  }

  // A slot is free if it doesn't overlap any blocked range
  const freeSlots = availableSlots.filter(slot => {
    const [h, m] = slot.split(':').map(Number);
    const slotStart = h * 60 + m;
    const slotEnd   = slotStart + slotMins;
    return !blocked.some(([bs, be]) => slotStart < be && slotEnd > bs);
  });

  return NextResponse.json({ slots: freeSlots });
}
