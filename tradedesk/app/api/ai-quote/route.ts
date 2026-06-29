import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { rateLimit } from '../../../lib/rateLimit';
import { getAuthUser } from '../../../lib/apiAuth';
import { sanitizeString } from '../../../lib/validate';

export async function POST(req: NextRequest) {
  // Auth required
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 15 AI quote generations per minute per user
  if (!rateLimit(user.id, 15, 60000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const body = await req.json();
    const jobDescription = sanitizeString(body.jobDescription || '', 2000);
    const tradeType = sanitizeString(body.tradeType || '', 100);

    if (!jobDescription) {
      return NextResponse.json({ error: 'Job description is required.' }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert estimator for Ontario, Canada trades businesses.
          Generate realistic, professional quote line items for the job described.
          Always respond with valid JSON only, no markdown, no explanation.
          Use Canadian dollar amounts appropriate for Ontario market rates in 2025.
          Include labour, materials, and any applicable fees.
          HST will be added separately at 13%.`
        },
        {
          role: 'user',
          content: `Generate quote line items for this job:
          Trade Type: ${tradeType || 'General Contractor'}
          Job Description: ${jobDescription}

          Respond with this exact JSON format:
          {
            "line_items": [
              {
                "description": "item description",
                "quantity": 1,
                "unit_price": 150.00
              }
            ],
            "notes": "Professional payment terms and warranty info for Ontario contractor"
          }`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = completion.choices[0].message.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI could not generate a quote. Please try again.' }, { status: 422 });
    }
    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('ai-quote error:', error);
    return NextResponse.json({ error: 'Quote generation failed. Please try again.' }, { status: 500 });
  }
}
