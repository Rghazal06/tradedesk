'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Sidebar from '../../components/Sidebar';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);


interface Client {
  name: string;
  email: string;
  phone: string;
  totalQuotes: number;
  totalInvoices: number;
  totalJobs: number;
  totalRevenue: number;
  unpaidAmount: number;
  lastActivity: string;
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Client | null>(null);
  const [clientQuotes, setClientQuotes] = useState<any[]>([]);
  const [clientInvoices, setClientInvoices] = useState<any[]>([]);
  const [clientJobs, setClientJobs] = useState<any[]>([]);

  useEffect(() => { loadClients(); }, []);

  async function loadClients() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const [quotesRes, invoicesRes, jobsRes] = await Promise.all([
      supabase.from('quotes').select('customer_name, customer_email, customer_phone, total, status, created_at').eq('user_id', user.id),
      supabase.from('invoices').select('customer_name, customer_email, customer_phone, total, status, created_at').eq('user_id', user.id),
      supabase.from('jobs').select('customer_name, customer_phone, status, scheduled_date, created_at').eq('user_id', user.id),
    ]);

    const quotes = quotesRes.data || [];
    const invoices = invoicesRes.data || [];
    const jobs = jobsRes.data || [];

    const clientMap = new Map<string, Client>();

    quotes.forEach(q => {
      if (!q.customer_name) return;
      const key = q.customer_name.toLowerCase();
      if (!clientMap.has(key)) {
        clientMap.set(key, { name: q.customer_name, email: q.customer_email || '', phone: q.customer_phone || '', totalQuotes: 0, totalInvoices: 0, totalJobs: 0, totalRevenue: 0, unpaidAmount: 0, lastActivity: q.created_at });
      }
      const c = clientMap.get(key)!;
      c.totalQuotes++;
      if (new Date(q.created_at) > new Date(c.lastActivity)) c.lastActivity = q.created_at;
    });

    invoices.forEach(inv => {
      if (!inv.customer_name) return;
      const key = inv.customer_name.toLowerCase();
      if (!clientMap.has(key)) {
        clientMap.set(key, { name: inv.customer_name, email: inv.customer_email || '', phone: inv.customer_phone || '', totalQuotes: 0, totalInvoices: 0, totalJobs: 0, totalRevenue: 0, unpaidAmount: 0, lastActivity: inv.created_at });
      }
      const c = clientMap.get(key)!;
      c.totalInvoices++;
      if (inv.status === 'paid') c.totalRevenue += inv.total || 0;
      else c.unpaidAmount += inv.total || 0;
      if (new Date(inv.created_at) > new Date(c.lastActivity)) c.lastActivity = inv.created_at;
    });

    jobs.forEach(j => {
      if (!j.customer_name) return;
      const key = j.customer_name.toLowerCase();
      if (!clientMap.has(key)) {
        clientMap.set(key, { name: j.customer_name, email: '', phone: j.customer_phone || '', totalQuotes: 0, totalInvoices: 0, totalJobs: 0, totalRevenue: 0, unpaidAmount: 0, lastActivity: j.created_at });
      }
      const c = clientMap.get(key)!;
      c.totalJobs++;
      if (new Date(j.created_at) > new Date(c.lastActivity)) c.lastActivity = j.created_at;
    });

    const sorted = Array.from(clientMap.values()).sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
    setClients(sorted);
    setLoading(false);
  }

  async function selectClient(client: Client) {
    setSelected(client);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const name = client.name;
    const [q, inv, j] = await Promise.all([
      supabase.from('quotes').select('*').eq('user_id', user.id).eq('customer_name', name).order('created_at', { ascending: false }),
      supabase.from('invoices').select('*').eq('user_id', user.id).eq('customer_name', name).order('created_at', { ascending: false }),
      supabase.from('jobs').select('*').eq('user_id', user.id).eq('customer_name', name).order('scheduled_date', { ascending: false }),
    ]);
    setClientQuotes(q.data || []);
    setClientInvoices(inv.data || []);
    setClientJobs(j.data || []);
  }

  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f4', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Sidebar activePath="/clients" />

      

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: 0 }}>Clients</h1>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '2px 0 0' }}>All your customers in one place</p>
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients..."
            style={{ padding: '10px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111', background: '#f9fafb', width: '240px', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Client List */}
          <div style={{ width: selected ? '380px' : '100%', borderRight: selected ? '1px solid #e5e7eb' : 'none', overflowY: 'auto', padding: '24px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>Loading clients...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: '60px' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>👥</div>
                <p style={{ fontWeight: '500', color: '#374151' }}>No clients yet</p>
                <p style={{ fontSize: '13px' }}>Clients appear automatically when you create quotes, invoices, or jobs</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filtered.map(client => (
                  <div key={client.name} onClick={() => selectClient(client)} style={{
                    background: selected?.name === client.name ? '#f0fdf4' : 'white',
                    border: `1px solid ${selected?.name === client.name ? '#bbf7d0' : '#e5e7eb'}`,
                    borderRadius: '12px', padding: '16px 20px', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '40px', height: '40px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', color: '#16a34a' }}>
                        {client.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight: '700', color: '#111', fontSize: '14px', margin: '0 0 2px' }}>{client.name}</p>
                        <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>{client.email || client.phone || 'No contact info'}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: '#16a34a', fontWeight: '700', fontSize: '14px', margin: '0 0 2px' }}>${client.totalRevenue.toFixed(0)}</p>
                      <p style={{ color: '#6b7280', fontSize: '11px', margin: 0 }}>
                        {client.totalQuotes}Q · {client.totalInvoices}I · {client.totalJobs}J
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Client Detail */}
          {selected && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '56px', height: '56px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '800', color: '#16a34a' }}>
                    {selected.name[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#111', margin: '0 0 4px' }}>{selected.name}</h2>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      {selected.email && <span style={{ color: '#6b7280', fontSize: '13px' }}>✉️ {selected.email}</span>}
                      {selected.phone && <span style={{ color: '#6b7280', fontSize: '13px' }}>📞 {selected.phone}</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ padding: '8px 16px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', color: '#374151' }}>
                  Close
                </button>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
                {[
                  { label: 'Total Revenue', value: `$${selected.totalRevenue.toFixed(2)}`, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
                  { label: 'Unpaid', value: `$${selected.unpaidAmount.toFixed(2)}`, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
                  { label: 'Quotes', value: selected.totalQuotes, color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
                  { label: 'Jobs', value: selected.totalJobs, color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
                ].map(stat => (
                  <div key={stat.label} style={{ background: stat.bg, border: `1px solid ${stat.border}`, borderRadius: '10px', padding: '14px' }}>
                    <p style={{ color: '#6b7280', fontSize: '11px', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>{stat.label}</p>
                    <p style={{ color: stat.color, fontSize: '20px', fontWeight: '800', margin: 0 }}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Quotes */}
              {clientQuotes.length > 0 && (
                <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5e7eb' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#111', margin: 0 }}>📋 Quotes</h3>
                  </div>
                  {clientQuotes.map(q => (
                    <div key={q.id} style={{ padding: '12px 20px', borderBottom: '1px solid #f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: '#111', margin: '0 0 2px' }}>{q.job_description?.slice(0, 50) || 'Quote'}</p>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{new Date(q.created_at).toLocaleDateString('en-CA')}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#16a34a', margin: '0 0 2px' }}>${q.total?.toFixed(2)}</p>
                        <span style={{ fontSize: '11px', background: '#f9fafb', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '100px', padding: '2px 8px' }}>{q.status || 'Draft'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Invoices */}
              {clientInvoices.length > 0 && (
                <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5e7eb' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#111', margin: 0 }}>🧾 Invoices</h3>
                  </div>
                  {clientInvoices.map(inv => (
                    <div key={inv.id} style={{ padding: '12px 20px', borderBottom: '1px solid #f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: '#111', margin: '0 0 2px' }}>{inv.job_description?.slice(0, 50) || 'Invoice'}</p>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{new Date(inv.created_at).toLocaleDateString('en-CA')}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: inv.status === 'paid' ? '#16a34a' : '#dc2626', margin: '0 0 2px' }}>${inv.total?.toFixed(2)}</p>
                        <span style={{ fontSize: '11px', background: inv.status === 'paid' ? '#f0fdf4' : '#fef2f2', color: inv.status === 'paid' ? '#16a34a' : '#dc2626', border: `1px solid ${inv.status === 'paid' ? '#bbf7d0' : '#fecaca'}`, borderRadius: '100px', padding: '2px 8px' }}>{inv.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Jobs */}
              {clientJobs.length > 0 && (
                <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5e7eb' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#111', margin: 0 }}>🔧 Jobs</h3>
                  </div>
                  {clientJobs.map(j => (
                    <div key={j.id} style={{ padding: '12px 20px', borderBottom: '1px solid #f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: '#111', margin: '0 0 2px' }}>{j.title}</p>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{j.scheduled_date ? new Date(j.scheduled_date + 'T00:00:00').toLocaleDateString('en-CA') : 'No date'}</p>
                      </div>
                      <span style={{ fontSize: '11px', background: j.status === 'completed' ? '#f0fdf4' : '#fefce8', color: j.status === 'completed' ? '#16a34a' : '#854d0e', border: `1px solid ${j.status === 'completed' ? '#bbf7d0' : '#fde047'}`, borderRadius: '100px', padding: '2px 8px' }}>{j.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
