import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { quotes, invoices, jobs } = await req.json();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a business analyst for Ontario trades contractors. 
          Analyze their business data and provide actionable insights.
          Always respond with valid JSON only, no markdown, no explanation.
          Be specific, practical, and focused on making them more money.`
        },
        {
          role: 'user',
          content: `Analyze this contractor's business data and provide insights:

          QUOTES (last 30 days): ${JSON.stringify(quotes)}
          INVOICES: ${JSON.stringify(invoices)}
          JOBS: ${JSON.stringify(jobs)}

          Respond with this exact JSON format:
          {
            "summary": "2-3 sentence overview of their business health",
            "monthly_revenue": number,
            "avg_job_value": number,
            "collection_rate": number,
            "insights": [
              {
                "title": "insight title",
                "description": "specific actionable advice",
                "impact": "high|medium|low",
                "icon": "💰|📈|⚠️|🎯|⏱️"
              }
            ],
            "top_recommendation": "single most important thing they should do right now",
            "pricing_suggestion": "specific advice on whether to raise prices and by how much"
          }`
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = completion.choices[0].message.content || '';
    const parsed = JSON.parse(content);
    return NextResponse.json(parsed);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}