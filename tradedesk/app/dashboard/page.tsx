'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({ quotes: 0, unpaidInvoices: 0, activeJobs: 0, revenue: 0 });
  const [recentQuotes, setRecentQuotes] = useState<any[]>([]);
  const [userName, setUserName] = useState('Contractor');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
    if (profile?.full_name) setUserName(profile.full_name.split(' ')[0]);

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data: quotes } = await supabase.from('quotes').select('*').eq('user_id', user.id).gte('created_at', firstOfMonth);
    const { data: invoices } = await supabase.from('invoices').select('*').eq('user_id', user.id).eq('status', 'unpaid');
    const { data: jobs } = await supabase.from('jobs').select('*').eq('user_id', user.id).in('status', ['scheduled', 'in progress']);
    const { data: paidInvoices } = await supabase.from('invoices').select('total').eq('user_id', user.id).eq('status', 'paid').gte('created_at', firstOfMonth);

    const revenue = paidInvoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;

    setStats({
      quotes: quotes?.length || 0,
      unpaidInvoices: invoices?.length || 0,
      activeJobs: jobs?.length || 0,
      revenue,
    });

    const { data: recentQ } = await supabase.from('quotes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5);
    setRecentQuotes(recentQ || []);
    setLoading(false);
  }

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
            <a key={href} href={href} className={`block px-4 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors ${href === '/dashboard' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>{label}</a>
          ))}
        </nav>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-[#0d1526] border-b border-gray-800 px-8 py-4 flex items-center justify-between">
          <h1 className="text-white text-xl font-semibold">Welcome back, {userName}</h1>
          <div className="flex items-center gap-4">
            <a href="/quotes/new" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">+ New Quote</a>
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="px-4 py-2 border border-gray-600 text-gray-300 rounded-full text-sm hover:bg-gray-800">Logout</button>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {loading ? (
            <div className="text-gray-400 text-center py-20">Loading your dashboard...</div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Quotes This Month', value: stats.quotes, color: 'text-white' },
                  { label: 'Unpaid Invoices', value: stats.unpaidInvoices, color: 'text-red-400' },
                  { label: 'Active Jobs', value: stats.activeJobs, color: 'text-blue-400' },
                  { label: 'Revenue This Month', value: `$${stats.revenue.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`, color: 'text-green-400' },
                ].map(stat => (
                  <div key={stat.label} className="bg-[#0d1526] border border-gray-800 rounded-xl p-5">
                    <p className="text-gray-400 text-sm mb-2">{stat.label}</p>
                    <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Recent quotes */}
              <div className="bg-[#0d1526] border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
                  <h2 className="text-white font-semibold">Recent Quotes</h2>
                  <a href="/quotes" className="text-blue-400 text-sm hover:underline">View all</a>
                </div>
                {recentQuotes.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">No quotes yet. <a href="/quotes/new" className="text-blue-400 hover:underline">Create your first quote</a></div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        {['Customer', 'Total', 'Date', 'Action'].map(h => (
                          <th key={h} className="px-6 py-3 text-left text-gray-400 text-sm font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentQuotes.map(quote => (
                        <tr key={quote.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                          <td className="px-6 py-4 text-white text-sm font-medium">{quote.customer_name}</td>
                          <td className="px-6 py-4 text-white text-sm">${quote.total?.toFixed(2)}</td>
                          <td className="px-6 py-4 text-gray-400 text-sm">{new Date(quote.created_at).toLocaleDateString('en-CA')}</td>
                          <td className="px-6 py-4">
                            <a href="/quotes" className="text-blue-400 text-sm hover:underline">View</a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}