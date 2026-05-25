'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: '⚡' },
  { label: 'Appointments', href: '/appointments', icon: '📅' },
  { label: 'Quotes', href: '/quotes', icon: '📋' },
  { label: 'Invoices', href: '/invoices', icon: '🧾' },
  { label: 'Jobs', href: '/jobs', icon: '🔧' },
  { label: 'WSIB Tracking', href: '/wsib', icon: '🛡️' },
  { label: 'AI Assistant', href: '/assistant', icon: '🤖' },
  { label: 'AI Profit Analyzer', href: '/profit', icon: '📈' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
];

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

const IMPACT_STYLES = {
  high: { bg: '#fef2f2', border: '#fecaca', badge_bg: '#fef2f2', badge_color: '#dc2626', badge_border: '#fecaca' },
  medium: { bg: '#fefce8', border: '#fde047', badge_bg: '#fefce8', badge_color: '#854d0e', badge_border: '#fde047' },
  low: { bg: '#eff6ff', border: '#bfdbfe', badge_bg: '#eff6ff', badge_color: '#1d4ed8', badge_border: '#bfdbfe' },
};

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
    } catch {
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Sidebar */}
      <div style={{ width: '240px', minWidth: '240px', background: 'white', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0 }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', background: '#16a34a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '13px' }}>TD</div>
            <span style={{ fontWeight: '700', fontSize: '16px', color: '#111' }}>TradeDesk</span>
          </div>
        </div>
        <nav style={{ padding: '12px', flex: 1 }}>
          {NAV_ITEMS.map(item => {
            const isActive = item.href === '/profit';
            return (
              <a key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px', borderRadius: '8px', marginBottom: '2px',
                textDecoration: 'none', fontSize: '13.5px',
                fontWeight: isActive ? '600' : '400',
                color: isActive ? '#16a34a' : '#6b7280',
                background: isActive ? '#f0fdf4' : 'transparent',
                border: isActive ? '1px solid #bbf7d0' : '1px solid transparent',
              }}>
                <span>{item.icon}</span>{item.label}
              </a>
            );
          })}
        </nav>
        <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb' }}>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
            style={{ width: '100%', padding: '8px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#6b7280', fontSize: '13px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Top bar */}
        <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: 0 }}>AI Profit Analyzer</h1>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '2px 0 0' }}>Get AI-powered insights to grow your business</p>
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
            style={{ padding: '8px 16px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#6b7280', fontSize: '13px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>

        <div style={{ padding: '32px', overflowY: 'auto', flex: 1, maxWidth: '900px' }}>

          {/* Data Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'Quotes Loaded', value: quotes.length, icon: '📋', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
              { label: 'Invoices Loaded', value: invoices.length, icon: '🧾', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
              { label: 'Jobs Loaded', value: jobs.length, icon: '🔧', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
            ].map(stat => (
              <div key={stat.label} style={{ background: stat.bg, border: `1px solid ${stat.border}`, borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '28px' }}>{stat.icon}</span>
                <div>
                  <p style={{ color: stat.color, fontSize: '28px', fontWeight: '800', margin: 0 }}>{stat.value}</p>
                  <p style={{ color: '#6b7280', fontSize: '13px', margin: '2px 0 0' }}>{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Run Analysis */}
          {!analysis && (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '48px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '56px', marginBottom: '16px' }}>🤖</div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#111', margin: '0 0 12px' }}>Ready to Analyze Your Business</h2>
              <p style={{ color: '#6b7280', fontSize: '15px', maxWidth: '480px', margin: '0 auto 28px', lineHeight: '1.6' }}>
                Our AI will analyze your quotes, invoices, and jobs to give you actionable insights on how to make more money.
              </p>
              {error && <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>{error}</p>}
              <button
                onClick={runAnalysis}
                disabled={loading || !dataLoaded}
                style={{
                  padding: '14px 32px', background: '#16a34a', color: 'white',
                  border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '16px',
                  cursor: 'pointer', opacity: loading || !dataLoaded ? 0.6 : 1,
                  display: 'inline-flex', alignItems: 'center', gap: '10px',
                  boxShadow: '0 4px 14px rgba(22,163,74,0.3)',
                }}>
                {loading ? (
                  <>
                    <svg style={{ animation: 'spin 1s linear infinite', width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none">
                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    AI is analyzing your business...
                  </>
                ) : '✨ Run AI Analysis'}
              </button>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Results */}
          {analysis && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Summary */}
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', borderLeft: '4px solid #16a34a' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111', margin: '0 0 10px' }}>📊 Business Health Summary</h2>
                <p style={{ color: '#374151', fontSize: '15px', lineHeight: '1.7', margin: 0 }}>{analysis.summary}</p>
              </div>

              {/* Key Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {[
                  { label: 'Monthly Revenue', value: `$${(analysis.monthly_revenue || 0).toLocaleString()}`, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
                  { label: 'Avg Job Value', value: `$${(analysis.avg_job_value || 0).toLocaleString()}`, color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
                  { label: 'Collection Rate', value: `${analysis.collection_rate || 0}%`, color: '#854d0e', bg: '#fefce8', border: '#fde047' },
                ].map(metric => (
                  <div key={metric.label} style={{ background: metric.bg, border: `1px solid ${metric.border}`, borderRadius: '12px', padding: '20px' }}>
                    <p style={{ color: '#6b7280', fontSize: '12px', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>{metric.label}</p>
                    <p style={{ color: metric.color, fontSize: '28px', fontWeight: '800', margin: 0 }}>{metric.value}</p>
                  </div>
                ))}
              </div>

              {/* Top Recommendation */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '24px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#15803d', margin: '0 0 10px' }}>🎯 Top Recommendation</h2>
                <p style={{ color: '#374151', fontSize: '15px', lineHeight: '1.7', margin: 0 }}>{analysis.top_recommendation}</p>
              </div>

              {/* Pricing Suggestion */}
              <div style={{ background: '#fefce8', border: '1px solid #fde047', borderRadius: '12px', padding: '24px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#854d0e', margin: '0 0 10px' }}>💰 Pricing Insight</h2>
                <p style={{ color: '#374151', fontSize: '15px', lineHeight: '1.7', margin: 0 }}>{analysis.pricing_suggestion}</p>
              </div>

              {/* Insights */}
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111', margin: '0 0 12px' }}>📈 Detailed Insights</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {analysis.insights?.map((insight, i) => {
                    const style = IMPACT_STYLES[insight.impact];
                    return (
                      <div key={i} style={{ background: style.bg, border: `1px solid ${style.border}`, borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1 }}>
                          <span style={{ fontSize: '24px' }}>{insight.icon}</span>
                          <div>
                            <h3 style={{ color: '#111', fontWeight: '700', fontSize: '14px', margin: '0 0 4px' }}>{insight.title}</h3>
                            <p style={{ color: '#6b7280', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>{insight.description}</p>
                          </div>
                        </div>
                        <span style={{ background: style.badge_bg, color: style.badge_color, border: `1px solid ${style.badge_border}`, borderRadius: '100px', padding: '3px 10px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {insight.impact}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Run Again */}
              <button onClick={() => setAnalysis(null)} style={{ padding: '10px 24px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#374151', fontSize: '14px', fontWeight: '600', cursor: 'pointer', width: 'fit-content' }}>
                Run New Analysis
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}