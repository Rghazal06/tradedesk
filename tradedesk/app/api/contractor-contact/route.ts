import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { contractorId, contractorName, name, email, phone, description } = await req.json();

    if (!contractorId || !name || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create a notification for the contractor
    const { error } = await supabase.from('notifications').insert({
      user_id: contractorId,
      title: 'New Quote Request',
      message: `${name} is requesting a quote: "${description.slice(0, 120)}${description.length > 120 ? '...' : ''}"${email ? ` — ${email}` : ''}${phone ? ` / ${phone}` : ''}`,
      type: 'quote_request',
      read: false,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
