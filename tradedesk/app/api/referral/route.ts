import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '../../../lib/apiAuth';
import { sanitizeString } from '../../../lib/validate';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/referral — apply a referral code at signup
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const referralCode = sanitizeString(body.referralCode || '', 20);
    // userId from body is ignored — use server-verified user.id

    if (!referralCode) {
      return NextResponse.json({ error: 'referralCode required' }, { status: 400 });
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

    if (referrer.id === user.id) {
      return NextResponse.json({ error: 'Cannot use your own referral code' }, { status: 400 });
    }

    // Check not already applied
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('referred_by')
      .eq('id', user.id)
      .single();

    if (currentUser?.referred_by) {
      return NextResponse.json({ error: 'Referral code already applied' }, { status: 400 });
    }

    // Mark the new user as referred
    await supabase
      .from('profiles')
      .update({ referred_by: referrer.id })
      .eq('id', user.id);

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
  } catch (error) {
    console.error('referral POST error:', error);
    return NextResponse.json({ error: 'Failed to apply referral code.' }, { status: 500 });
  }
}

// GET /api/referral — get referral stats for the authenticated user
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // userId query param is ignored — only return data for the authenticated user
    const { data } = await supabase
      .from('profiles')
      .select('referral_code, referral_count')
      .eq('id', user.id)
      .single();

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('referral GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch referral stats.' }, { status: 500 });
  }
}
