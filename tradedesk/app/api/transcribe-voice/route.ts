import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAuthUser } from '../../../lib/apiAuth';
import { rateLimit } from '../../../lib/rateLimit';

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!rateLimit(`voice-${user.id}`, 20, 60000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;
    if (!audioFile) return NextResponse.json({ error: 'No audio file' }, { status: 400 });

    // 10 MB max
    if (audioFile.size > 10_000_000) {
      return NextResponse.json({ error: 'Audio file too large.' }, { status: 413 });
    }

    // Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
    });

    const rawText = transcription.text?.trim();
    if (!rawText) return NextResponse.json({ error: 'No speech detected.' }, { status: 422 });

    // Clean up with GPT-4o-mini — turns rambling field notes into a professional update
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional note-taker for a trades contractor in Ontario, Canada.
The contractor recorded a quick voice memo about their job site.
Clean up the transcript into a clear, professional job note:
- Fix grammar and remove filler words (um, uh, like, you know)
- Keep all factual details exactly as stated
- Write in first person past/present tense
- Keep it concise — one to three sentences max unless more detail was given
- Never add information that wasn't mentioned
Return only the cleaned note text, no labels or preamble.`,
        },
        { role: 'user', content: rawText },
      ],
      max_tokens: 300,
      temperature: 0.2,
    });

    const text = completion.choices[0].message.content?.trim() || rawText;
    return NextResponse.json({ text, raw: rawText });
  } catch (error) {
    console.error('transcribe-voice error:', error);
    return NextResponse.json({ error: 'Transcription failed. Please try again.' }, { status: 500 });
  }
}
