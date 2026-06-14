import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const jobId = formData.get('jobId') as string;
    const userId = formData.get('userId') as string;

    if (!file || !jobId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the job belongs to this user
    const { data: job } = await supabase
      .from('jobs')
      .select('id, photos')
      .eq('id', jobId)
      .eq('user_id', userId)
      .single();

    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    // Upload to Supabase Storage
    const filename = `${userId}/${jobId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('job-photos')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
