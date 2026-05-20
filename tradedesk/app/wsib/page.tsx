'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

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
  const [form, setForm] = useState({
    period_start: '',
    period_end: '',
    reportable_earnings: '',
    wsib_rate: '1.69',
    due_date: '',
    notes: '',
  });

  const premiumOwing = (
    (parseFloat(form.reportable_earnings) || 0) *
    ((parseFloat(form.wsib_rate) || 0) / 100)
  ).toFixed(2);

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    const { data } = await supabase
      .from('wsib_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setEntries(data || []);
    setLoading(false);
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
      premium_owing: parseFloat(premiumOwing),
      due_date: form.due_date,
      notes: form.notes,
      status: 'pending',
    });
    if (error) {
      setMessage('Error saving entry: ' + error.message);
    } else {
      setMessage('WSIB entry saved!');
      setForm({ period_start: '', period_end: '', reportable_earnings: '', wsib_rate: '1.69', due_date: '', notes: '' });
      loadEntries();
    }
    setSaving(false);
  }

  async function markAsPaid(id: string) {
    await supabase.from('wsib_entries').update({ status: 'paid' }).eq('id', id);
    loadEntries();
  }

  const totalOwing = entries.filter(e => e.status !== 'paid').reduce((sum, e) => sum + e.premium_owing, 0);
  const totalPaid = entries.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.premium_owing, 0);
  const nextDue = entries.filter(e => e.status === 'pending').sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];
  const overdue = entries.filter(e => e.status === 'pending' && new Date(e.due_date) < new Date());

  return (
    <div className="flex min-h-screen bg-[#0a0f1e]">
      {/* Sidebar */}
      <div className="w-64 bg-[#0d1526] border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">TD</div>
            <span className="text-white font-semibold text-lg">TradeDesk</span>
          </div>
        </div>
        <nav className="p-4 flex-1">
          {[['Dashboard', '/dashboard'], ['Quotes', '/quotes'], ['Invoices', '/invoices'], ['Jobs', '/jobs'], ['WSIB Tracking', '/wsib'], ['Settings', '/settings']].map(([label, href]) => (
            <a key={href} href={href} className={`block px-4 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors ${href === '/wsib' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>{label}</a>
          ))}
        </nav>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="bg-[#0d1526] border-b border-gray-800 px-8 py-4 flex items-center justify-between">
          <h1 className="text-white text-xl font-semibold">WSIB Tracking</h1>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="px-4 py-2 border border-gray-600 text-gray-300 rounded-full text-sm hover:bg-gray-800">Logout</button>
        </div>

        <div className="p-8 space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#0d1526] border border-gray-800 rounded-xl p-5">
              <p className="text-gray-400 text-sm mb-1">Total Owing</p>
              <p className="text-red-400 text-2xl font-bold">${totalOwing.toFixed(2)}</p>
            </div>
            <div className="bg-[#0d1526] border border-gray-800 rounded-xl p-5">
              <p className="text-gray-400 text-sm mb-1">Next Due Date</p>
              <p className="text-white text-2xl font-bold">{nextDue ? new Date(nextDue.due_date).toLocaleDateString('en-CA') : '—'}</p>
            </div>
            <div className="bg-[#0d1526] border border-gray-800 rounded-xl p-5">
              <p className="text-gray-400 text-sm mb-1">Total Paid This Year</p>
              <p className="text-green-400 text-2xl font-bold">${totalPaid.toFixed(2)}</p>
            </div>
          </div>

          {/* Overdue warning */}
          {overdue.length > 0 && (
            <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm">
              ⚠️ You have {overdue.length} overdue WSIB payment{overdue.length > 1 ? 's' : ''}. File immediately to avoid penalties.
            </div>
          )}

          {/* Add new entry form */}
          <div className="bg-[#0d1526] border border-gray-800 rounded-xl p-6">
            <h2 className="text-white font-semibold text-lg mb-4">Log New WSIB Period</h2>
            {message && <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg text-blue-300 text-sm">{message}</div>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm block mb-1">Period Start</label>
                <input type="date" value={form.period_start} onChange={e => setForm({...form, period_start: e.target.value})} className="w-full bg-[#0a0f1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm"/>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Period End</label>
                <input type="date" value={form.period_end} onChange={e => setForm({...form, period_end: e.target.value})} className="w-full bg-[#0a0f1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm"/>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Reportable Earnings ($)</label>
                <input type="number" placeholder="5000.00" value={form.reportable_earnings} onChange={e => setForm({...form, reportable_earnings: e.target.value})} className="w-full bg-[#0a0f1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm"/>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">WSIB Rate (%)</label>
                <input type="number" step="0.01" value={form.wsib_rate} onChange={e => setForm({...form, wsib_rate: e.target.value})} className="w-full bg-[#0a0f1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm"/>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Due Date</label>
                <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} className="w-full bg-[#0a0f1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm"/>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Premium Owing (auto-calculated)</label>
                <div className="w-full bg-[#0a0f1e] border border-gray-700 rounded-lg px-4 py-2.5 text-green-400 text-sm font-semibold">${premiumOwing}</div>
              </div>
              <div className="col-span-2">
                <label className="text-gray-400 text-sm block mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} placeholder="Any additional notes..." className="w-full bg-[#0a0f1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm resize-none"/>
              </div>
            </div>
            <button onClick={saveEntry} disabled={saving} className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">{saving ? 'Saving...' : 'Save WSIB Entry'}</button>
          </div>

          {/* Entries table */}
          <div className="bg-[#0d1526] border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800">
              <h2 className="text-white font-semibold">WSIB History</h2>
            </div>
            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading...</div>
            ) : entries.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No WSIB entries yet. Log your first period above.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      {['Period', 'Reportable Earnings', 'Premium Owing', 'Due Date', 'Status', 'Actions'].map(h => (
                        <th key={h} className="px-6 py-3 text-left text-gray-400 text-sm font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map(entry => {
                      const isOverdue = entry.status === 'pending' && new Date(entry.due_date) < new Date();
                      return (
                        <tr key={entry.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                          <td className="px-6 py-4 text-white text-sm">{new Date(entry.period_start).toLocaleDateString('en-CA')} – {new Date(entry.period_end).toLocaleDateString('en-CA')}</td>
                          <td className="px-6 py-4 text-white text-sm">${entry.reportable_earnings.toFixed(2)}</td>
                          <td className="px-6 py-4 text-white text-sm font-semibold">${entry.premium_owing.toFixed(2)}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={isOverdue ? 'text-red-400' : 'text-white'}>{new Date(entry.due_date).toLocaleDateString('en-CA')}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${entry.status === 'paid' ? 'bg-green-900/50 text-green-400' : isOverdue ? 'bg-red-900/50 text-red-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
                              {isOverdue ? 'overdue' : entry.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {entry.status !== 'paid' && (
                              <button onClick={() => markAsPaid(entry.id)} className="px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded-lg text-xs">Mark as Paid</button>
                            )}
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