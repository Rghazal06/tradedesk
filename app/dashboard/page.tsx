'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Sidebar from '../../components/Sidebar';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const FF = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [metrics, setMetrics] = useState({ revenue: 0, hst: 0, unpaid: 0, activeJobs: 0, quotesMonth: 0 });
  const [unpaidInvoices, setUnpaidInvoices] = useState<any[]>([]);
  const [todayAppts, setTodayAppts] = useState<any[]>([]);
  const [recentQuotes, setRecentQuotes] = useState<any[]>([]);
  const [wsibDue, setWsibDue] = useState<any[]>([]);
  const [certExpiry, setCertExpiry] = useState<string | null>(null);
  const [onboardingSteps, setOnboardingSteps] = useState<string[]>([]);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const TOTAL_STEPS = 17;

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data: profile } = await supabase.from('profiles').select('full_name, onboarding_steps, onboarding_dismissed').eq('id', user.id).single();
    if (profile?.full_name) setUserName(profile.full_name.split(' ')[0]);
    setOnboardingSteps(profile?.onboarding_steps || []);
    setOnboardingDismissed(profile?.onboarding_dismissed || false);

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const todayStr = now.toISOString().split('T')[0];
    const in7Days = new Date(now.getTime() + 7 * 86400000).toISOString().split('T')[0];

    const [paidInvoices, unpaidInvs, activeJobsRes, quotesRes, recentQ, appts, wsib, profileRes] = await Promise.all([
      supabase.from('invoices').select('total, hst').eq('user_id', user.id).eq('status', 'paid').gte('created_at', firstOfMonth),
      supabase.from('invoices').select('id, customer_name, total, created_at').eq('user_id', user.id).eq('status', 'unpaid').order('created_at', { ascending: true }).limit(5),
      supabase.from('jobs').select('id').eq('user_id', user.id).in('status', ['scheduled', 'in progress']),
      supabase.from('quotes').select('id').eq('user_id', user.id).gte('created_at', firstOfMonth),
      supabase.from('quotes').select('id, customer_name, total, status, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(6),
      supabase.from('appointments').select('id, customer_name, scheduled_time, job_type, status').eq('user_id', user.id).eq('scheduled_date', todayStr).order('scheduled_time', { ascending: true }),
      supabase.from('wsib_entries').select('id, premium_owing, due_date').eq('user_id', user.id).eq('status', 'pending').lte('due_date', in7Days).order('due_date', { ascending: true }),
      supabase.from('profiles').select('clearance_cert_expiry').eq('id', user.id).single(),
    ]);

    const revenue = paidInvoices.data?.reduce((s, i) => s + (i.total || 0), 0) || 0;
    const hst = paidInvoices.data?.reduce((s, i) => s + (i.hst || 0), 0) || 0;
    setMetrics({ revenue, hst, unpaid: unpaidInvs.data?.length || 0, activeJobs: activeJobsRes.data?.length || 0, quotesMonth: quotesRes.data?.length || 0 });
    setUnpaidInvoices(unpaidInvs.data || []);
    setTodayAppts(appts.data || []);
    setRecentQuotes(recentQ.data || []);
    setWsibDue(wsib.data || []);
    setCertExpiry(profileRes.data?.clearance_cert_expiry || null);
    setLoading(false);
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = new Date().toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' });

  const statusStyle: Record<string, { color: string; bg: string }> = {
    draft:    { color: '#6b7280', bg: '#f3f4f6' },
    sent:     { color: '#2563eb', bg: '#eff6ff' },
    approved: { color: '#16a34a', bg: '#f0fdf4' },
    declined: { color: '#dc2626', bg: '#fef2f2' },
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f4', fontFamily: FF }}>
      <style>{`
        @media (max-width: 768px) {
          .dash-metrics { grid-template-columns: repeat(2, 1fr) !important; }
          .dash-two-col { grid-template-columns: 1fr !important; }
          .dash-pad { padding: 16px !important; }
          .dash-header { padding: 0 16px !important; }
        }
        @media (max-width: 480px) {
          .dash-metrics { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
      <Sidebar activePath="/dashboard" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Page header */}
        <div className="dash-header" style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 32px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>{dateStr}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a href="/quotes/new" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: '#16a34a', color: 'white', borderRadius: '6px', fontWeight: '600', fontSize: '13px', textDecoration: 'none', letterSpacing: '-0.1px' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><line x1="6" y1="1" x2="6" y2="11" stroke="white" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="6" x2="11" y2="6" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
              New Quote
            </a>
          </div>
        </div>

        <div className="dash-pad" style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>

          {loading ? (
            <div style={{ color: '#9ca3af', fontSize: '14px' }}>Loading...</div>
          ) : (
            <>
              {/* Greeting */}
              <div style={{ marginBottom: '28px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0a0a0a', margin: '0 0 2px', letterSpacing: '-0.8px' }}>
                  {greeting}{userName ? `, ${userName}` : ''}.
                </h1>
                <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
                  {todayAppts.length > 0 ? `You have ${todayAppts.length} appointment${todayAppts.length > 1 ? 's' : ''} today.` : metrics.unpaid > 0 ? `${metrics.unpaid} invoice${metrics.unpaid > 1 ? 's' : ''} waiting on payment.` : 'Everything looks good.'}
                </p>
              </div>

              {/* Getting Started card */}
              {!onboardingDismissed && onboardingSteps.length < TOTAL_STEPS && (
                <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '18px 20px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#0a0a0a' }}>Getting started</span>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#16a34a' }}>{onboardingSteps.length} of {TOTAL_STEPS} complete</span>
                      </div>
                      <div style={{ height: '4px', background: '#f3f4f6', borderRadius: '2px', marginBottom: '10px' }}>
                        <div style={{ height: '100%', width: `${(onboardingSteps.length / TOTAL_STEPS) * 100}%`, background: '#16a34a', borderRadius: '2px', transition: 'width 0.3s' }} />
                      </div>
                      <a href="/onboarding" style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600', textDecoration: 'none' }}>
                        {onboardingSteps.length === 0 ? 'Start the setup guide →' : 'Continue setup →'}
                      </a>
                    </div>
                    <button
                      onClick={async () => {
                        setOnboardingDismissed(true);
                        const { data: { user } } = await supabase.auth.getUser();
                        if (user) await supabase.from('profiles').update({ onboarding_dismissed: true }).eq('id', user.id);
                      }}
                      style={{ background: 'none', border: 'none', color: '#d1d5db', fontSize: '20px', cursor: 'pointer', lineHeight: 1, padding: '0', flexShrink: 0 }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              {/* Alerts — only shown when there's something to act on */}
              {(() => {
                const certDate = certExpiry ? new Date(certExpiry) : null;
                const certDays = certDate ? Math.floor((certDate.getTime() - Date.now()) / 86400000) : null;
                const showCertAlert = certDays !== null && certDays <= 30;
                return (unpaidInvoices.length > 0 || wsibDue.length > 0 || showCertAlert) ? (
                <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {showCertAlert && certDate && (
                    <a href="/wsib" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: certDays < 0 ? '#fef2f2' : '#fffbeb', border: `1px solid ${certDays < 0 ? '#fecaca' : '#fde68a'}`, borderRadius: '8px', padding: '12px 16px', textDecoration: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: certDays < 0 ? '#dc2626' : '#d97706', flexShrink: 0 }} />
                        <span style={{ fontSize: '13px', fontWeight: '600', color: certDays < 0 ? '#7f1d1d' : '#78350f' }}>
                          {certDays < 0 ? `WSIB Clearance Certificate expired ${Math.abs(certDays)} days ago — renew immediately` : `WSIB Clearance Certificate expires in ${certDays} days (${certDate.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })})`}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: certDays < 0 ? '#dc2626' : '#d97706', fontWeight: '600' }}>Renew →</span>
                    </a>
                  )}
                  {wsibDue.map(w => (
                    <a key={w.id} href="/wsib" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', textDecoration: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#dc2626', flexShrink: 0 }} />
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#7f1d1d' }}>WSIB payment due {new Date(w.due_date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })} — ${w.premium_owing?.toFixed(2)}</span>
                      </div>
                      <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: '600' }}>File now →</span>
                    </a>
                  ))}
                  {unpaidInvoices.slice(0, 2).map(inv => {
                    const daysOld = Math.floor((Date.now() - new Date(inv.created_at).getTime()) / 86400000);
                    if (daysOld < 7) return null;
                    return (
                      <a key={inv.id} href="/invoices" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px 16px', textDecoration: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d97706', flexShrink: 0 }} />
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#78350f' }}>{inv.customer_name} — ${inv.total?.toFixed(2)} overdue ({daysOld} days)</span>
                        </div>
                        <span style={{ fontSize: '12px', color: '#d97706', fontWeight: '600' }}>Send reminder →</span>
                      </a>
                    );
                  })}
                </div>
                ) : null;
              })()}

              {/* KPI cards */}
              <div className="dash-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
                {[
                  { label: 'Revenue', sub: 'this month', value: `$${metrics.revenue.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: '↑' },
                  { label: 'HST Collected', sub: 'from paid invoices', value: `$${metrics.hst.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: null },
                  { label: 'Unpaid', sub: 'invoices outstanding', value: metrics.unpaid.toString(), color: metrics.unpaid > 0 ? '#dc2626' : '#6b7280', bg: metrics.unpaid > 0 ? '#fef2f2' : 'white', border: metrics.unpaid > 0 ? '#fecaca' : '#e5e7eb', icon: null },
                  { label: 'Active Jobs', sub: 'in progress', value: metrics.activeJobs.toString(), color: '#0a0a0a', bg: 'white', border: '#e5e7eb', icon: null },
                ].map(m => (
                  <div key={m.label} style={{ background: m.bg, border: `1px solid ${m.border}`, borderRadius: '12px', padding: '20px 22px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '0.7px', margin: '0 0 10px' }}>{m.label}</p>
                    <p style={{ fontSize: '36px', fontWeight: '800', color: m.color, margin: '0 0 4px', letterSpacing: '-1.5px', lineHeight: 1 }}>{m.value}</p>
                    <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>{m.sub}</p>
                  </div>
                ))}
              </div>

              {/* Two-column: Recent quotes + Today */}
              <div className="dash-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px' }}>

                {/* Recent quotes */}
                <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#0a0a0a' }}>Recent Quotes</span>
                    <a href="/quotes" style={{ fontSize: '12px', color: '#6b7280', textDecoration: 'none', fontWeight: '500' }}>View all</a>
                  </div>
                  {recentQuotes.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                      <p style={{ color: '#9ca3af', fontSize: '13px', margin: '0 0 12px' }}>No quotes yet</p>
                      <a href="/quotes/new" style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600', textDecoration: 'none' }}>Create your first quote →</a>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {['Customer', 'Amount', 'Date', 'Status'].map(h => (
                            <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f3f4f6' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {recentQuotes.map(q => {
                          const s = statusStyle[q.status] || { color: '#6b7280', bg: '#f3f4f6' };
                          return (
                            <tr key={q.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                              <td style={{ padding: '12px 20px', fontSize: '13px', fontWeight: '500', color: '#0a0a0a' }}>{q.customer_name || '—'}</td>
                              <td style={{ padding: '12px 20px', fontSize: '13px', fontWeight: '700', color: '#16a34a' }}>${q.total?.toFixed(2)}</td>
                              <td style={{ padding: '12px 20px', fontSize: '12px', color: '#9ca3af' }}>{new Date(q.created_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}</td>
                              <td style={{ padding: '12px 20px' }}>
                                <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', color: s.color, background: s.bg }}>
                                  {q.status || 'draft'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Right column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {/* Today's appointments */}
                  <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#0a0a0a' }}>Today</span>
                      <a href="/appointments" style={{ fontSize: '12px', color: '#6b7280', textDecoration: 'none', fontWeight: '500' }}>Schedule</a>
                    </div>
                    {todayAppts.length === 0 ? (
                      <div style={{ padding: '24px 20px', textAlign: 'center' }}>
                        <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>No appointments today</p>
                      </div>
                    ) : (
                      <div>
                        {todayAppts.map((a, i) => (
                          <div key={a.id} style={{ padding: '12px 20px', borderBottom: i < todayAppts.length - 1 ? '1px solid #f9fafb' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a' }}>{a.scheduled_time?.slice(0, 5) || '—'}</span>
                            </div>
                            <div>
                              <p style={{ fontSize: '13px', fontWeight: '600', color: '#0a0a0a', margin: '0 0 1px' }}>{a.customer_name}</p>
                              <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>{a.job_type}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quick actions */}
                  <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#0a0a0a' }}>Quick Actions</span>
                    </div>
                    <div>
                      {[
                        { label: 'Create invoice', href: '/invoices', desc: 'Bill a completed job' },
                        { label: 'Log WSIB hours', href: '/wsib', desc: 'Record reportable earnings' },
                        { label: 'Book appointment', href: '/appointments', desc: 'Schedule with a customer' },
                        { label: 'Scan a receipt', href: '/receipts', desc: 'Capture expenses on site' },
                      ].map((action, i, arr) => (
                        <a key={action.href} href={action.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', minHeight: '56px', borderBottom: i < arr.length - 1 ? '1px solid #f9fafb' : 'none', textDecoration: 'none' }}>
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: '600', color: '#0a0a0a', margin: '0 0 2px' }}>{action.label}</p>
                            <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>{action.desc}</p>
                          </div>
                          <svg width="16" height="16" viewBox="0 0 14 14" fill="none" style={{ color: '#d1d5db', flexShrink: 0 }}><path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
