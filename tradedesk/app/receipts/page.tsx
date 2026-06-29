'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Sidebar from '../../components/Sidebar';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CATEGORIES = ['Materials', 'Tools', 'Fuel', 'Food', 'Office', 'Insurance', 'Subcontractor', 'Other'];

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  Materials:     { bg: '#eff6ff', color: '#1d4ed8' },
  Tools:         { bg: '#fef3c7', color: '#92400e' },
  Fuel:          { bg: '#fef2f2', color: '#991b1b' },
  Food:          { bg: '#f0fdf4', color: '#166534' },
  Office:        { bg: '#f5f3ff', color: '#5b21b6' },
  Insurance:     { bg: '#fff7ed', color: '#9a3412' },
  Subcontractor: { bg: '#f0f9ff', color: '#075985' },
  Other:         { bg: '#f3f4f6', color: '#374151' },
};

interface LineItem {
  description: string;
  qty: number | null;
  unit_price: number | null;
  amount: number;
}

interface Job {
  id: string;
  title: string;
  customer_name: string;
}

interface Receipt {
  id: string;
  merchant: string;
  amount: number;
  subtotal: number | null;
  tax: number | null;
  date: string;
  category: string;
  notes: string;
  image_url: string;
  line_items: LineItem[] | null;
  raw_text: string;
  created_at: string;
  job_id: string | null;
}

const inputStyle = {
  width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb',
  borderRadius: '8px', fontSize: '14px', color: '#111',
  background: '#f9fafb', boxSizing: 'border-box' as const,
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: 600,
  color: '#6b7280', marginBottom: '5px',
  textTransform: 'uppercase', letterSpacing: '0.6px',
};

function fmt(n: number | null | undefined) {
  if (n == null) return '—';
  return '$' + n.toFixed(2);
}

export default function ReceiptsPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [userId, setUserId] = useState('');
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Scan form state
  const [showForm, setShowForm] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [imageMime, setImageMime] = useState('image/jpeg');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [scannedLineItems, setScannedLineItems] = useState<LineItem[]>([]);
  const [form, setForm] = useState({ merchant: '', amount: '', subtotal: '', tax: '', date: '', category: '', notes: '', job_id: '' });

  // Detail modal
  const [viewReceipt, setViewReceipt] = useState<Receipt | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUserId(user.id);
    const { data: jobsData } = await supabase.from('jobs').select('id, title, customer_name').eq('user_id', user.id).order('scheduled_date', { ascending: false });
    setJobs(jobsData || []);
    await loadReceipts(user.id);
  }

  async function loadReceipts(uid: string) {
    const { data } = await supabase
      .from('receipts')
      .select('*')
      .eq('user_id', uid)
      .order('date', { ascending: false });
    setReceipts(data || []);
    setLoading(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset
    if (fileRef.current) fileRef.current.value = '';
    setImageMime(file.type || 'image/jpeg');
    setPreviewUrl(URL.createObjectURL(file));
    setScannedLineItems([]);
    setUploadedImageUrl('');
    setForm({ merchant: '', amount: '', subtotal: '', tax: '', date: new Date().toISOString().split('T')[0], category: '', notes: '', job_id: '' });
    setShowForm(true);
    setMessage(null);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  }

  async function scanReceipt() {
    if (!imageBase64) return;
    setScanning(true);
    setMessage(null);
    try {
      // Upload to storage first
      const filename = `${userId}/${Date.now()}.jpg`;
      const byteString = atob(imageBase64);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
      const blob = new Blob([ab], { type: imageMime });

      const { data: uploadData } = await supabase.storage
        .from('receipts')
        .upload(filename, blob, { contentType: imageMime, upsert: true });
      if (uploadData) {
        const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(filename);
        setUploadedImageUrl(urlData?.publicUrl || '');
      }

      // Scan
      const res = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType: imageMime }),
      });
      const result = await res.json();
      if (result.success && result.data) {
        const d = result.data;
        setForm({
          merchant: d.merchant || '',
          amount: d.amount?.toString() || '',
          subtotal: d.subtotal?.toString() || '',
          tax: d.tax?.toString() || '',
          date: d.date || new Date().toISOString().split('T')[0],
          category: d.category || 'Other',
          notes: '',
        });
        setScannedLineItems(d.line_items || []);
        setMessage({ text: `Scanned ${(d.line_items || []).length} line item${(d.line_items || []).length !== 1 ? 's' : ''}. Review and save.`, type: 'success' });
      } else {
        setMessage({ text: 'Could not read receipt — fill in manually.', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Scan failed. Fill in manually.', type: 'error' });
    }
    setScanning(false);
  }

  async function deleteReceipt(id: string) {
    if (!confirm('Delete this receipt? This cannot be undone.')) return;
    setDeletingId(id);
    await supabase.from('receipts').delete().eq('id', id);
    setViewReceipt(null);
    setDeletingId(null);
    await loadReceipts(userId);
  }

  async function saveReceipt() {
    if (!form.merchant || !form.amount) {
      setMessage({ text: 'Merchant and amount are required.', type: 'error' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('receipts').insert({
      user_id: userId,
      merchant: form.merchant,
      amount: parseFloat(form.amount),
      subtotal: form.subtotal ? parseFloat(form.subtotal) : null,
      tax: form.tax ? parseFloat(form.tax) : null,
      date: form.date,
      category: form.category,
      notes: form.notes,
      image_url: uploadedImageUrl,
      line_items: scannedLineItems.length > 0 ? scannedLineItems : null,
      job_id: form.job_id || null,
    });
    if (error) {
      setMessage({ text: 'Error saving: ' + error.message, type: 'error' });
    } else {
      setMessage({ text: 'Receipt saved!', type: 'success' });
      setShowForm(false);
      setPreviewUrl('');
      setImageBase64('');
      setUploadedImageUrl('');
      setScannedLineItems([]);
      setForm({ merchant: '', amount: '', subtotal: '', tax: '', date: '', category: '', notes: '', job_id: '' });
      await loadReceipts(userId);
    }
    setSaving(false);
    setTimeout(() => setMessage(null), 4000);
  }

  function exportCSV() {
    const rows: string[][] = [['Date', 'Merchant', 'Amount', 'Subtotal', 'Tax', 'Category', 'Notes', 'Image URL']];
    getFiltered().forEach(r => {
      rows.push([r.date, r.merchant, r.amount?.toFixed(2), r.subtotal?.toFixed(2) || '', r.tax?.toFixed(2) || '', r.category, r.notes, r.image_url || '']);
      if (r.line_items?.length) {
        r.line_items.forEach(li => {
          rows.push(['', `  └ ${li.description}`, li.amount?.toFixed(2), '', '', '', li.qty != null ? `qty: ${li.qty}` : '', '']);
        });
      }
    });
    const csv = rows.map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `receipts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  function getFiltered() {
    return receipts.filter(r => {
      if (filterCategory && r.category !== filterCategory) return false;
      if (filterDateFrom && r.date < filterDateFrom) return false;
      if (filterDateTo && r.date > filterDateTo) return false;
      return true;
    });
  }

  const filtered = getFiltered();
  const total = filtered.reduce((s, r) => s + (r.amount || 0), 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f4', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Sidebar activePath="/receipts" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: 0 }}>Receipts</h1>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '2px 0 0' }}>AI scans every line item — ready for tax time</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={exportCSV} style={{ padding: '9px 16px', background: 'white', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
              Export CSV
            </button>
            <button onClick={() => fileRef.current?.click()} style={{ padding: '9px 20px', background: '#16a34a', color: 'white', borderRadius: '8px', fontWeight: '600', fontSize: '13px', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(22,163,74,0.25)' }}>
              Scan Receipt
            </button>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: 'none' }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>

          {/* Toast */}
          {message && (
            <div style={{ background: message.type === 'error' ? '#fef2f2' : '#f0fdf4', border: `1px solid ${message.type === 'error' ? '#fecaca' : '#bbf7d0'}`, borderRadius: '8px', padding: '11px 16px', marginBottom: '20px', color: message.type === 'error' ? '#991b1b' : '#15803d', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{message.type === 'error' ? '✕' : '✓'}</span> {message.text}
            </div>
          )}

          {/* ── SCAN FORM ── */}
          {showForm && (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '14px', marginBottom: '24px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111', margin: 0 }}>New Receipt</h2>
                <button onClick={() => { setShowForm(false); setPreviewUrl(''); setImageBase64(''); setScannedLineItems([]); }} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '0 4px' }}>×</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 0 }}>
                {/* Left: image + scan button */}
                <div style={{ padding: '20px', borderRight: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                  {previewUrl && (
                    <div style={{ position: 'relative', width: '160px' }}>
                      <img src={previewUrl} alt="Receipt" style={{ width: '160px', height: '210px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'block' }} />
                      {scanning && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <div style={{ width: '24px', height: '24px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                          <span style={{ color: 'white', fontSize: '12px', fontWeight: '600' }}>Scanning...</span>
                        </div>
                      )}
                    </div>
                  )}
                  {imageBase64 && !scanning && (
                    <button onClick={scanReceipt} style={{ width: '160px', padding: '9px 0', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                      Scan with AI
                    </button>
                  )}
                  <button onClick={() => fileRef.current?.click()} style={{ width: '160px', padding: '8px 0', background: 'white', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '8px', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>
                    Change image
                  </button>
                </div>

                {/* Right: fields */}
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={labelStyle}>Merchant</label>
                      <input value={form.merchant} onChange={e => setForm({ ...form, merchant: e.target.value })} placeholder="Home Depot" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Date</label>
                      <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Category</label>
                      <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>
                        <option value="">Select...</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Subtotal</label>
                      <input type="number" step="0.01" value={form.subtotal} onChange={e => setForm({ ...form, subtotal: e.target.value })} placeholder="0.00" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Tax</label>
                      <input type="number" step="0.01" value={form.tax} onChange={e => setForm({ ...form, tax: e.target.value })} placeholder="0.00" style={inputStyle} />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={labelStyle}>Total (paid)</label>
                      <input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" style={{ ...inputStyle, fontWeight: '700', fontSize: '15px', color: '#16a34a' }} />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={labelStyle}>Notes</label>
                      <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Job name, context..." style={inputStyle} />
                    </div>
                    {jobs.length > 0 && (
                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={labelStyle}>Link to Job (for costing)</label>
                        <select value={form.job_id} onChange={e => setForm({ ...form, job_id: e.target.value })} style={inputStyle}>
                          <option value="">No job linked</option>
                          {jobs.map(j => (
                            <option key={j.id} value={j.id}>{j.title} — {j.customer_name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Line items breakdown */}
                  {scannedLineItems.length > 0 && (
                    <div style={{ marginTop: '20px', borderTop: '1px solid #f3f4f6', paddingTop: '16px' }}>
                      <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 10px' }}>
                        Items Detected ({scannedLineItems.length})
                      </p>
                      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                          <thead>
                            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#6b7280', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Description</th>
                              <th style={{ padding: '8px 10px', textAlign: 'center', color: '#6b7280', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', width: '50px' }}>Qty</th>
                              <th style={{ padding: '8px 10px', textAlign: 'right', color: '#6b7280', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', width: '80px' }}>Unit</th>
                              <th style={{ padding: '8px 12px', textAlign: 'right', color: '#6b7280', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', width: '80px' }}>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {scannedLineItems.map((item, i) => (
                              <tr key={i} style={{ borderBottom: i < scannedLineItems.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                                <td style={{ padding: '9px 12px', color: '#111', fontWeight: '500' }}>{item.description}</td>
                                <td style={{ padding: '9px 10px', textAlign: 'center', color: '#6b7280' }}>{item.qty ?? '—'}</td>
                                <td style={{ padding: '9px 10px', textAlign: 'right', color: '#6b7280' }}>{item.unit_price != null ? fmt(item.unit_price) : '—'}</td>
                                <td style={{ padding: '9px 12px', textAlign: 'right', color: '#111', fontWeight: '600' }}>{fmt(item.amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button onClick={saveReceipt} disabled={saving} style={{ padding: '10px 24px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                      {saving ? 'Saving...' : 'Save Receipt'}
                    </button>
                    <button onClick={() => { setShowForm(false); setPreviewUrl(''); setImageBase64(''); setScannedLineItems([]); }} style={{ padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters + summary */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', color: '#374151', background: 'white', cursor: 'pointer' }}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', color: '#374151', background: 'white' }} />
            <span style={{ color: '#9ca3af', fontSize: '13px' }}>to</span>
            <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', color: '#374151', background: 'white' }} />
            {(filterCategory || filterDateFrom || filterDateTo) && (
              <button onClick={() => { setFilterCategory(''); setFilterDateFrom(''); setFilterDateTo(''); }} style={{ padding: '8px 12px', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontSize: '13px', color: '#374151', cursor: 'pointer', fontWeight: '600' }}>
                Clear filters
              </button>
            )}
            <div style={{ marginLeft: 'auto', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ color: '#6b7280', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</span>
              <span style={{ color: '#16a34a', fontWeight: '800', fontSize: '16px', letterSpacing: '-0.5px' }}>${total.toFixed(2)}</span>
              <span style={{ color: '#d1d5db', fontSize: '13px' }}>|</span>
              <span style={{ color: '#9ca3af', fontSize: '13px' }}>{filtered.length} receipt{filtered.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Receipts list */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '15px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ color: '#111', fontSize: '15px', fontWeight: '700', margin: 0 }}>All Receipts</h2>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>Click any row to view photo & breakdown</span>
            </div>

            {loading ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
                <div style={{ width: '48px', height: '48px', margin: '0 auto 16px', background: '#f3f4f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="1" width="13" height="19" rx="1.5" stroke="#9ca3af" strokeWidth="1.5"/><path d="M3 17l2-2 2 2 2-2" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round"/><line x1="6" y1="6" x2="13" y2="6" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round"/><line x1="6" y1="9" x2="13" y2="9" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round"/></svg>
                </div>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: '0 0 6px' }}>No receipts yet</p>
                <p style={{ margin: '0 0 20px', fontSize: '13px' }}>Upload a photo and AI will extract every line item</p>
                <button onClick={() => fileRef.current?.click()} style={{ background: '#16a34a', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
                  Scan your first receipt
                </button>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    {['', 'Merchant', 'Date', 'Amount', 'Category', 'Items', ''].map((h, i) => (
                      <th key={i} style={{ padding: '10px 16px', textAlign: i >= 3 ? 'right' : 'left', color: '#9ca3af', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => {
                    const catStyle = CATEGORY_COLORS[r.category] || CATEGORY_COLORS['Other'];
                    const itemCount = r.line_items?.length || 0;
                    return (
                      <tr
                        key={r.id}
                        onClick={() => setViewReceipt(r)}
                        style={{ borderBottom: '1px solid #f9fafb', cursor: 'pointer', transition: 'background 0.1s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* Thumbnail */}
                        <td style={{ padding: '10px 16px', width: '52px' }}>
                          {r.image_url ? (
                            <img src={r.image_url} alt="" style={{ width: '40px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb', display: 'block' }} />
                          ) : (
                            <div style={{ width: '40px', height: '48px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="1" width="10" height="14" rx="1" stroke="#d1d5db" strokeWidth="1.2"/><line x1="4" y1="4" x2="10" y2="4" stroke="#d1d5db" strokeWidth="1"/><line x1="4" y1="6.5" x2="10" y2="6.5" stroke="#d1d5db" strokeWidth="1"/></svg>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <p style={{ fontSize: '14px', fontWeight: '600', color: '#111', margin: '0 0 2px' }}>{r.merchant || 'Unknown'}</p>
                          {r.notes && <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>{r.notes}</p>}
                          {r.job_id && (() => {
                            const job = jobs.find(j => j.id === r.job_id);
                            return job ? <p style={{ fontSize: '11px', color: '#16a34a', margin: '2px 0 0', fontWeight: '600' }}>{job.title}</p> : null;
                          })()}
                        </td>
                        <td style={{ padding: '10px 16px', color: '#6b7280', fontSize: '13px', whiteSpace: 'nowrap' }}>
                          {r.date ? new Date(r.date + 'T12:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '15px', fontWeight: '700', color: '#111' }}>${r.amount?.toFixed(2)}</span>
                          {r.tax != null && r.tax > 0 && (
                            <span style={{ display: 'block', fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>incl. {fmt(r.tax)} tax</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                          <span style={{ background: catStyle.bg, color: catStyle.color, borderRadius: '100px', padding: '3px 10px', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                            {r.category || '—'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                          {itemCount > 0 ? (
                            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#d1d5db' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={e => { e.stopPropagation(); deleteReceipt(r.id); }}
                              disabled={deletingId === r.id}
                              style={{ padding: '4px 8px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', opacity: deletingId === r.id ? 0.5 : 1 }}
                            >
                              Delete
                            </button>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#d1d5db' }}><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ── DETAIL MODAL ── */}
      {viewReceipt && (
        <div
          onClick={() => setViewReceipt(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '860px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
          >
            {/* Modal header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#111', margin: '0 0 2px' }}>{viewReceipt.merchant || 'Receipt'}</h2>
                <p style={{ color: '#9ca3af', fontSize: '12px', margin: 0 }}>
                  {viewReceipt.date ? new Date(viewReceipt.date + 'T12:00:00').toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : ''}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => deleteReceipt(viewReceipt.id)}
                  disabled={deletingId === viewReceipt.id}
                  style={{ padding: '7px 14px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', opacity: deletingId === viewReceipt.id ? 0.5 : 1 }}
                >
                  Delete Receipt
                </button>
                <button onClick={() => setViewReceipt(null)} style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '18px', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
            </div>

            {/* Modal body */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'grid', gridTemplateColumns: '260px 1fr' }}>
              {/* Left: receipt photo */}
              <div style={{ borderRight: '1px solid #f3f4f6', background: '#f9fafb', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', gap: '12px', overflowY: 'auto' }}>
                {viewReceipt.image_url ? (
                  <>
                    <img
                      src={viewReceipt.image_url}
                      alt="Receipt"
                      style={{ width: '100%', borderRadius: '10px', border: '1px solid #e5e7eb', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', display: 'block' }}
                    />
                    <a href={viewReceipt.image_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#6b7280', textDecoration: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Open full size
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 9L9 1M9 1H4M9 1V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    </a>
                  </>
                ) : (
                  <div style={{ width: '100%', height: '200px', background: '#f3f4f6', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#9ca3af', border: '1px dashed #d1d5db' }}>
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="3" y="2" width="18" height="24" rx="2" stroke="#d1d5db" strokeWidth="1.5"/><line x1="7" y1="8" x2="17" y2="8" stroke="#d1d5db" strokeWidth="1.3" strokeLinecap="round"/><line x1="7" y1="12" x2="17" y2="12" stroke="#d1d5db" strokeWidth="1.3" strokeLinecap="round"/><line x1="7" y1="16" x2="13" y2="16" stroke="#d1d5db" strokeWidth="1.3" strokeLinecap="round"/></svg>
                    <span style={{ fontSize: '12px' }}>No photo</span>
                  </div>
                )}
              </div>

              {/* Right: details + line items */}
              <div style={{ overflowY: 'auto', padding: '24px' }}>
                {/* Totals row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                  {[
                    { label: 'Subtotal', value: viewReceipt.subtotal },
                    { label: 'Tax', value: viewReceipt.tax },
                    { label: 'Total Paid', value: viewReceipt.amount, highlight: true },
                  ].map(item => (
                    <div key={item.label} style={{ background: item.highlight ? '#f0fdf4' : '#f9fafb', border: `1px solid ${item.highlight ? '#bbf7d0' : '#e5e7eb'}`, borderRadius: '10px', padding: '14px 16px' }}>
                      <p style={{ color: '#9ca3af', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>{item.label}</p>
                      <p style={{ color: item.highlight ? '#16a34a' : '#111', fontSize: '20px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>
                        {item.value != null ? `$${item.value.toFixed(2)}` : '—'}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Meta */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                  {viewReceipt.category && (() => {
                    const s = CATEGORY_COLORS[viewReceipt.category] || CATEGORY_COLORS['Other'];
                    return <span style={{ background: s.bg, color: s.color, borderRadius: '100px', padding: '4px 12px', fontSize: '12px', fontWeight: '700' }}>{viewReceipt.category}</span>;
                  })()}
                  {viewReceipt.notes && (
                    <span style={{ background: '#f3f4f6', color: '#374151', borderRadius: '100px', padding: '4px 12px', fontSize: '12px', fontWeight: '500' }}>{viewReceipt.notes}</span>
                  )}
                </div>

                {/* Line items */}
                {viewReceipt.line_items && viewReceipt.line_items.length > 0 ? (
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 10px' }}>
                      Items ({viewReceipt.line_items.length})
                    </p>
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                            <th style={{ padding: '9px 14px', textAlign: 'left', color: '#6b7280', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Description</th>
                            <th style={{ padding: '9px 10px', textAlign: 'center', color: '#6b7280', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', width: '50px' }}>Qty</th>
                            <th style={{ padding: '9px 10px', textAlign: 'right', color: '#6b7280', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', width: '85px' }}>Unit Price</th>
                            <th style={{ padding: '9px 14px', textAlign: 'right', color: '#6b7280', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', width: '80px' }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewReceipt.line_items.map((item, i) => (
                            <tr key={i} style={{ borderBottom: i < viewReceipt.line_items!.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                              <td style={{ padding: '10px 14px', color: '#111', fontWeight: '500', lineHeight: '1.4' }}>{item.description}</td>
                              <td style={{ padding: '10px 10px', textAlign: 'center', color: '#6b7280' }}>{item.qty ?? '—'}</td>
                              <td style={{ padding: '10px 10px', textAlign: 'right', color: '#6b7280' }}>{item.unit_price != null ? fmt(item.unit_price) : '—'}</td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', color: '#111', fontWeight: '700' }}>{fmt(item.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: '#f9fafb', border: '1px dashed #e5e7eb', borderRadius: '10px', padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                    No line items recorded — re-scan to extract them
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
