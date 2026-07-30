import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '../../../lib/rateLimit';
import { getAuthUser } from '../../../lib/apiAuth';

// Service-role client — used to fetch the user's actual data server-side
// so the client cannot inject arbitrary data into the AI analysis
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  // Auth required
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 5 profit analyses per minute per user
  if (!rateLimit(user.id, 5, 60000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    // Fetch data server-side — never trust client-supplied business data for AI analysis
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [quotesRes, invoicesRes, jobsRes] = await Promise.all([
      supabase.from('quotes').select('customer_name, total, subtotal, status, created_at')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('invoices').select('customer_name, total, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('jobs').select('title, customer_name, status, scheduled_date')
        .eq('user_id', user.id)
        .order('scheduled_date', { ascending: false })
        .limit(30),
    ]);

    const quotes = quotesRes.data || [];
    const invoices = invoicesRes.data || [];
    const jobs = jobsRes.data || [];

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
                "impact": "high|medium|low"
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
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 422 });
    }
    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('ai-profit error:', error);
    return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 });
  }
}
