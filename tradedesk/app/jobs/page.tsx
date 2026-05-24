'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
    else { setMessage('Job created!'); setForm({ title: '', customer_name: '', customer_phone: '', scheduled_date: '', notes: '' }); loadJobs(); }
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
        body: JSON.stringify({
          customerPhone: job.customer_phone,
          customerName: job.customer_name,
          contractorName: contractorName,
          googleReviewLink: googleReviewLink || 'https://g.page/r/review'
        })
      });
      const data = await res.json();
      if (data.success) setMessage('Job completed! Review request SMS sent to customer ⭐');
      else setMessage('Job completed! SMS failed: ' + data.error);
    } else {
      setMessage('Job completed! Add customer phone next time to send review request.');
    }
  }

  const statusColor: Record<string, string> = {
    scheduled: 'bg-yellow-900/50 text-yellow-400',
    'in progress': 'bg-blue-900/50 text-blue-400',
    completed: 'bg-green-900/50 text-green-400',
    cancelled: 'bg-red-900/50 text-red-400',
  };

  return (
    <div className="flex min-h-screen bg-[#0a0f1e]">
      <div className="w-64 bg-[#0d1526] border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">TD</div>
            <span className="text-white font-semibold text-lg">TradeDesk</span>
          </div>
        </div>
        <nav className="p-4 flex-1">
          {[['Dashboard', '/dashboard'], ['Quotes', '/quotes'], ['Invoices', '/invoices'], ['Jobs', '/jobs'], ['WSIB Tracking', '/wsib'], ['AI Profit Analyzer', '/profit'], ['Settings', '/settings']].map(([label, href]) => (
            <a key={href} href={href} className={`block px-4 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors ${href === '/jobs' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>{label}</a>
          ))}
        </nav>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-[#0d1526] border-b border-gray-800 px-8 py-4 flex items-center justify-between">
          <h1 className="text-white text-xl font-semibold">Jobs</h1>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="px-4 py-2 border border-gray-600 text-gray-300 rounded-full text-sm hover:bg-gray-800">Logout</button>
        </div>

        <div className="p-8 space-y-6">
          {/* Add job form */}
          <div className="bg-[#0d1526] border border-gray-800 rounded-xl p-6">
            <h2 className="text-white font-semibold text-lg mb-4">Create New Job</h2>
            {message && <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg text-blue-300 text-sm">{message}</div>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm block mb-1">Job Title</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Kitchen rewire" className="w-full bg-[#0a0f1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm"/>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Customer Name</label>
                <input value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} placeholder="John Smith" className="w-full bg-[#0a0f1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm"/>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Customer Phone</label>
                <input value={form.customer_phone} onChange={e => setForm({...form, customer_phone: e.target.value})} placeholder="519-555-0000" className="w-full bg-[#0a0f1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm"/>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Scheduled Date</label>
                <input type="date" value={form.scheduled_date} onChange={e => setForm({...form, scheduled_date: e.target.value})} className="w-full bg-[#0a0f1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm"/>
              </div>
              <div className="col-span-2">
                <label className="text-gray-400 text-sm block mb-1">Notes</label>
                <input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Any notes..." className="w-full bg-[#0a0f1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm"/>
              </div>
            </div>
            <button onClick={saveJob} disabled={saving} className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">{saving ? 'Saving...' : 'Create Job'}</button>
          </div>

          {/* Jobs table */}
          <div className="bg-[#0d1526] border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800">
              <h2 className="text-white font-semibold">All Jobs</h2>
            </div>
            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading...</div>
            ) : jobs.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No jobs yet. Create your first job above.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      {['Job Title', 'Customer', 'Phone', 'Scheduled Date', 'Status', 'Actions'].map(h => (
                        <th key={h} className="px-6 py-3 text-left text-gray-400 text-sm font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map(job => (
                      <tr key={job.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                        <td className="px-6 py-4 text-white text-sm font-medium">{job.title}</td>
                        <td className="px-6 py-4 text-white text-sm">{job.customer_name}</td>
                        <td className="px-6 py-4 text-gray-400 text-sm">{job.customer_phone || '—'}</td>
                        <td className="px-6 py-4 text-white text-sm">{new Date(job.scheduled_date).toLocaleDateString('en-CA')}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[job.status] || 'bg-gray-800 text-gray-400'}`}>{job.status}</span>
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          {job.status === 'scheduled' && (
                            <button onClick={() => updateStatus(job.id, 'in progress')} className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs">
                              Start
                            </button>
                          )}
                          {job.status === 'in progress' && (
                            <button onClick={() => completeAndRequestReview(job)} className="px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded-lg text-xs">
                              Complete & Request Review ⭐
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
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