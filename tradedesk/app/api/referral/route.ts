import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/referral — apply a referral code at signup
export async function POST(req: NextRequest) {
  try {
    const { userId, referralCode } = await req.json();

    if (!userId || !referralCode) {
      return NextResponse.json({ error: 'userId and referralCode required' }, { status: 400 });
    }

    const code = referralCode.toUpperCase().trim();

    // Find the referrer by their code
    const { data: referrer } = await supabase
      .from('profiles')
      .select('id, referral_count')
      .eq('referral_code', code)
      .single();

    if (!referrer) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    if (referrer.id === userId) {
      return NextResponse.json({ error: 'Cannot use your own referral code' }, { status: 400 });
    }

    // Check not already applied
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('referred_by')
      .eq('id', userId)
      .single();

    if (currentUser?.referred_by) {
      return NextResponse.json({ error: 'Referral code already applied' }, { status: 400 });
    }

    // Mark the new user as referred
    await supabase
      .from('profiles')
      .update({ referred_by: referrer.id })
      .eq('id', userId);

    // Increment referrer's count
    await supabase
      .from('profiles')
      .update({ referral_count: (referrer.referral_count || 0) + 1 })
      .eq('id', referrer.id);

    // Notify the referrer
    await supabase.from('notifications').insert({
      user_id: referrer.id,
      title: 'Referral Bonus',
      message: 'Someone signed up using your referral link! You both earned 1 month free.',
      type: 'referral',
      read: false,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/referral?userId=... — get referral stats for a user
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const { data } = await supabase
      .from('profiles')
      .select('referral_code, referral_count')
      .eq('id', userId)
      .single();

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
