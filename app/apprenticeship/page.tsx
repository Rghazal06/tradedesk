'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Sidebar from '../../components/Sidebar';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);


// Skilled Trades Ontario hour requirements by trade
const TRADE_REQUIREMENTS: Record<string, number> = {
  'Electrician': 9000,
  'Plumber': 9000,
  'HVAC': 7200,
  'General Contractor': 7200,
  'Roofer': 5400,
  'Other': 7200,
};

const TRADE_CATEGORIES = ['Electrician', 'Plumber', 'HVAC', 'General Contractor', 'Roofer', 'Other'];

interface AppHours {
  id: string;
  work_date: string;
  hours: number;
  trade_category: string;
  employer_name: string;
  supervisor_name: string;
  task_description: string;
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

export default function ApprenticeshipPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [entries, setEntries] = useState<AppHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [tradeType, setTradeType] = useState('');
  const [form, setForm] = useState({
    work_date: new Date().toISOString().split('T')[0],
    hours: '',
    trade_category: '',
    employer_name: '',
    supervisor_name: '',
    task_description: '',
  });

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUserId(user.id);
    const { data: profile } = await supabase.from('profiles').select('trade_type').eq('id', user.id).single();
    if (profile?.trade_type) {
      setTradeType(profile.trade_type);
      setForm(f => ({ ...f, trade_category: profile.trade_type }));
    }
    await loadEntries(user.id);
  }

  async function loadEntries(uid: string) {
    const { data } = await supabase
      .from('apprenticeship_hours')
      .select('*')
      .eq('user_id', uid)
      .order('work_date', { ascending: false });
    setEntries(data || []);
    setLoading(false);
  }

  async function saveEntry() {
    if (!form.work_date || !form.hours || !form.trade_category) {
      setMessage('Date, hours, and trade category are required.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('apprenticeship_hours').insert({
      user_id: userId,
      work_date: form.work_date,
      hours: parseFloat(form.hours),
      trade_category: form.trade_category,
      employer_name: form.employer_name,
      supervisor_name: form.supervisor_name,
      task_description: form.task_description,
    });
    if (error) {
      setMessage('Something went wrong. Please try again.');
    } else {
      setMessage('Hours logged!');
      setForm({ work_date: new Date().toISOString().split('T')[0], hours: '', trade_category: tradeType || '', employer_name: '', supervisor_name: '', task_description: '' });
      setShowForm(false);
      await loadEntries(userId);
    }
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  }

  async function deleteEntry(id: string) {
    if (!confirm('Delete this entry?')) return;
    await supabase.from('apprenticeship_hours').delete().eq('id', id);
    await loadEntries(userId);
  }

  function exportPDF() {
    // Group by trade category for the report
    const lines: string[] = [];
    lines.push('SKILLED TRADES ONTARIO — APPRENTICESHIP HOURS LOG');
    lines.push('='.repeat(55));
    lines.push('');

    const byCategory: Record<string, AppHours[]> = {};
    entries.forEach(e => {
      if (!byCategory[e.trade_category]) byCategory[e.trade_category] = [];
      byCategory[e.trade_category].push(e);
    });

    Object.entries(byCategory).forEach(([cat, items]) => {
      const catTotal = items.reduce((sum, i) => sum + (i.hours || 0), 0);
      const required = TRADE_REQUIREMENTS[cat] || 7200;
      lines.push(`Trade: ${cat}`);
      lines.push(`Total Hours: ${catTotal} / ${required} required`);
      lines.push('-'.repeat(40));
      items.forEach(item => {
        lines.push(`${item.work_date} | ${item.hours}h | ${item.employer_name || 'N/A'} | Supervisor: ${item.supervisor_name || 'N/A'}`);
        if (item.task_description) lines.push(`  Task: ${item.task_description}`);
      });
      lines.push('');
    });

    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apprenticeship-hours-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  }

  // Calculate totals by category
  const totalsByCategory: Record<string, number> = {};
  entries.forEach(e => {
    totalsByCategory[e.trade_category] = (totalsByCategory[e.trade_category] || 0) + (e.hours || 0);
  });

  // Get monthly breakdown for current trade
  const monthlyData: Record<string, number> = {};
  entries
    .filter(e => !tradeType || e.trade_category === tradeType)
    .forEach(e => {
      const month = e.work_date.slice(0, 7);
      monthlyData[month] = (monthlyData[month] || 0) + (e.hours || 0);
    });
  const months = Object.keys(monthlyData).sort().slice(-6);

  const primaryTrade = tradeType || Object.keys(totalsByCategory)[0] || '';
  const primaryHours = totalsByCategory[primaryTrade] || 0;
  const requiredHours = TRADE_REQUIREMENTS[primaryTrade] || 7200;
  const progressPct = Math.min((primaryHours / requiredHours) * 100, 100);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f4', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Sidebar activePath="/apprenticeship" />

      

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Top bar */}
        <div className="td-topbar" style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: 0 }}>Apprenticeship Hours</h1>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '2px 0 0' }}>Track hours toward Skilled Trades Ontario requirements</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={exportPDF} style={{ padding: '10px 16px', background: 'white', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
              Export Report
            </button>
            <button onClick={() => setShowForm(!showForm)} style={{
              padding: '10px 20px', background: '#16a34a', color: 'white',
              borderRadius: '8px', fontWeight: '600', fontSize: '14px',
              border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
            }}>
              Log Hours
            </button>
          </div>
        </div>

        <div className="td-body" style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>

          {message && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#15803d', fontSize: '14px' }}>
              {message}
            </div>
          )}

          {/* Progress Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {Object.entries(totalsByCategory).map(([cat, hours]) => {
              const required = TRADE_REQUIREMENTS[cat] || 7200;
              const pct = Math.min((hours / required) * 100, 100);
              return (
                <div key={cat} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <p style={{ fontWeight: '700', color: '#111', margin: '0 0 2px', fontSize: '15px' }}>{cat}</p>
                      <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>Skilled Trades Ontario</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: '800', color: '#16a34a', fontSize: '22px', margin: '0 0 2px' }}>{hours.toFixed(0)}</p>
                      <p style={{ color: '#9ca3af', fontSize: '11px', margin: 0 }}>of {required.toLocaleString()} hrs</p>
                    </div>
                  </div>
                  <div style={{ background: '#f3f4f6', borderRadius: '100px', height: '8px', overflow: 'hidden' }}>
                    <div style={{ background: pct >= 100 ? '#16a34a' : '#3b82f6', height: '100%', width: `${pct}%`, borderRadius: '100px', transition: 'width 0.3s' }} />
                  </div>
                  <p style={{ color: '#6b7280', fontSize: '12px', margin: '8px 0 0', textAlign: 'right' }}>{pct.toFixed(1)}% complete</p>
                </div>
              );
            })}
            {Object.keys(totalsByCategory).length === 0 && (
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
                <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>Log hours to see your progress</p>
              </div>
            )}
          </div>

          {/* Monthly Breakdown */}
          {months.length > 0 && (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111', margin: '0 0 16px' }}>Monthly Breakdown — Last 6 Months</h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '80px' }}>
                {months.map(m => {
                  const hrs = monthlyData[m] || 0;
                  const max = Math.max(...months.map(mo => monthlyData[mo] || 0));
                  const h = max > 0 ? (hrs / max) * 60 : 0;
                  return (
                    <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: '#6b7280', fontSize: '11px', fontWeight: '600' }}>{hrs.toFixed(0)}h</span>
                      <div style={{ width: '100%', background: '#16a34a', height: `${h}px`, borderRadius: '4px 4px 0 0', minHeight: '4px' }} />
                      <span style={{ color: '#9ca3af', fontSize: '10px' }}>{m.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Log Form */}
          {showForm && (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111', margin: '0 0 20px' }}>Log Hours</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Work Date</label>
                  <input type="date" value={form.work_date} onChange={e => setForm({ ...form, work_date: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Hours Worked</label>
                  <input type="number" step="0.5" min="0.5" max="24" value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} placeholder="8" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Trade Category</label>
                  <select value={form.trade_category} onChange={e => setForm({ ...form, trade_category: e.target.value })} style={inputStyle}>
                    <option value="">Select trade</option>
                    {TRADE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Employer Name</label>
                  <input value={form.employer_name} onChange={e => setForm({ ...form, employer_name: e.target.value })} placeholder="Smith Electrical Ltd." style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Supervisor Name</label>
                  <input value={form.supervisor_name} onChange={e => setForm({ ...form, supervisor_name: e.target.value })} placeholder="Mike Johnson" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Task Description</label>
                  <input value={form.task_description} onChange={e => setForm({ ...form, task_description: e.target.value })} placeholder="Wired new panel in residential unit" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button onClick={saveEntry} disabled={saving} style={{ padding: '10px 24px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving...' : 'Log Hours'}
                </button>
                <button onClick={() => setShowForm(false)} style={{ padding: '10px 24px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Hours Log Table */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
              <h2 style={{ color: '#111', fontSize: '15px', fontWeight: '700', margin: 0 }}>Hours Log</h2>
            </div>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
            ) : entries.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
                <p style={{ fontSize: '15px', fontWeight: '500', color: '#374151', margin: '0 0 8px' }}>No hours logged yet</p>
                <button onClick={() => setShowForm(true)} style={{ background: '#16a34a', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                  Log your first hours
                </button>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    {['Date', 'Hours', 'Trade', 'Employer', 'Supervisor', 'Task', ''].map(h => (
                      <th key={h} style={{ padding: '12px 24px', textAlign: 'left', color: '#6b7280', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map(e => (
                    <tr key={e.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td style={{ padding: '12px 24px', color: '#374151', fontSize: '13px' }}>{e.work_date}</td>
                      <td style={{ padding: '12px 24px', color: '#16a34a', fontWeight: '700', fontSize: '14px' }}>{e.hours}h</td>
                      <td style={{ padding: '12px 24px' }}>
                        <span style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '100px', padding: '3px 10px', fontSize: '12px', fontWeight: '600' }}>{e.trade_category}</span>
                      </td>
                      <td style={{ padding: '12px 24px', color: '#374151', fontSize: '13px' }}>{e.employer_name || '—'}</td>
                      <td style={{ padding: '12px 24px', color: '#374151', fontSize: '13px' }}>{e.supervisor_name || '—'}</td>
                      <td style={{ padding: '12px 24px', color: '#6b7280', fontSize: '13px', maxWidth: '200px' }}>{e.task_description || '—'}</td>
                      <td style={{ padding: '12px 24px' }}>
                        <button onClick={() => deleteEntry(e.id)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '13px' }}>
                          Delete
                        </button>
                      </td>
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
