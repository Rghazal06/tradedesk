'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Sidebar from '../../components/Sidebar';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CATEGORIES = ['Labor', 'Parts & Materials', 'Electrical', 'Plumbing', 'HVAC', 'Roofing', 'General', 'Other'];

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  'Labor':            { bg: '#f0fdf4', color: '#166534' },
  'Parts & Materials':{ bg: '#eff6ff', color: '#1d4ed8' },
  'Electrical':       { bg: '#fefce8', color: '#854d0e' },
  'Plumbing':         { bg: '#f0f9ff', color: '#075985' },
  'HVAC':             { bg: '#fef3c7', color: '#92400e' },
  'Roofing':          { bg: '#fef2f2', color: '#991b1b' },
  'General':          { bg: '#f5f3ff', color: '#5b21b6' },
  'Other':            { bg: '#f3f4f6', color: '#374151' },
};

const UNIT_OPTIONS = ['each', 'hr', 'sqft', 'linear ft', 'trip', 'day', 'lot'];

interface PricebookItem {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  unit_price: number;
  created_at: string;
}

const emptyForm = { name: '', description: '', category: 'Labor', unit: 'each', unit_price: '' };

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

export default function PricebookPage() {
  const router = useRouter();

  const [items, setItems] = useState<PricebookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PricebookItem | null>(null);
  const [form, setForm] = useState<typeof emptyForm>({ ...emptyForm });

  const [filterCategory, setFilterCategory] = useState('');
  const [search, setSearch] = useState('');

  const [userId, setUserId] = useState('');

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUserId(user.id);
    await loadItems(user.id);
  }

  async function loadItems(uid: string) {
    const { data } = await supabase
      .from('pricebook_items')
      .select('*')
      .eq('user_id', uid)
      .order('category', { ascending: true });
    setItems(data || []);
    setLoading(false);
  }

  function openAdd() {
    setEditingItem(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  }

  function openEdit(item: PricebookItem) {
    setEditingItem(item);
    setForm({ name: item.name, description: item.description || '', category: item.category || 'Labor', unit: item.unit || 'each', unit_price: item.unit_price?.toString() || '' });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingItem(null);
    setForm({ ...emptyForm });
  }

  async function saveItem() {
    if (!form.name.trim()) { setMessage({ text: 'Item name is required.', type: 'error' }); return; }
    if (!form.unit_price || isNaN(parseFloat(form.unit_price))) { setMessage({ text: 'Valid price is required.', type: 'error' }); return; }
    setSaving(true);
    setMessage(null);

    const payload = {
      user_id: userId,
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      unit: form.unit,
      unit_price: parseFloat(form.unit_price),
    };

    let error;
    if (editingItem) {
      ({ error } = await supabase.from('pricebook_items').update(payload).eq('id', editingItem.id));
    } else {
      ({ error } = await supabase.from('pricebook_items').insert(payload));
    }

    if (error) {
      setMessage({ text: 'Something went wrong. Please try again.', type: 'error' });
    } else {
      setMessage({ text: editingItem ? 'Item updated!' : 'Item added to pricebook!', type: 'success' });
      closeForm();
      await loadItems(userId);
    }
    setSaving(false);
    setTimeout(() => setMessage(null), 4000);
  }

  async function deleteItem(id: string) {
    if (!confirm('Remove this item from your pricebook?')) return;
    setDeletingId(id);
    await supabase.from('pricebook_items').delete().eq('id', id);
    setItems(prev => prev.filter(i => i.id !== id));
    setDeletingId(null);
  }

  const filtered = items.filter(item => {
    if (filterCategory && item.category !== filterCategory) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase()) && !item.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Group by category
  const grouped = filtered.reduce<Record<string, PricebookItem[]>>((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f4', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Sidebar activePath="/pricebook" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Top bar */}
        <div className="td-topbar" style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: 0 }}>Pricebook</h1>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '2px 0 0' }}>Your flat-rate services and materials — pull into quotes with one click</p>
          </div>
          <button
            onClick={openAdd}
            style={{ padding: '10px 20px', background: '#16a34a', color: 'white', borderRadius: '8px', fontWeight: '600', fontSize: '14px', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(22,163,74,0.3)' }}>
            + Add Item
          </button>
        </div>

        <div className="td-body" style={{ padding: '28px 32px', flex: 1, overflowY: 'auto' }}>

          {message && (
            <div style={{ background: message.type === 'error' ? '#fef2f2' : '#f0fdf4', border: `1px solid ${message.type === 'error' ? '#fecaca' : '#bbf7d0'}`, borderRadius: '8px', padding: '11px 16px', marginBottom: '20px', color: message.type === 'error' ? '#991b1b' : '#15803d', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{message.type === 'error' ? '✕' : '✓'}</span> {message.text}
            </div>
          )}

          {/* Add / Edit form */}
          {showForm && (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111', margin: 0 }}>
                  {editingItem ? 'Edit Item' : 'New Pricebook Item'}
                </h2>
                <button onClick={closeForm} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '0 4px' }}>×</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Item Name</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Install outlet" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Unit</label>
                  <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} style={inputStyle}>
                    {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Price per {form.unit}</label>
                  <input type="number" step="0.01" min="0" value={form.unit_price} onChange={e => setForm({ ...form, unit_price: e.target.value })} placeholder="0.00" style={{ ...inputStyle, fontWeight: '700', fontSize: '15px' }} />
                </div>
                <div>
                  <label style={labelStyle}>Description (optional)</label>
                  <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description for quotes" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button onClick={saveItem} disabled={saving} style={{ padding: '10px 24px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving...' : editingItem ? 'Update Item' : 'Add to Pricebook'}
                </button>
                <button onClick={closeForm} style={{ padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Filters */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search items..."
              style={{ padding: '8px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', color: '#374151', background: 'white', width: '220px' }}
            />
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', color: '#374151', background: 'white', cursor: 'pointer' }}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {(search || filterCategory) && (
              <button onClick={() => { setSearch(''); setFilterCategory(''); }} style={{ padding: '8px 12px', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontSize: '13px', color: '#374151', cursor: 'pointer', fontWeight: '600' }}>
                Clear
              </button>
            )}
            <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#9ca3af' }}>{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Items grouped by category */}
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '60px', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', margin: '0 auto 16px', background: '#f3f4f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect x="2" y="4" width="18" height="14" rx="2" stroke="#9ca3af" strokeWidth="1.5"/>
                  <line x1="7" y1="9" x2="15" y2="9" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round"/>
                  <line x1="7" y1="13" x2="11" y2="13" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round"/>
                  <path d="M6 4V2M16 4V2" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </div>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: '0 0 6px' }}>
                {search || filterCategory ? 'No items match your search' : 'Your pricebook is empty'}
              </p>
              <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0 0 20px' }}>
                {search || filterCategory ? 'Try different keywords or categories' : 'Add your standard services and materials. Pull them into quotes with one click.'}
              </p>
              {!search && !filterCategory && (
                <button onClick={openAdd} style={{ background: '#16a34a', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                  Add your first item
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {Object.keys(grouped).sort().map(category => {
                const catStyle = CATEGORY_COLORS[category] || CATEGORY_COLORS['Other'];
                return (
                  <div key={category} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '10px', background: '#fafafa' }}>
                      <span style={{ background: catStyle.bg, color: catStyle.color, borderRadius: '100px', padding: '3px 10px', fontSize: '12px', fontWeight: '700' }}>
                        {category}
                      </span>
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>{grouped[category].length} item{grouped[category].length !== 1 ? 's' : ''}</span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <th style={{ padding: '10px 20px', textAlign: 'left', color: '#9ca3af', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</th>
                          <th style={{ padding: '10px 16px', textAlign: 'left', color: '#9ca3af', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</th>
                          <th style={{ padding: '10px 16px', textAlign: 'center', color: '#9ca3af', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Unit</th>
                          <th style={{ padding: '10px 20px', textAlign: 'right', color: '#9ca3af', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price</th>
                          <th style={{ padding: '10px 20px', textAlign: 'right', color: '#9ca3af', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grouped[category].map((item, idx) => (
                          <tr key={item.id} style={{ borderBottom: idx < grouped[category].length - 1 ? '1px solid #f9fafb' : 'none' }}>
                            <td style={{ padding: '13px 20px', fontSize: '14px', fontWeight: '600', color: '#111' }}>{item.name}</td>
                            <td style={{ padding: '13px 16px', fontSize: '13px', color: '#6b7280' }}>{item.description || '—'}</td>
                            <td style={{ padding: '13px 16px', textAlign: 'center', fontSize: '12px', color: '#9ca3af', fontWeight: '500' }}>{item.unit}</td>
                            <td style={{ padding: '13px 20px', textAlign: 'right', fontSize: '15px', fontWeight: '800', color: '#16a34a' }}>
                              ${item.unit_price?.toFixed(2)}
                            </td>
                            <td style={{ padding: '13px 20px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => openEdit(item)}
                                  style={{ padding: '5px 12px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteItem(item.id)}
                                  disabled={deletingId === item.id}
                                  style={{ padding: '5px 12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', opacity: deletingId === item.id ? 0.5 : 1 }}>
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
