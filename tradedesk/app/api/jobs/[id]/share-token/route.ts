import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '../../../../../lib/apiAuth';
import { rateLimit } from '../../../../../lib/rateLimit';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!rateLimit(`share-${user.id}`, 30, 60000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const { id: jobId } = await params;

  // Verify the job belongs to the authenticated user
  const { data: job } = await supabase
    .from('jobs')
    .select('id, share_token')
    .eq('id', jobId)
    .eq('user_id', user.id)
    .single();

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  // Return existing token if already generated
  if (job.share_token) {
    return NextResponse.json({ token: job.share_token });
  }

  // Generate a new secure random token (32 hex chars)
  const token = crypto.randomBytes(16).toString('hex');

  await supabase
    .from('jobs')
    .update({ share_token: token })
    .eq('id', jobId);

  return NextResponse.json({ token });
}
