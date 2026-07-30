import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/apiAuth';

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
    const customer_name = row.customer_name?.trim();
    const totalRaw = row.total?.replace(/[^0-9.]/g, '');
    const total = parseFloat(totalRaw);
    if (!customer_name || isNaN(total)) { skipped++; continue; }

    const dateStr = row.date?.trim();
    let created_at = new Date().toISOString();
    if (dateStr) {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) created_at = parsed.toISOString();
    }

    // Reverse-calculate subtotal/HST (13%)
    const subtotal = Math.round((total / 1.13) * 100) / 100;
    const hst = Math.round((total - subtotal) * 100) / 100;

    const rawStatus = row.status?.toLowerCase().trim() || 'draft';
    const status = ['draft', 'sent', 'approved', 'rejected'].includes(rawStatus) ? rawStatus : 'Draft';

    toInsert.push({
      user_id: user.id,
      customer_name,
      customer_email: row.customer_email?.trim() || null,
      customer_phone: row.customer_phone?.trim() || null,
      job_description: row.job_description?.trim() || null,
      line_items: null,
      subtotal,
      hst,
      total,
      notes: row.notes?.trim() || 'Imported from spreadsheet',
      status: status.charAt(0).toUpperCase() + status.slice(1),
      created_at,
    });
    imported++;
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from('quotes').insert(toInsert);
    if (error) {
      errors.push(error.message);
      return NextResponse.json({ imported: 0, skipped: rows.length, errors });
    }
  }

  return NextResponse.json({ imported, skipped, errors });
}
