import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const { jobDescription, tradeType } = await req.json();

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
    const parsed = JSON.parse(content);
    
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('AI Quote error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}