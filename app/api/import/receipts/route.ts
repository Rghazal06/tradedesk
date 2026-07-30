import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/apiAuth';

const CATEGORIES = ['Materials', 'Tools', 'Fuel', 'Food', 'Office', 'Insurance', 'Subcontractor', 'Other'];

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
    const merchant = row.merchant?.trim();
    const amountRaw = row.amount?.replace(/[^0-9.]/g, '');
    const amount = parseFloat(amountRaw);
    if (!merchant || isNaN(amount)) { skipped++; continue; }

    const subtotal = row.subtotal ? parseFloat(row.subtotal.replace(/[^0-9.]/g, '')) : null;
    const tax = row.tax ? parseFloat(row.tax.replace(/[^0-9.]/g, '')) : null;
    const dateStr = row.date?.trim();
    let date = new Date().toISOString().split('T')[0];
    if (dateStr) {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) date = parsed.toISOString().split('T')[0];
    }

    const rawCat = row.category?.trim() || '';
    const category = CATEGORIES.find(c => c.toLowerCase() === rawCat.toLowerCase()) || 'Other';

    toInsert.push({
      user_id: user.id,
      merchant,
      amount,
      subtotal: isNaN(subtotal!) ? null : subtotal,
      tax: isNaN(tax!) ? null : tax,
      date,
      category,
      notes: row.notes?.trim() || null,
      image_url: null,
      line_items: null,
    });
    imported++;
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from('receipts').insert(toInsert);
    if (error) {
      errors.push(error.message);
      return NextResponse.json({ imported: 0, skipped: rows.length, errors });
    }
  }

  return NextResponse.json({ imported, skipped, errors });
}
