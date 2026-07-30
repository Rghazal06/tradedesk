import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '../../../lib/apiAuth';
import { rateLimit } from '../../../lib/rateLimit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 30 photo uploads per hour per user
  if (!rateLimit(`photo-${user.id}`, 30, 3600000)) {
    return NextResponse.json({ error: 'Too many uploads. Please wait.' }, { status: 429 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const jobId = formData.get('jobId') as string;
    // NOTE: userId from form data is intentionally ignored — we use the verified user.id from auth

    if (!file || !jobId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    // Verify the job belongs to the authenticated user (not the client-supplied userId)
    const { data: job } = await supabase
      .from('jobs')
      .select('id, photos')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    // Upload to Supabase Storage under the verified user's folder
    const filename = `${user.id}/${jobId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('job-photos')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from('job-photos').getPublicUrl(filename);
    const photoUrl = urlData.publicUrl;

    // Append to job's photos array
    const currentPhotos: string[] = job.photos || [];
    await supabase
      .from('jobs')
      .update({ photos: [...currentPhotos, photoUrl] })
      .eq('id', jobId);

    return NextResponse.json({ success: true, url: photoUrl });
  } catch (error) {
    console.error('upload-job-photo error:', error);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}
