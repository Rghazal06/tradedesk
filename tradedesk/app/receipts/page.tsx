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

interface Receipt {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  category: string;
  notes: string;
  image_url: string;
  raw_text: string;
  created_at: string;
}

const inputStyle = {
  width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb',
  borderRadius: '8px', fontSize: '14px', color: '#111',
  background: '#f9fafb', boxSizing: 'border-box' as const,
};

const labelStyle = {
  display: 'block', fontSize: '12px', fontWeight: '600' as const,
  color: '#374151', marginBottom: '6px',
  textTransform: 'uppercase' as const, letterSpacing: '0.5px',
};

export default function ReceiptsPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState('');
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [imageMime, setImageMime] = useState('image/jpeg');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [form, setForm] = useState({
    merchant: '', amount: '', date: '', category: '', notes: '',
  });

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUserId(user.id);
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
    setImageMime(file.type || 'image/jpeg');
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
    setShowForm(true);
    setForm({ merchant: '', amount: '', date: new Date().toISOString().split('T')[0], category: '', notes: '' });
  }

  async function scanReceipt() {
    if (!imageBase64) return;
    setScanning(true);
    try {
      // Upload image to Supabase Storage first
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

      // Scan with AI
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
          date: d.date || new Date().toISOString().split('T')[0],
          category: d.category || 'Other',
          notes: '',
        });
        setMessage('Receipt scanned successfully. Review and save.');
      } else {
        setMessage('Could not read receipt. Please fill in manually.');
      }
    } catch {
      setMessage('Scan failed. Please fill in manually.');
    }
    setScanning(false);
  }

  async function saveReceipt() {
    if (!form.merchant || !form.amount) {
      setMessage('Merchant and amount are required.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('receipts').insert({
      user_id: userId,
      merchant: form.merchant,
      amount: parseFloat(form.amount),
      date: form.date,
      category: form.category,
      notes: form.notes,
      image_url: uploadedImageUrl,
    });
    if (error) {
      setMessage('Error saving: ' + error.message);
    } else {
      setMessage('Receipt saved!');
      setShowForm(false);
      setPreviewUrl('');
      setImageBase64('');
      setUploadedImageUrl('');
      setForm({ merchant: '', amount: '', date: '', category: '', notes: '' });
      await loadReceipts(userId);
    }
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  }

  function exportCSV() {
    const filtered = getFiltered();
    const rows = [
      ['Date', 'Merchant', 'Amount', 'Category', 'Notes'],
      ...filtered.map(r => [r.date, r.merchant, r.amount?.toFixed(2), r.category, r.notes]),
    ];
    const csv = rows.map(r => r.map(c => `"${c || ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
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
  const total = filtered.reduce((sum, r) => sum + (r.amount || 0), 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f4', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Sidebar activePath="/receipts" />

      

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Top bar */}
        <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: 0 }}>Receipt Scanning</h1>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '2px 0 0' }}>AI-powered receipt capture for tax time</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={exportCSV} style={{ padding: '10px 16px', background: 'white', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
              Export CSV
            </button>
            <button onClick={() => fileRef.current?.click()} style={{
              padding: '10px 20px', background: '#16a34a', color: 'white',
              borderRadius: '8px', fontWeight: '600', fontSize: '14px',
              border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
            }}>
              Upload Receipt
            </button>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: 'none' }} />
          </div>
        </div>

        <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>

          {message && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#15803d', fontSize: '14px' }}>
              {message}
            </div>
          )}

          {/* Scan Form */}
          {showForm && (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111', margin: '0 0 20px' }}>New Receipt</h2>
              <div style={{ display: 'flex', gap: '24px' }}>
                {/* Preview */}
                <div style={{ flexShrink: 0 }}>
                  {previewUrl && (
                    <img src={previewUrl} alt="Receipt preview" style={{ width: '160px', height: '200px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                  )}
                  {imageBase64 && !scanning && (
                    <button onClick={scanReceipt} style={{ width: '160px', marginTop: '8px', padding: '8px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
                      Scan with AI
                    </button>
                  )}
                  {scanning && (
                    <div style={{ width: '160px', marginTop: '8px', padding: '8px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
                      Scanning...
                    </div>
                  )}
                </div>

                {/* Fields */}
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Merchant</label>
                    <input value={form.merchant} onChange={e => setForm({ ...form, merchant: e.target.value })} placeholder="Home Depot" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Amount ($)</label>
                    <input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Date</label>
                    <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Category</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>
                      <option value="">Select category</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>Notes</label>
                    <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes..." style={inputStyle} />
                  </div>
                  <div style={{ gridColumn: 'span 2', display: 'flex', gap: '12px' }}>
                    <button onClick={saveReceipt} disabled={saving} style={{ padding: '10px 24px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                      {saving ? 'Saving...' : 'Save Receipt'}
                    </button>
                    <button onClick={() => { setShowForm(false); setPreviewUrl(''); setImageBase64(''); }} style={{ padding: '10px 24px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters + Summary */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', color: '#374151', background: 'white', cursor: 'pointer' }}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', color: '#374151', background: 'white' }} />
            <span style={{ color: '#6b7280', fontSize: '13px' }}>to</span>
            <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', color: '#374151', background: 'white' }} />
            {(filterCategory || filterDateFrom || filterDateTo) && (
              <button onClick={() => { setFilterCategory(''); setFilterDateFrom(''); setFilterDateTo(''); }} style={{ padding: '8px 12px', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontSize: '13px', color: '#374151', cursor: 'pointer' }}>
                Clear
              </button>
            )}
            <div style={{ marginLeft: 'auto', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 16px' }}>
              <span style={{ color: '#6b7280', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total: </span>
              <span style={{ color: '#16a34a', fontWeight: '700', fontSize: '15px' }}>${total.toFixed(2)}</span>
              <span style={{ color: '#9ca3af', fontSize: '12px' }}> ({filtered.length} receipts)</span>
            </div>
          </div>

          {/* Receipts Table */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
              <h2 style={{ color: '#111', fontSize: '15px', fontWeight: '700', margin: 0 }}>All Receipts</h2>
            </div>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
                <p style={{ fontSize: '15px', fontWeight: '500', color: '#374151', margin: '0 0 8px' }}>No receipts yet</p>
                <p style={{ margin: '0 0 20px', fontSize: '13px' }}>Upload a photo of a receipt to get started</p>
                <button onClick={() => fileRef.current?.click()} style={{ background: '#16a34a', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                  Upload Receipt
                </button>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    {['Date', 'Merchant', 'Amount', 'Category', 'Notes'].map(h => (
                      <th key={h} style={{ padding: '12px 24px', textAlign: 'left', color: '#6b7280', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td style={{ padding: '14px 24px', color: '#374151', fontSize: '13px' }}>{r.date}</td>
                      <td style={{ padding: '14px 24px', color: '#111', fontSize: '14px', fontWeight: '500' }}>{r.merchant || '—'}</td>
                      <td style={{ padding: '14px 24px', color: '#16a34a', fontSize: '14px', fontWeight: '600' }}>${r.amount?.toFixed(2)}</td>
                      <td style={{ padding: '14px 24px' }}>
                        <span style={{ background: '#f3f4f6', color: '#374151', borderRadius: '100px', padding: '3px 10px', fontSize: '12px', fontWeight: '600' }}>
                          {r.category || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 24px', color: '#6b7280', fontSize: '13px' }}>{r.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
