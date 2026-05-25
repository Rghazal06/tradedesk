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
  { label: 'Clients', href: '/clients', icon: '👥' },
  { label: 'AI Assistant', href: '/assistant', icon: '🤖' },
  { label: 'AI Profit Analyzer', href: '/profit', icon: '📈' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
];

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  scheduled: { bg: '#fefce8', color: '#854d0e', border: '#fde047' },
  'in progress': { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  completed: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  cancelled: { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
};

interface Job {
  id: string;
  title: string;
  customer_name: string;
  customer_phone: string;
  scheduled_date: string;
  status: string;
  notes: string;
}

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [googleReviewLink, setGoogleReviewLink] = useState('');
  const [contractorName, setContractorName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', customer_name: '', customer_phone: '', scheduled_date: '', notes: '' });

  useEffect(() => { loadJobs(); }, []);

  async function loadJobs() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    const { data: profile } = await supabase.from('profiles').select('google_review_link, company_name, full_name').eq('id', user.id).single();
    if (profile) {
      setGoogleReviewLink(profile.google_review_link || '');
      setContractorName(profile.company_name || profile.full_name || 'Your Contractor');
    }
    const { data } = await supabase.from('jobs').select('*').eq('user_id', user.id).order('scheduled_date', { ascending: true });
    setJobs(data || []);
    setLoading(false);
  }

  async function saveJob() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('jobs').insert({ user_id: user.id, ...form, status: 'scheduled' });
    if (error) { setMessage('Error: ' + error.message); }
    else { setMessage('Job created!'); setForm({ title: '', customer_name: '', customer_phone: '', scheduled_date: '', notes: '' }); setShowForm(false); loadJobs(); }
    setSaving(false);
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('jobs').update({ status }).eq('id', id);
    loadJobs();
  }

  async function completeAndRequestReview(job: Job) {
    await updateStatus(job.id, 'completed');
    if (job.customer_phone) {
      const res = await fetch('/api/send-review-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerPhone: job.customer_phone, customerName: job.customer_name, contractorName, googleReviewLink: googleReviewLink || 'https://g.page/r/review' })
      });
      const data = await res.json();
      if (data.success) setMessage('Job completed! Review request SMS sent ⭐');
      else setMessage('Job completed! SMS failed: ' + data.error);
    } else {
      setMessage('Job completed! Add customer phone next time to send review request.');
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
            const isActive = item.href === '/jobs';
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
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: 0 }}>Jobs</h1>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '2px 0 0' }}>Manage and track all your jobs</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{
            padding: '10px 20px', background: '#16a34a', color: 'white',
            borderRadius: '8px', fontWeight: '600', fontSize: '14px',
            border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
          }}>+ Create Job</button>
        </div>

        <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>

          {message && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#15803d', fontSize: '14px' }}>
              {message}
            </div>
          )}

          {/* Create Job Form */}
          {showForm && (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111', margin: '0 0 20px' }}>Create New Job</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {[
                  { label: 'Job Title', key: 'title', placeholder: 'Kitchen rewire' },
                  { label: 'Customer Name', key: 'customer_name', placeholder: 'John Smith' },
                  { label: 'Customer Phone', key: 'customer_phone', placeholder: '519-555-0000' },
                  { label: 'Scheduled Date', key: 'scheduled_date', placeholder: '', type: 'date' },
                ].map(field => (
                  <div key={field.key}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{field.label}</label>
                    <input
                      type={field.type || 'text'}
                      value={(form as any)[field.key]}
                      onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111', background: '#f9fafb', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notes</label>
                  <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any notes..."
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111', background: '#f9fafb', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button onClick={saveJob} disabled={saving} style={{ padding: '10px 24px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Creating...' : 'Create Job'}
                </button>
                <button onClick={() => setShowForm(false)} style={{ padding: '10px 24px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Jobs Table */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
              <h2 style={{ color: '#111', fontSize: '15px', fontWeight: '700', margin: 0 }}>All Jobs</h2>
            </div>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
            ) : jobs.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔧</div>
                <p style={{ margin: '0 0 16px', fontWeight: '500', color: '#374151' }}>No jobs yet</p>
                <button onClick={() => setShowForm(true)} style={{ background: '#16a34a', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                  Create your first job
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      {['Job Title', 'Customer', 'Phone', 'Scheduled Date', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '12px 24px', textAlign: 'left', color: '#6b7280', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map(job => {
                      const statusStyle = STATUS_STYLES[job.status] || { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' };
                      return (
                        <tr key={job.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                          <td style={{ padding: '14px 24px', color: '#111', fontSize: '14px', fontWeight: '500' }}>{job.title}</td>
                          <td style={{ padding: '14px 24px', color: '#374151', fontSize: '14px' }}>{job.customer_name}</td>
                          <td style={{ padding: '14px 24px', color: '#6b7280', fontSize: '13px' }}>{job.customer_phone || '—'}</td>
                          <td style={{ padding: '14px 24px', color: '#374151', fontSize: '13px' }}>{job.scheduled_date ? new Date(job.scheduled_date + 'T00:00:00').toLocaleDateString('en-CA') : '—'}</td>
                          <td style={{ padding: '14px 24px' }}>
                            <span style={{ background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`, borderRadius: '100px', padding: '3px 10px', fontSize: '12px', fontWeight: '600' }}>
                              {job.status}
                            </span>
                          </td>
                          <td style={{ padding: '14px 24px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {job.status === 'scheduled' && (
                                <button onClick={() => updateStatus(job.id, 'in progress')}
                                  style={{ padding: '6px 12px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                  Start
                                </button>
                              )}
                              {job.status === 'in progress' && (
                                <button onClick={() => completeAndRequestReview(job)}
                                  style={{ padding: '6px 12px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                  Complete & Review ⭐
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}