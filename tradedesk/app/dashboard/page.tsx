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
  { label: 'AI Profit Analyzer', href: '/profit', icon: '🤖' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({ quotes: 0, unpaidInvoices: 0, activeJobs: 0, revenue: 0 });
  const [recentQuotes, setRecentQuotes] = useState<any[]>([]);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
    if (profile?.full_name) setUserName(profile.full_name.split(' ')[0]);

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [quotes, invoices, jobs, paidInvoices, recentQ] = await Promise.all([
      supabase.from('quotes').select('id').eq('user_id', user.id).gte('created_at', firstOfMonth),
      supabase.from('invoices').select('id').eq('user_id', user.id).eq('status', 'unpaid'),
      supabase.from('jobs').select('id').eq('user_id', user.id).in('status', ['scheduled', 'in progress']),
      supabase.from('invoices').select('total').eq('user_id', user.id).eq('status', 'paid').gte('created_at', firstOfMonth),
      supabase.from('quotes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    ]);

    const revenue = paidInvoices.data?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;
    setStats({
      quotes: quotes.data?.length || 0,
      unpaidInvoices: invoices.data?.length || 0,
      activeJobs: jobs.data?.length || 0,
      revenue,
    });
    setRecentQuotes(recentQ.data || []);
    setLoading(false);
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
            const isActive = item.href === '/dashboard';
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
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: 0 }}>
              {userName ? `Welcome back, ${userName} 👋` : 'Dashboard'}
            </h1>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '2px 0 0' }}>Here's what's happening with your business</p>
          </div>
          <a href="/quotes/new" style={{
            padding: '10px 20px', background: '#16a34a', color: 'white',
            borderRadius: '8px', fontWeight: '600', fontSize: '14px',
            textDecoration: 'none', boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
          }}>+ New Quote</a>
        </div>

        <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ color: '#9ca3af', textAlign: 'center', paddingTop: '80px' }}>Loading...</div>
          ) : (
            <>
              {/* Stat Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                {[
                  { label: 'Quotes This Month', value: stats.quotes, color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', icon: '📋' },
                  { label: 'Unpaid Invoices', value: stats.unpaidInvoices, color: '#ef4444', bg: '#fef2f2', border: '#fecaca', icon: '⚠️' },
                  { label: 'Active Jobs', value: stats.activeJobs, color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', icon: '🔧' },
                  { label: 'Revenue This Month', value: `$${stats.revenue.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: '💰' },
                ].map(stat => (
                  <div key={stat.label} style={{ background: stat.bg, border: `1px solid ${stat.border}`, borderRadius: '12px', padding: '20px' }}>
                    <div style={{ fontSize: '20px', marginBottom: '8px' }}>{stat.icon}</div>
                    <p style={{ color: '#6b7280', fontSize: '12px', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>{stat.label}</p>
                    <p style={{ color: stat.color, fontSize: '26px', fontWeight: '800', margin: 0 }}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '32px' }}>
                {[
                  { label: 'New Quote', href: '/quotes/new', icon: '✨', desc: 'AI-powered' },
                  { label: 'Appointments', href: '/appointments', icon: '📅', desc: 'Schedule jobs' },
                  { label: 'WSIB Tracking', href: '/wsib', icon: '🛡️', desc: 'Ontario compliance' },
                  { label: 'AI Analyzer', href: '/profit', icon: '🤖', desc: 'Business insights' },
                ].map(action => (
                  <a key={action.href} href={action.href} style={{
                    background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px',
                    padding: '16px', textDecoration: 'none', display: 'block',
                  }}>
                    <span style={{ fontSize: '22px', display: 'block', marginBottom: '6px' }}>{action.icon}</span>
                    <p style={{ color: '#111', fontSize: '13px', fontWeight: '600', margin: '0 0 2px' }}>{action.label}</p>
                    <p style={{ color: '#9ca3af', fontSize: '11px', margin: 0 }}>{action.desc}</p>
                  </a>
                ))}
              </div>

              {/* Recent Quotes */}
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ color: '#111', fontSize: '15px', fontWeight: '700', margin: 0 }}>Recent Quotes</h2>
                  <a href="/quotes" style={{ color: '#16a34a', fontSize: '13px', textDecoration: 'none', fontWeight: '500' }}>View all →</a>
                </div>
                {recentQuotes.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                    No quotes yet. <a href="/quotes/new" style={{ color: '#16a34a' }}>Create your first quote</a>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                        {['Customer', 'Total', 'Date', 'Action'].map(h => (
                          <th key={h} style={{ padding: '12px 24px', textAlign: 'left', color: '#6b7280', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentQuotes.map(quote => (
                        <tr key={quote.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                          <td style={{ padding: '14px 24px', color: '#111', fontSize: '14px', fontWeight: '500' }}>{quote.customer_name || '—'}</td>
                          <td style={{ padding: '14px 24px', color: '#16a34a', fontSize: '14px', fontWeight: '600' }}>${quote.total?.toFixed(2)}</td>
                          <td style={{ padding: '14px 24px', color: '#6b7280', fontSize: '13px' }}>{new Date(quote.created_at).toLocaleDateString('en-CA')}</td>
                          <td style={{ padding: '14px 24px' }}>
                            <a href="/quotes" style={{ color: '#16a34a', fontSize: '13px', textDecoration: 'none', fontWeight: '500' }}>View →</a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}