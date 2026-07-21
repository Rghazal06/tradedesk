import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/apiAuth';

const STATUSES = ['scheduled', 'in progress', 'completed', 'cancelled'];

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let rows: Record<string, string>[] = [];
  try { rows = (await req.json()).rows || []; } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }

  let imported = 0, skipped = 0;
  const errors: string[] = [];
  const toInsert: object[] = [];

  for (const row of rows) {
    const title = row.title?.trim();
    if (!title) { skipped++; continue; }

    const dateStr = row.scheduled_date?.trim();
    let scheduled_date: string | null = null;
    if (dateStr) {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) scheduled_date = parsed.toISOString().split('T')[0];
    }

    const rawStatus = row.status?.toLowerCase().trim() || 'completed';
    const status = STATUSES.find(s => rawStatus.includes(s.split(' ')[0])) || 'completed';

    toInsert.push({
      user_id: user.id,
      title,
      customer_name: row.customer_name?.trim() || null,
      customer_phone: row.customer_phone?.trim() || null,
      scheduled_date,
      status,
      notes: row.notes?.trim() || null,
      photos: [],
    });
    imported++;
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from('jobs').insert(toInsert);
    if (error) {
      errors.push(error.message);
      return NextResponse.json({ imported: 0, skipped: rows.length, errors });
    }
  }

  return NextResponse.json({ imported, skipped, errors });
}
