'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Sidebar from '../../components/Sidebar';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);


interface WSIBEntry {
  id: string;
  period_start: string;
  period_end: string;
  reportable_earnings: number;
  wsib_rate: number;
  premium_owing: number;
  due_date: string;
  status: string;
  notes: string;
}

export default function WSIBPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<WSIBEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    period_start: '', period_end: '', reportable_earnings: '',
    wsib_rate: '1.69', due_date: '', notes: '',
  });
  const [userId, setUserId] = useState('');
  const [certExpiry, setCertExpiry] = useState('');
  const [certNumber, setCertNumber] = useState('');
  const [editingCert, setEditingCert] = useState(false);
  const [certSaving, setCertSaving] = useState(false);

  const premiumOwing = ((parseFloat(form.reportable_earnings) || 0) * ((parseFloat(form.wsib_rate) || 0) / 100)).toFixed(2);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUserId(user.id);
    const [entriesRes, profileRes] = await Promise.all([
      supabase.from('wsib_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('clearance_cert_expiry, clearance_cert_number').eq('id', user.id).single(),
    ]);
    setEntries(entriesRes.data || []);
    if (profileRes.data) {
      setCertExpiry(profileRes.data.clearance_cert_expiry || '');
      setCertNumber(profileRes.data.clearance_cert_number || '');
    }
    setLoading(false);
  }

  async function loadEntries() {
    const { data } = await supabase.from('wsib_entries').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    setEntries(data || []);
  }

  async function saveCert() {
    if (!userId) return;
    setCertSaving(true);
    await supabase.from('profiles').update({ clearance_cert_expiry: certExpiry || null, clearance_cert_number: certNumber || null }).eq('id', userId);
    setEditingCert(false);
    setCertSaving(false);
    setMessage('Clearance certificate updated.');
    setTimeout(() => setMessage(''), 3000);
  }

  async function saveEntry() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('wsib_entries').insert({
      user_id: user.id,
      period_start: form.period_start,
      period_end: form.period_end,
      reportable_earnings: parseFloat(form.reportable_earnings),
      wsib_rate: parseFloat(form.wsib_rate),
      due_date: form.due_date,
      notes: form.notes,
      premium_owing: parseFloat(premiumOwing),
      status: 'pending',
    });
    if (error) { setMessage('Something went wrong. Please try again.'); }
    else {
      setMessage('WSIB entry saved!');
      setForm({ period_start: '', period_end: '', reportable_earnings: '', wsib_rate: '1.69', due_date: '', notes: '' });
      setShowForm(false);
      await loadEntries();
    }
    setSaving(false);
  }

  async function markAsPaid(id: string) {
    await supabase.from('wsib_entries').update({ status: 'paid' }).eq('id', id);
    loadEntries();
  }

  async function deleteEntry(id: string) {
    if (!confirm('Delete this WSIB entry? This cannot be undone.')) return;
    await supabase.from('wsib_entries').delete().eq('id', id);
    loadEntries();
  }

  const totalOwing = entries.filter(e => e.status !== 'paid').reduce((sum, e) => sum + e.premium_owing, 0);
  const totalPaid = entries.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.premium_owing, 0);
  const nextDue = entries.filter(e => e.status === 'pending').sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];
  const overdue = entries.filter(e => e.status === 'pending' && new Date(e.due_date) < new Date());

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f4', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Sidebar activePath="/wsib" />

      

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Top bar */}
        <div className="td-topbar" style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: 0 }}>WSIB Tracking</h1>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '2px 0 0' }}>Ontario workplace insurance compliance</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{
            padding: '10px 20px', background: '#16a34a', color: 'white',
            borderRadius: '8px', fontWeight: '600', fontSize: '14px',
            border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
          }}>+ Log WSIB Period</button>
        </div>

        <div className="td-body" style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>

          {message && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#15803d', fontSize: '14px' }}>
              {message}
            </div>
          )}

          {/* Overdue warning */}
          {overdue.length > 0 && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '14px 16px', marginBottom: '20px', color: '#991b1b', fontSize: '14px', fontWeight: '500' }}>
              You have {overdue.length} overdue WSIB payment{overdue.length > 1 ? 's' : ''}. File immediately to avoid penalties.
            </div>
          )}

          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'Total Owing', value: `$${totalOwing.toFixed(2)}`, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
              { label: 'Next Due Date', value: nextDue ? new Date(nextDue.due_date).toLocaleDateString('en-CA') : '—', color: '#111', bg: '#f9fafb', border: '#e5e7eb' },
              { label: 'Total Paid This Year', value: `$${totalPaid.toFixed(2)}`, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
            ].map(card => (
              <div key={card.label} style={{ background: card.bg, border: `1px solid ${card.border}`, borderRadius: '12px', padding: '20px' }}>
                <p style={{ color: '#6b7280', fontSize: '12px', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>{card.label}</p>
                <p style={{ color: card.color, fontSize: '26px', fontWeight: '800', margin: 0 }}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* Clearance Certificate Card */}
          {(() => {
            const today = new Date();
            const expiry = certExpiry ? new Date(certExpiry) : null;
            const daysUntil = expiry ? Math.floor((expiry.getTime() - today.getTime()) / 86400000) : null;
            const isExpired = expiry && expiry < today;
            const isWarning = daysUntil !== null && daysUntil <= 30 && !isExpired;
            const certColor = isExpired ? '#dc2626' : isWarning ? '#d97706' : '#16a34a';
            const certBg = isExpired ? '#fef2f2' : isWarning ? '#fffbeb' : '#f0fdf4';
            const certBorder = isExpired ? '#fecaca' : isWarning ? '#fde68a' : '#bbf7d0';
            const certLabel = isExpired ? 'EXPIRED' : isWarning ? `Expires in ${daysUntil}d` : expiry ? 'Active' : 'Not Set';
            return (
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: editingCert ? '20px' : '0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '700', color: '#111', margin: '0 0 2px' }}>WSIB Clearance Certificate</p>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Required to work for general contractors in Ontario</p>
                    </div>
                    <span style={{ background: certBg, color: certColor, border: `1px solid ${certBorder}`, borderRadius: '100px', padding: '3px 10px', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                      {certLabel}
                    </span>
                    {expiry && !isExpired && (
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        Expires {expiry.toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}
                        {certNumber && ` · #${certNumber}`}
                      </span>
                    )}
                    {isExpired && expiry && (
                      <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: '600' }}>
                        Expired {expiry.toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })} — renew now
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <a href="https://www.wsib.ca/en/clearance-certificates" target="_blank" rel="noreferrer"
                      style={{ fontSize: '12px', color: '#6b7280', textDecoration: 'none', padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontWeight: '500' }}>
                      Get Clearance
                    </a>
                    <button onClick={() => setEditingCert(!editingCert)}
                      style={{ fontSize: '12px', fontWeight: '600', color: '#374151', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer' }}>
                      {editingCert ? 'Cancel' : 'Edit'}
                    </button>
                  </div>
                </div>
                {editingCert && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Certificate Number</label>
                      <input value={certNumber} onChange={e => setCertNumber(e.target.value)} placeholder="e.g. 1234567"
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111', background: '#f9fafb', boxSizing: 'border-box' as const }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Expiry Date</label>
                      <input type="date" value={certExpiry} onChange={e => setCertExpiry(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111', background: '#f9fafb', boxSizing: 'border-box' as const }} />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <button onClick={saveCert} disabled={certSaving}
                        style={{ padding: '10px 24px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', opacity: certSaving ? 0.7 : 1 }}>
                        {certSaving ? 'Saving...' : 'Save Certificate'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Form */}
          {showForm && (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111', margin: '0 0 20px' }}>Log New WSIB Period</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {[
                  { label: 'Period Start', key: 'period_start', type: 'date' },
                  { label: 'Period End', key: 'period_end', type: 'date' },
                  { label: 'Reportable Earnings ($)', key: 'reportable_earnings', type: 'number', placeholder: '5000.00' },
                  { label: 'WSIB Rate (%)', key: 'wsib_rate', type: 'number', placeholder: '1.69' },
                  { label: 'Due Date', key: 'due_date', type: 'date' },
                ].map(field => (
                  <div key={field.key}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{field.label}</label>
                    <input
                      type={field.type}
                      value={(form as any)[field.key]}
                      onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111', background: '#f9fafb', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Premium Owing (auto)</label>
                  <div style={{ padding: '10px 12px', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '14px', fontWeight: '700', color: '#16a34a', background: '#f0fdf4' }}>
                    ${premiumOwing}
                  </div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notes</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Any additional notes..."
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111', background: '#f9fafb', resize: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button onClick={saveEntry} disabled={saving} style={{ padding: '10px 24px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving...' : 'Save WSIB Entry'}
                </button>
                <button onClick={() => setShowForm(false)} style={{ padding: '10px 24px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
              <h2 style={{ color: '#111', fontSize: '15px', fontWeight: '700', margin: 0 }}>WSIB History</h2>
            </div>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
            ) : entries.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
                <div style={{ width: '48px', height: '48px', margin: '0 auto 16px', background: '#f3f4f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 2L19 5.5v5C19 15 15.5 19 11 21 6.5 19 3 15 3 10.5v-5z" stroke="#9ca3af" strokeWidth="1.5" strokeLinejoin="round"/><path d="M7.5 11l2 2L14 9" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <p style={{ margin: '0 0 6px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>No WSIB entries yet</p>
                <p style={{ margin: '0 0 20px', fontSize: '13px' }}>Log your premiums each reporting period</p>
                <button onClick={() => setShowForm(true)} style={{ background: '#16a34a', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                  Log your first period
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      {['Period', 'Reportable Earnings', 'Premium Owing', 'Due Date', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '12px 24px', textAlign: 'left', color: '#6b7280', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map(entry => {
                      const isOverdue = entry.status === 'pending' && new Date(entry.due_date) < new Date();
                      const statusStyle = entry.status === 'paid'
                        ? { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', label: 'paid' }
                        : isOverdue
                        ? { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'overdue' }
                        : { bg: '#fefce8', color: '#854d0e', border: '#fde047', label: 'pending' };
                      return (
                        <tr key={entry.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                          <td style={{ padding: '14px 24px', color: '#111', fontSize: '13px' }}>
                            {new Date(entry.period_start).toLocaleDateString('en-CA')} – {new Date(entry.period_end).toLocaleDateString('en-CA')}
                          </td>
                          <td style={{ padding: '14px 24px', color: '#374151', fontSize: '14px' }}>${entry.reportable_earnings.toFixed(2)}</td>
                          <td style={{ padding: '14px 24px', color: '#111', fontSize: '14px', fontWeight: '600' }}>${entry.premium_owing.toFixed(2)}</td>
                          <td style={{ padding: '14px 24px', color: isOverdue ? '#dc2626' : '#374151', fontSize: '13px', fontWeight: isOverdue ? '600' : '400' }}>
                            {new Date(entry.due_date).toLocaleDateString('en-CA')}
                          </td>
                          <td style={{ padding: '14px 24px' }}>
                            <span style={{ background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`, borderRadius: '100px', padding: '3px 10px', fontSize: '12px', fontWeight: '600' }}>
                              {statusStyle.label}
                            </span>
                          </td>
                          <td style={{ padding: '14px 24px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {entry.status !== 'paid' && (
                                <button onClick={() => markAsPaid(entry.id)}
                                  style={{ padding: '6px 12px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                  Mark Paid
                                </button>
                              )}
                              <button onClick={() => deleteEntry(entry.id)}
                                style={{ padding: '6px 12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                Delete
                              </button>
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