'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Sidebar from '../../components/Sidebar';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface InsuranceDoc {
  id: string;
  doc_type: string;
  insurer: string;
  policy_number: string;
  expiry_date: string | null;
  coverage_amount: number | null;
  file_url: string;
  subcontractor_name: string;
  notes: string;
  created_at: string;
}

const DOC_TYPES = ['liability', 'wsib', 'commercial auto', 'equipment', 'umbrella', 'workers comp'];

function daysUntilExpiry(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const exp = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((exp.getTime() - today.getTime()) / 86400000);
}

function ExpiryBadge({ days }: { days: number | null }) {
  if (days === null) return <span style={{ fontSize: '12px', color: '#9ca3af' }}>No date</span>;
  if (days < 0) {
    return <span style={{ background: '#fef2f2', color: '#991b1b', padding: '3px 9px', borderRadius: '100px', fontSize: '11px', fontWeight: '700' }}>Expired {Math.abs(days)}d ago</span>;
  }
  if (days <= 30) {
    return <span style={{ background: '#fef2f2', color: '#dc2626', padding: '3px 9px', borderRadius: '100px', fontSize: '11px', fontWeight: '700' }}>{days}d left</span>;
  }
  if (days <= 90) {
    return <span style={{ background: '#fffbeb', color: '#b45309', padding: '3px 9px', borderRadius: '100px', fontSize: '11px', fontWeight: '700' }}>{days}d left</span>;
  }
  return <span style={{ background: '#f0fdf4', color: '#15803d', padding: '3px 9px', borderRadius: '100px', fontSize: '11px', fontWeight: '700' }}>{days}d left</span>;
}

const BLANK_FORM = {
  doc_type: 'liability',
  insurer: '',
  policy_number: '',
  expiry_date: '',
  coverage_amount: '',
  file_url: '',
  subcontractor_name: '',
  notes: '',
};

export default function InsurancePage(): React.JSX.Element {
  const [docs, setDocs] = useState<InsuranceDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'own' | 'subs'>('own');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<InsuranceDoc | null>(null);
  const [form, setForm] = useState({ ...BLANK_FORM });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDocs();
  }, []);

  async function fetchDocs() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('insurance_docs')
      .select('*')
      .eq('user_id', user.id)
      .order('expiry_date', { ascending: true, nullsFirst: false });
    setDocs(data || []);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({ ...BLANK_FORM, doc_type: tab === 'subs' ? 'liability' : 'liability' });
    setError('');
    setShowModal(true);
  }

  function openEdit(doc: InsuranceDoc) {
    setEditing(doc);
    setForm({
      doc_type: doc.doc_type,
      insurer: doc.insurer,
      policy_number: doc.policy_number,
      expiry_date: doc.expiry_date || '',
      coverage_amount: doc.coverage_amount != null ? String(doc.coverage_amount) : '',
      file_url: doc.file_url,
      subcontractor_name: doc.subcontractor_name,
      notes: doc.notes,
    });
    setError('');
    setShowModal(true);
  }

  async function save() {
    if (!form.insurer.trim()) { setError('Insurer name is required.'); return; }
    if (form.file_url && !/^https?:\/\//i.test(form.file_url.trim())) {
      setError('Document URL must start with https:// or http://');
      return;
    }
    setSaving(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const payload = {
      user_id: user.id,
      doc_type: form.doc_type,
      insurer: form.insurer.trim().slice(0, 200),
      policy_number: form.policy_number.trim().slice(0, 100),
      expiry_date: form.expiry_date || null,
      coverage_amount: form.coverage_amount ? parseFloat(form.coverage_amount) : null,
      file_url: form.file_url.trim().slice(0, 500),
      subcontractor_name: form.subcontractor_name.trim().slice(0, 200),
      notes: form.notes.trim().slice(0, 1000),
    };

    if (editing) {
      await supabase.from('insurance_docs').update(payload).eq('id', editing.id).eq('user_id', user.id);
    } else {
      await supabase.from('insurance_docs').insert(payload);
    }

    setSaving(false);
    setShowModal(false);
    fetchDocs();
  }

  async function deleteDoc(id: string) {
    if (!confirm('Delete this insurance record?')) return;
    setDeleting(id);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from('insurance_docs').delete().eq('id', id).eq('user_id', user.id);
    setDeleting(null);
    fetchDocs();
  }

  const ownDocs = docs.filter(d => !d.subcontractor_name);
  const subDocs = docs.filter(d => !!d.subcontractor_name);
  const displayed = tab === 'own' ? ownDocs : subDocs;

  // Counts for alert bar
  const expiringSoon = docs.filter(d => {
    const days = daysUntilExpiry(d.expiry_date);
    return days !== null && days >= 0 && days <= 30;
  });
  const expired = docs.filter(d => {
    const days = daysUntilExpiry(d.expiry_date);
    return days !== null && days < 0;
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#fafafa' }}>
      <Sidebar activePath="/insurance" />
      <div style={{ flex: 1, padding: '40px 40px 60px', maxWidth: '1100px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#111', margin: '0 0 6px', letterSpacing: '-0.3px' }}>Insurance</h1>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Track your policies and subcontractor COIs in one place.</p>
          </div>
          <button
            onClick={openAdd}
            style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
          >
            + Add Policy
          </button>
        </div>

        {/* Alert bar */}
        {(expired.length > 0 || expiringSoon.length > 0) && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 18px', marginBottom: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            {expired.length > 0 && (
              <span style={{ fontSize: '13px', color: '#991b1b', fontWeight: '600' }}>
                {expired.length} policy{expired.length > 1 ? 'ies' : ''} expired — renew immediately
              </span>
            )}
            {expiringSoon.length > 0 && (
              <span style={{ fontSize: '13px', color: '#b45309', fontWeight: '600' }}>
                {expiringSoon.length} policy{expiringSoon.length > 1 ? 'ies' : ''} expiring within 30 days
              </span>
            )}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', padding: '4px', borderRadius: '10px', width: 'fit-content', marginBottom: '24px' }}>
          {(['own', 'subs'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: tab === t ? 'white' : 'transparent',
                border: 'none', borderRadius: '8px',
                padding: '7px 18px', fontSize: '13px', fontWeight: tab === t ? '700' : '500',
                color: tab === t ? '#111' : '#6b7280',
                cursor: 'pointer', transition: 'all 0.15s',
                boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {t === 'own' ? `My Policies (${ownDocs.length})` : `Subcontractor COIs (${subDocs.length})`}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af', fontSize: '14px' }}>Loading...</div>
        ) : displayed.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '60px 40px', textAlign: 'center' }}>
            <p style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 16px' }}>
              {tab === 'own' ? 'No policies added yet.' : 'No subcontractor COIs on file.'}
            </p>
            <button
              onClick={openAdd}
              style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
            >
              + Add {tab === 'own' ? 'Policy' : 'Subcontractor COI'}
            </button>
          </div>
        ) : (
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '14px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                  {tab === 'subs' && <th style={thStyle}>Subcontractor</th>}
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Insurer</th>
                  <th style={thStyle}>Policy #</th>
                  <th style={thStyle}>Coverage</th>
                  <th style={thStyle}>Expiry</th>
                  <th style={thStyle}>Status</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(doc => {
                  const days = daysUntilExpiry(doc.expiry_date);
                  const rowBg = days !== null && days < 0 ? '#fffbfb' : days !== null && days <= 30 ? '#fffcf0' : 'white';
                  return (
                    <tr key={doc.id} style={{ borderBottom: '1px solid #f3f4f6', background: rowBg }}>
                      {tab === 'subs' && (
                        <td style={tdStyle}><span style={{ fontWeight: '600', color: '#111' }}>{doc.subcontractor_name}</span></td>
                      )}
                      <td style={tdStyle}>
                        <span style={{ textTransform: 'capitalize', background: '#f3f4f6', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>{doc.doc_type}</span>
                      </td>
                      <td style={tdStyle}>{doc.insurer || <span style={{ color: '#9ca3af' }}>—</span>}</td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '12px', color: '#374151' }}>{doc.policy_number || <span style={{ fontFamily: 'inherit', color: '#9ca3af' }}>—</span>}</td>
                      <td style={tdStyle}>
                        {doc.coverage_amount != null
                          ? <span style={{ fontWeight: '600' }}>${doc.coverage_amount.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                          : <span style={{ color: '#9ca3af' }}>—</span>}
                      </td>
                      <td style={tdStyle}>
                        {doc.expiry_date
                          ? <span style={{ fontSize: '13px', color: '#374151' }}>{new Date(doc.expiry_date + 'T00:00:00').toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          : <span style={{ color: '#9ca3af' }}>—</span>}
                      </td>
                      <td style={tdStyle}><ExpiryBadge days={days} /></td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          {doc.file_url && /^https?:\/\//i.test(doc.file_url) && (
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontSize: '12px', color: '#2563eb', fontWeight: '600', textDecoration: 'none', padding: '4px 10px', background: '#eff6ff', borderRadius: '6px' }}
                            >
                              View
                            </a>
                          )}
                          <button
                            onClick={() => openEdit(doc)}
                            style={{ fontSize: '12px', color: '#374151', fontWeight: '600', padding: '4px 10px', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteDoc(doc.id)}
                            disabled={deleting === doc.id}
                            style={{ fontSize: '12px', color: '#dc2626', fontWeight: '600', padding: '4px 10px', background: '#fef2f2', border: 'none', borderRadius: '6px', cursor: 'pointer', opacity: deleting === doc.id ? 0.5 : 1 }}
                          >
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

        {/* Summary cards */}
        {docs.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', marginTop: '28px' }}>
            {[
              { label: 'Total Policies', value: docs.length, color: '#111' },
              { label: 'Expired', value: expired.length, color: expired.length > 0 ? '#dc2626' : '#15803d' },
              { label: 'Expiring Soon', value: expiringSoon.length, color: expiringSoon.length > 0 ? '#b45309' : '#15803d' },
              { label: 'Subcontractor COIs', value: subDocs.length, color: '#374151' },
            ].map(c => (
              <div key={c.label} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px 18px' }}>
                <p style={{ margin: '0 0 5px', fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.label}</p>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: c.color }}>{c.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
        >
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 24px', color: '#111' }}>
              {editing ? 'Edit Policy' : 'Add Insurance Policy'}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Document Type</label>
                <select
                  value={form.doc_type}
                  onChange={e => setForm(f => ({ ...f, doc_type: e.target.value }))}
                  style={inputStyle}
                >
                  {DOC_TYPES.map(t => (
                    <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Subcontractor Name <span style={{ color: '#9ca3af', fontWeight: '400' }}>(leave blank for your own policy)</span></label>
                <input
                  value={form.subcontractor_name}
                  onChange={e => setForm(f => ({ ...f, subcontractor_name: e.target.value }))}
                  placeholder="e.g. Smith Electric Inc."
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Insurer *</label>
                <input
                  value={form.insurer}
                  onChange={e => setForm(f => ({ ...f, insurer: e.target.value }))}
                  placeholder="e.g. Intact Insurance"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Policy Number</label>
                <input
                  value={form.policy_number}
                  onChange={e => setForm(f => ({ ...f, policy_number: e.target.value }))}
                  placeholder="e.g. POL-123456"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Expiry Date</label>
                <input
                  type="date"
                  value={form.expiry_date}
                  onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Coverage Amount ($)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={form.coverage_amount}
                  onChange={e => setForm(f => ({ ...f, coverage_amount: e.target.value }))}
                  placeholder="e.g. 2000000"
                  style={inputStyle}
                />
              </div>

              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Certificate / Document URL</label>
                <input
                  value={form.file_url}
                  onChange={e => setForm(f => ({ ...f, file_url: e.target.value }))}
                  placeholder="https://..."
                  style={inputStyle}
                />
              </div>

              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any additional details..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }}
                />
              </div>
            </div>

            {error && <p style={{ color: '#dc2626', fontSize: '13px', margin: '12px 0 0' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', color: '#374151', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: saving ? '#86efac' : '#16a34a', color: 'white', fontSize: '13px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer' }}
              >
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Policy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '11px 16px',
  textAlign: 'left',
  fontSize: '11px',
  fontWeight: '700',
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '13px 16px',
  fontSize: '13px',
  color: '#374151',
  verticalAlign: 'middle',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: '700',
  color: '#374151',
  marginBottom: '6px',
  letterSpacing: '0.1px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  fontSize: '13px',
  color: '#111',
  background: 'white',
  boxSizing: 'border-box',
  outline: 'none',
};
