'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Sidebar from '../../components/Sidebar';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TRADES = ['Electrician', 'Plumber', 'HVAC', 'General Contractor', 'Roofer', 'Carpenter', 'Painter', 'Welder', 'Mason', 'Other'];

interface CrewMember {
  id: string;
  name: string;
  trade: string;
  email: string;
  phone: string;
  wsib_number: string;
  wsib_expiry: string;
  rate_type: string;
  hourly_rate: number;
  status: string;
  notes: string;
  created_at: string;
}

const emptyForm = {
  name: '', trade: '', email: '', phone: '',
  wsib_number: '', wsib_expiry: '',
  rate_type: 'hourly', hourly_rate: '',
  status: 'active', notes: '',
};

const inputStyle = {
  width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb',
  borderRadius: '8px', fontSize: '14px', color: '#111',
  background: '#f9fafb', boxSizing: 'border-box' as const,
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: 600,
  color: '#374151', marginBottom: '6px',
  textTransform: 'uppercase', letterSpacing: '0.5px',
};

export default function CrewPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUserId(user.id);
    await loadCrew(user.id);
  }

  async function loadCrew(uid: string) {
    const { data } = await supabase
      .from('crew_members')
      .select('*')
      .eq('user_id', uid)
      .order('name', { ascending: true });
    setCrew(data || []);
    setLoading(false);
  }

  function openAdd() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(member: CrewMember) {
    setForm({
      name: member.name || '',
      trade: member.trade || '',
      email: member.email || '',
      phone: member.phone || '',
      wsib_number: member.wsib_number || '',
      wsib_expiry: member.wsib_expiry || '',
      rate_type: member.rate_type || 'hourly',
      hourly_rate: member.hourly_rate?.toString() || '',
      status: member.status || 'active',
      notes: member.notes || '',
    });
    setEditingId(member.id);
    setShowForm(true);
  }

  async function saveMember() {
    if (!form.name.trim()) { setMessage('Name is required.'); return; }
    setSaving(true);
    const payload = {
      user_id: userId,
      name: form.name.trim(),
      trade: form.trade,
      email: form.email,
      phone: form.phone,
      wsib_number: form.wsib_number,
      wsib_expiry: form.wsib_expiry || null,
      rate_type: form.rate_type,
      hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : null,
      status: form.status,
      notes: form.notes,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('crew_members').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('crew_members').insert(payload));
    }

    if (error) {
      setMessage('Something went wrong. Please try again.');
    } else {
      setMessage(editingId ? 'Crew member updated.' : 'Crew member added.');
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await loadCrew(userId);
    }
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  }

  async function deleteMember(id: string) {
    if (!confirm('Remove this crew member?')) return;
    await supabase.from('crew_members').delete().eq('id', id);
    await loadCrew(userId);
  }

  async function toggleStatus(member: CrewMember) {
    const newStatus = member.status === 'active' ? 'inactive' : 'active';
    await supabase.from('crew_members').update({ status: newStatus }).eq('id', member.id);
    await loadCrew(userId);
  }

  const filtered = filterStatus === 'all' ? crew : crew.filter(c => c.status === filterStatus);
  const active = crew.filter(c => c.status === 'active').length;
  const inactive = crew.filter(c => c.status === 'inactive').length;

  const wsibWarnings = crew.filter(c => {
    if (!c.wsib_expiry) return false;
    const days = Math.floor((new Date(c.wsib_expiry).getTime() - Date.now()) / 86400000);
    return days <= 30;
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f4', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Sidebar activePath="/crew" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Top bar */}
        <div className="td-topbar" style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: 0 }}>Crew & Subcontractors</h1>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '2px 0 0' }}>Manage your team and track their WSIB compliance</p>
          </div>
          <button onClick={openAdd} style={{ padding: '10px 20px', background: '#16a34a', color: 'white', borderRadius: '8px', fontWeight: '600', fontSize: '14px', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(22,163,74,0.3)' }}>
            + Add Crew Member
          </button>
        </div>

        <div className="td-body" style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>

          {message && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#15803d', fontSize: '14px' }}>
              {message}
            </div>
          )}

          {/* WSIB warnings for crew */}
          {wsibWarnings.length > 0 && (
            <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {wsibWarnings.map(m => {
                const days = Math.floor((new Date(m.wsib_expiry).getTime() - Date.now()) / 86400000);
                const expired = days < 0;
                return (
                  <div key={m.id} style={{ background: expired ? '#fef2f2' : '#fffbeb', border: `1px solid ${expired ? '#fecaca' : '#fde68a'}`, borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: expired ? '#dc2626' : '#d97706', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: expired ? '#7f1d1d' : '#78350f' }}>
                      {m.name} — WSIB {expired ? `expired ${Math.abs(days)} days ago` : `expires in ${days} days`}
                      {m.wsib_number && ` (#${m.wsib_number})`}
                    </span>
                    <button onClick={() => openEdit(m)} style={{ marginLeft: 'auto', fontSize: '12px', color: expired ? '#dc2626' : '#d97706', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Update →
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'Total Crew', value: crew.length, color: '#111', bg: '#f9fafb', border: '#e5e7eb' },
              { label: 'Active', value: active, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
              { label: 'Inactive', value: inactive, color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: '12px', padding: '20px' }}>
                <p style={{ color: '#6b7280', fontSize: '12px', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>{s.label}</p>
                <p style={{ color: s.color, fontSize: '28px', fontWeight: '800', margin: 0, letterSpacing: '-1px' }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Add/Edit Form */}
          {showForm && (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111', margin: 0 }}>
                  {editingId ? 'Edit Crew Member' : 'Add Crew Member'}
                </h2>
                <button onClick={() => { setShowForm(false); setEditingId(null); }} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>×</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Full Name *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Mike Johnson" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Trade</label>
                  <select value={form.trade} onChange={e => setForm({ ...form, trade: e.target.value })} style={inputStyle}>
                    <option value="">Select trade</option>
                    {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={inputStyle}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="mike@example.com" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="519-555-0000" style={inputStyle} />
                </div>

                {/* Divider */}
                <div style={{ gridColumn: 'span 2', borderTop: '1px solid #f3f4f6', paddingTop: '16px', marginTop: '4px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 16px' }}>WSIB Information</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={labelStyle}>WSIB Account Number</label>
                      <input value={form.wsib_number} onChange={e => setForm({ ...form, wsib_number: e.target.value })} placeholder="e.g. 1234567" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Clearance Cert. Expiry</label>
                      <input type="date" value={form.wsib_expiry} onChange={e => setForm({ ...form, wsib_expiry: e.target.value })} style={inputStyle} />
                    </div>
                  </div>
                </div>

                {/* Rate */}
                <div style={{ gridColumn: 'span 2', borderTop: '1px solid #f3f4f6', paddingTop: '16px', marginTop: '4px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 16px' }}>Rate</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={labelStyle}>Rate Type</label>
                      <select value={form.rate_type} onChange={e => setForm({ ...form, rate_type: e.target.value })} style={inputStyle}>
                        <option value="hourly">Hourly</option>
                        <option value="fixed">Fixed Per Job</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>{form.rate_type === 'hourly' ? 'Hourly Rate ($)' : 'Fixed Rate ($)'}</label>
                      <input type="number" min="0" step="0.01" value={form.hourly_rate} onChange={e => setForm({ ...form, hourly_rate: e.target.value })} placeholder="0.00" style={inputStyle} />
                    </div>
                  </div>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Notes</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Certifications, specialties, any other notes..."
                    style={{ ...inputStyle, resize: 'none' as const }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button onClick={saveMember} disabled={saving} style={{ padding: '10px 24px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving...' : editingId ? 'Update Member' : 'Add to Crew'}
                </button>
                <button onClick={() => { setShowForm(false); setEditingId(null); }} style={{ padding: '10px 24px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Filter + Table */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ color: '#111', fontSize: '15px', fontWeight: '700', margin: 0 }}>Crew Members</h2>
              <div style={{ display: 'flex', gap: '4px' }}>
                {['all', 'active', 'inactive'].map(f => (
                  <button key={f} onClick={() => setFilterStatus(f)} style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: 'none', background: filterStatus === f ? '#0a0a0a' : '#f3f4f6', color: filterStatus === f ? 'white' : '#6b7280', textTransform: 'capitalize' }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
                <div style={{ width: '48px', height: '48px', margin: '0 auto 16px', background: '#f3f4f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="8" cy="6" r="3.5" stroke="#9ca3af" strokeWidth="1.5"/><path d="M1 19c0-4 3.1-7 7-7s7 3 7 7" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/><circle cx="17" cy="7" r="2.5" stroke="#9ca3af" strokeWidth="1.3"/><path d="M20 18c0-2.8-1.3-5-3-5" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round"/></svg>
                </div>
                <p style={{ margin: '0 0 16px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>No crew members yet</p>
                <button onClick={openAdd} style={{ background: '#16a34a', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                  Add your first crew member
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      {['Name', 'Trade', 'Contact', 'WSIB', 'Rate', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '12px 20px', textAlign: 'left', color: '#6b7280', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(member => {
                      const wsibExpiry = member.wsib_expiry ? new Date(member.wsib_expiry) : null;
                      const wsibDays = wsibExpiry ? Math.floor((wsibExpiry.getTime() - Date.now()) / 86400000) : null;
                      const wsibExpired = wsibDays !== null && wsibDays < 0;
                      const wsibWarning = wsibDays !== null && wsibDays >= 0 && wsibDays <= 30;

                      return (
                        <tr key={member.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px', color: '#16a34a', flexShrink: 0 }}>
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p style={{ fontSize: '14px', fontWeight: '600', color: '#111', margin: '0 0 1px' }}>{member.name}</p>
                                {member.notes && <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>{member.notes.slice(0, 40)}{member.notes.length > 40 ? '…' : ''}</p>}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '14px 20px', color: '#374151', fontSize: '13px' }}>{member.trade || '—'}</td>
                          <td style={{ padding: '14px 20px' }}>
                            {member.email && <p style={{ fontSize: '13px', color: '#374151', margin: '0 0 2px' }}>{member.email}</p>}
                            {member.phone && <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>{member.phone}</p>}
                            {!member.email && !member.phone && <span style={{ color: '#d1d5db', fontSize: '13px' }}>—</span>}
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            {wsibExpiry ? (
                              <div>
                                <p style={{ fontSize: '12px', margin: '0 0 2px', fontWeight: '600', color: wsibExpired ? '#dc2626' : wsibWarning ? '#d97706' : '#374151' }}>
                                  {wsibExpired ? 'Expired' : wsibWarning ? `${wsibDays}d left` : wsibExpiry.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                                {member.wsib_number && <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>#{member.wsib_number}</p>}
                              </div>
                            ) : (
                              <span style={{ color: '#d1d5db', fontSize: '13px' }}>Not set</span>
                            )}
                          </td>
                          <td style={{ padding: '14px 20px', color: '#374151', fontSize: '13px' }}>
                            {member.hourly_rate ? (
                              <span>${member.hourly_rate.toFixed(2)}{member.rate_type === 'hourly' ? '/hr' : ' fixed'}</span>
                            ) : (
                              <span style={{ color: '#d1d5db' }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <button onClick={() => toggleStatus(member)} style={{ background: member.status === 'active' ? '#f0fdf4' : '#f3f4f6', color: member.status === 'active' ? '#16a34a' : '#6b7280', border: `1px solid ${member.status === 'active' ? '#bbf7d0' : '#e5e7eb'}`, borderRadius: '100px', padding: '3px 10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                              {member.status === 'active' ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => openEdit(member)} style={{ padding: '6px 12px', background: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                Edit
                              </button>
                              <button onClick={() => deleteMember(member.id)} style={{ padding: '6px 12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                Remove
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
