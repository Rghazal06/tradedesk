import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '../../../lib/rateLimit';
import { getAuthUser } from '../../../lib/apiAuth';

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!rateLimit(user.id, 30, 60000)) {
    return NextResponse.json({ error: 'Too many upload requests. Please wait.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64 : null;
    const mimeType = typeof body.mimeType === 'string' && body.mimeType.startsWith('image/') ? body.mimeType : 'image/jpeg';

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }
    if (imageBase64.length > 14_000_000) {
      return NextResponse.json({ error: 'Image too large. Please use a smaller photo.' }, { status: 413 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const filename = `${user.id}/${Date.now()}.jpg`;
    const byteString = atob(imageBase64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    const blob = new Blob([ab], { type: mimeType });

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('receipts')
      .upload(filename, blob, { contentType: mimeType, upsert: true });

    if (!uploadData) {
      return NextResponse.json({ error: uploadError?.message ?? 'Upload failed' }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage.from('receipts').getPublicUrl(filename);
    return NextResponse.json({ success: true, imageUrl: urlData?.publicUrl ?? null });
  } catch (error) {
    console.error('upload-receipt-photo error:', error);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}
