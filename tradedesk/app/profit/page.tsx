'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Insight {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  icon: string;
}

interface Analysis {
  summary: string;
  monthly_revenue: number;
  avg_job_value: number;
  collection_rate: number;
  insights: Insight[];
  top_recommendation: string;
  pricing_suggestion: string;
}

export default function ProfitAnalyzerPage() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const [q, inv, j] = await Promise.all([
      supabase.from('quotes').select('customer_name, total, status, created_at, line_items').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('invoices').select('customer_name, total, status, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('jobs').select('title, customer_name, status, scheduled_date').eq('user_id', user.id).order('scheduled_date', { ascending: false }).limit(20),
    ]);

    setQuotes(q.data || []);
    setInvoices(inv.data || []);
    setJobs(j.data || []);
    setDataLoaded(true);
  }

  async function runAnalysis() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai-profit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotes, invoices, jobs }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setAnalysis(data);
    } catch (e) {
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const impactColor = {
    high: 'border-red-500/50 bg-red-500/10',
    medium: 'border-yellow-500/50 bg-yellow-500/10',
    low: 'border-blue-500/50 bg-blue-500/10',
  };

  const impactBadge = {
    high: 'bg-red-900/50 text-red-400',
    medium: 'bg-yellow-900/50 text-yellow-400',
    low: 'bg-blue-900/50 text-blue-400',
  };

  return (
    <div className="flex min-h-screen bg-[#0a0f1e]">
      {/* Sidebar */}
      <div className="w-64 bg-[#0d1526] border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">TD</div>
            <span className="text-white font-semibold text-lg">TradeDesk</span>
          </div>
        </div>
        <nav className="p-4 flex-1">
          {[['Dashboard', '/dashboard'], ['Quotes', '/quotes'], ['Invoices', '/invoices'], ['Jobs', '/jobs'], ['WSIB Tracking', '/wsib'], ['AI Profit Analyzer', '/profit'], ['Settings', '/settings']].map(([label, href]) => (
            <a key={href} href={href} className={`block px-4 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors ${href === '/profit' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>{label}</a>
          ))}
        </nav>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <div className="bg-[#0d1526] border-b border-gray-800 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-semibold">AI Profit Analyzer</h1>
            <p className="text-gray-400 text-sm">Get AI-powered insights about your business</p>
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="px-4 py-2 border border-gray-600 text-gray-300 rounded-full text-sm hover:bg-gray-800">Logout</button>
        </div>

        <div className="p-8 space-y-6 max-w-4xl">

          {/* Data summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Quotes Loaded', value: quotes.length, icon: '📋' },
              { label: 'Invoices Loaded', value: invoices.length, icon: '🧾' },
              { label: 'Jobs Loaded', value: jobs.length, icon: '🔧' },
            ].map(stat => (
              <div key={stat.label} className="bg-[#0d1526] border border-gray-800 rounded-xl p-4 flex items-center gap-4">
                <span className="text-3xl">{stat.icon}</span>
                <div>
                  <p className="text-white font-bold text-2xl">{stat.value}</p>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Run Analysis Button */}
          {!analysis && (
            <div className="bg-[#0d1526] border border-gray-800 rounded-xl p-8 text-center">
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="text-white font-bold text-2xl mb-2">Ready to Analyze Your Business</h2>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">Our AI will analyze your quotes, invoices, and jobs to give you actionable insights on how to make more money.</p>
              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
              <button
                onClick={runAnalysis}
                disabled={loading || !dataLoaded}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-bold text-lg disabled:opacity-50 flex items-center gap-3 mx-auto">
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    AI is analyzing your business...
                  </>
                ) : '✨ Run AI Analysis'}
              </button>
            </div>
          )}

          {/* Analysis Results */}
          {analysis && (
            <>
              {/* Summary */}
              <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-700/50 rounded-xl p-6">
                <h2 className="text-white font-bold text-lg mb-2">📊 Business Health Summary</h2>
                <p className="text-gray-300">{analysis.summary}</p>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Monthly Revenue', value: `$${(analysis.monthly_revenue || 0).toLocaleString()}`, color: 'text-green-400' },
                  { label: 'Avg Job Value', value: `$${(analysis.avg_job_value || 0).toLocaleString()}`, color: 'text-blue-400' },
                  { label: 'Collection Rate', value: `${analysis.collection_rate || 0}%`, color: 'text-yellow-400' },
                ].map(metric => (
                  <div key={metric.label} className="bg-[#0d1526] border border-gray-800 rounded-xl p-5">
                    <p className="text-gray-400 text-sm mb-1">{metric.label}</p>
                    <p className={`text-3xl font-bold ${metric.color}`}>{metric.value}</p>
                  </div>
                ))}
              </div>

              {/* Top Recommendation */}
              <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-6">
                <h2 className="text-green-400 font-bold text-lg mb-2">🎯 Top Recommendation</h2>
                <p className="text-gray-300">{analysis.top_recommendation}</p>
              </div>

              {/* Pricing Suggestion */}
              <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-6">
                <h2 className="text-yellow-400 font-bold text-lg mb-2">💰 Pricing Insight</h2>
                <p className="text-gray-300">{analysis.pricing_suggestion}</p>
              </div>

              {/* Insights */}
              <div>
                <h2 className="text-white font-bold text-lg mb-4">📈 Detailed Insights</h2>
                <div className="space-y-3">
                  {analysis.insights?.map((insight, i) => (
                    <div key={i} className={`border rounded-xl p-5 ${impactColor[insight.impact]}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{insight.icon}</span>
                          <div>
                            <h3 className="text-white font-semibold">{insight.title}</h3>
                            <p className="text-gray-400 text-sm mt-1">{insight.description}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${impactBadge[insight.impact]}`}>
                          {insight.impact} impact
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Run Again */}
              <button
                onClick={() => { setAnalysis(null); }}
                className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg text-sm hover:bg-gray-800">
                Run New Analysis
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}