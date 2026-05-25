import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, userId } = body;

    if (!message) return NextResponse.json({ error: 'No message provided' }, { status: 400 });
    if (!userId) return NextResponse.json({ reply: 'Please log in to use the AI assistant.' });

    const [quotesRes, invoicesRes, jobsRes, wsibRes] = await Promise.all([
      supabase.from('quotes').select('customer_name, total, status, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
      supabase.from('invoices').select('customer_name, total, status, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
      supabase.from('jobs').select('title, customer_name, status, scheduled_date').eq('user_id', userId).order('scheduled_date', { ascending: false }).limit(10),
      supabase.from('wsib_entries').select('premium_owing, status, due_date').eq('user_id', userId).order('due_date', { ascending: true }).limit(5),
    ]);

    const quotes = quotesRes.data || [];
    const invoices = invoicesRes.data || [];
    const jobs = jobsRes.data || [];
    const wsib = wsibRes.data || [];

    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0);
    const unpaidInvoices = invoices.filter(i => i.status === 'unpaid');
    const activeJobs = jobs.filter(j => j.status !== 'completed' && j.status !== 'cancelled');
    const unpaidWSIB = wsib.filter(w => w.status !== 'paid');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are TradeDesk AI, a friendly business assistant for Ontario contractors.
          
          Here is the contractor's real business data:
          - Total Revenue (paid invoices): $${totalRevenue.toFixed(2)}
          - Unpaid Invoices: ${unpaidInvoices.length} totaling $${unpaidInvoices.reduce((s, i) => s + (i.total || 0), 0).toFixed(2)}
          - Active Jobs: ${activeJobs.length}
          - Total Quotes: ${quotes.length}
          - Pending WSIB payments: ${unpaidWSIB.length}
          
          Recent Quotes: ${JSON.stringify(quotes)}
          Recent Invoices: ${JSON.stringify(invoices)}
          Recent Jobs: ${JSON.stringify(jobs)}
          WSIB Entries: ${JSON.stringify(wsib)}
          
          Be concise, friendly, and use real numbers from their data.
          Respond in plain conversational English.
          You understand Ontario-specific things like WSIB, HST, and Skilled Trades Ontario.`
        },
        { role: 'user', content: message }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const reply = completion.choices[0].message.content || 'I could not generate a response.';
    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('AI Assistant error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
