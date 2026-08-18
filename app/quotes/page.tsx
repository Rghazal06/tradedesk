"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { generateQuotePDF, quoteRowToPdfData, type QuoteDbRow } from "../../lib/generatePDF";
import { supabase } from "../../lib/supabase";
import Sidebar from '../../components/Sidebar';

type QuoteRow = QuoteDbRow & {
  id: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
};


const formatCurrency = (value: number) =>
  (value ?? 0).toLocaleString("en-CA", { style: "currency", currency: "CAD" });

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });

export default function QuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchConverting, setBatchConverting] = useState(false);

  useEffect(() => {
    const fetchQuotes = async () => {
      setLoading(true);
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) { setErrorMessage("Please sign in."); setLoading(false); return; }
      const { data, error } = await supabase
        .from("quotes")
        .select("id, customer_name, customer_email, customer_phone, job_description, line_items, subtotal, hst, total, notes, status, created_at, portal_token")
        .eq("user_id", authData.user.id)
        .order("created_at", { ascending: false });
      if (error) { setErrorMessage('Could not load quotes. Please refresh.'); setLoading(false); return; }
      setQuotes(data ?? []);
      setLoading(false);
    };
    void fetchQuotes();
  }, []);

  const handleDeleteQuote = async (id: string) => {
    if (!confirm('Delete this quote? This cannot be undone.')) return;
    setDeletingId(id);
    const { data: authData } = await supabase.auth.getUser();
    if (authData.user) {
      await supabase.from('quotes').delete().eq('id', id).eq('user_id', authData.user.id);
      setQuotes(current => current.filter(q => q.id !== id));
    }
    setDeletingId(null);
  };

  const handleConvertToInvoice = async (quote: QuoteRow) => {
    setConvertingId(quote.id);
    const { data: authData, error: authError } = await supabase.auth.getUser();
    const user = authData.user;
    if (authError || !user) { setConvertingId(null); router.push("/login"); return; }
    const { error } = await supabase.from("invoices").insert({
      user_id: user.id,
      customer_name: quote.customer_name ?? "",
      customer_email: quote.customer_email,
      customer_phone: quote.customer_phone,
      job_description: quote.job_description,
      line_items: quote.line_items,
      subtotal: quote.subtotal ?? 0,
      hst: quote.hst ?? 0,
      total: quote.total ?? 0,
      notes: quote.notes,
      status: "unpaid",
    });
    setConvertingId(null);
    if (error) { setErrorMessage('Something went wrong. Please try again.'); return; }
    router.push("/invoices");
  };

  const toggleSelected = (id: string) => {
    setSelectedIds(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(current => current.size === quotes.length ? new Set() : new Set(quotes.map(q => q.id)));
  };

  const handleBatchConvert = async () => {
    setBatchConverting(true);
    const { data: authData, error: authError } = await supabase.auth.getUser();
    const user = authData.user;
    if (authError || !user) { setBatchConverting(false); router.push("/login"); return; }

    const selectedQuotes = quotes.filter(q => selectedIds.has(q.id));
    let succeeded = 0;
    for (const quote of selectedQuotes) {
      const { error } = await supabase.from("invoices").insert({
        user_id: user.id,
        customer_name: quote.customer_name ?? "",
        customer_email: quote.customer_email,
        customer_phone: quote.customer_phone,
        job_description: quote.job_description,
        line_items: quote.line_items,
        subtotal: quote.subtotal ?? 0,
        hst: quote.hst ?? 0,
        total: quote.total ?? 0,
        notes: quote.notes,
        status: "unpaid",
      });
      if (!error) succeeded++;
    }
    setBatchConverting(false);
    setSelectedIds(new Set());
    if (succeeded === 0) { setErrorMessage('Could not create invoices. Please try again.'); return; }
    if (succeeded < selectedQuotes.length) {
      setErrorMessage(`Created ${succeeded} of ${selectedQuotes.length} invoices — some failed. Please check and retry those.`);
    }
    router.push("/invoices");
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f4', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Sidebar activePath="/quotes" />

      

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Top bar */}
        <div className="td-topbar" style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: 0 }}>Quotes</h1>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '2px 0 0' }}>Create and manage your customer quotes</p>
          </div>
          <a href="/quotes/new" style={{
            padding: '10px 20px', background: '#16a34a', color: 'white',
            borderRadius: '8px', fontWeight: '600', fontSize: '14px',
            textDecoration: 'none', boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
          }}>+ New Quote</a>
        </div>

        <div className="td-body" style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
          {toast && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#15803d', fontSize: '14px' }}>
              {toast}
            </div>
          )}

          {errorMessage && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#991b1b', fontSize: '14px' }}>
              {errorMessage}
            </div>
          )}

          {selectedIds.size > 0 && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#15803d' }}>{selectedIds.size} quote{selectedIds.size !== 1 ? 's' : ''} selected</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setSelectedIds(new Set())} style={{ padding: '8px 14px', background: 'white', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Clear</button>
                <button disabled={batchConverting} onClick={() => void handleBatchConvert()} style={{ padding: '8px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', opacity: batchConverting ? 0.7 : 1 }}>
                  {batchConverting ? 'Creating invoices...' : `Create ${selectedIds.size} Invoice${selectedIds.size !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          )}

          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e5e7eb' }}>
              <h2 style={{ color: '#111', fontSize: '15px', fontWeight: '700', margin: 0 }}>All Quotes</h2>
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading quotes...</div>
            ) : quotes.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
                <div style={{ width: '48px', height: '48px', margin: '0 auto 16px', background: '#f3f4f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="1" width="16" height="20" rx="2" stroke="#9ca3af" strokeWidth="1.5"/><line x1="6" y1="6" x2="16" y2="6" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round"/><line x1="6" y1="10" x2="16" y2="10" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round"/><line x1="6" y1="14" x2="11" y2="14" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round"/></svg>
                </div>
                <p style={{ margin: '0 0 6px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>No quotes yet</p>
                <p style={{ margin: '0 0 20px', fontSize: '13px' }}>Create a quote to send to your customer</p>
                <a href="/quotes/new" style={{ background: '#16a34a', color: 'white', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '14px', display: 'inline-block', minHeight: '48px' }}>Create your first quote</a>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="q-desktop-table" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <th style={{ padding: '12px 0 12px 24px', width: '32px' }}>
                          <input type="checkbox" checked={selectedIds.size === quotes.length && quotes.length > 0} onChange={toggleSelectAll} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                        </th>
                        {['Customer', 'Total', 'Status', 'Date', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '12px 24px', textAlign: 'left', color: '#6b7280', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {quotes.map(quote => (
                        <tr key={quote.id}
                          onMouseEnter={e => { if (!selectedIds.has(quote.id)) e.currentTarget.style.background = '#fafafa'; }}
                          onMouseLeave={e => { if (!selectedIds.has(quote.id)) e.currentTarget.style.background = 'transparent'; }}
                          style={{ borderBottom: '1px solid #f9fafb', background: selectedIds.has(quote.id) ? '#f0fdf4' : 'transparent', transition: 'background 0.1s' }}>
                          <td style={{ padding: '14px 0 14px 24px' }}>
                            <input type="checkbox" checked={selectedIds.has(quote.id)} onChange={() => toggleSelected(quote.id)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                          </td>
                          <td style={{ padding: '14px 24px', color: '#111', fontSize: '14px', fontWeight: '500' }}>{quote.customer_name || '—'}</td>
                          <td style={{ padding: '14px 24px', color: '#16a34a', fontSize: '14px', fontWeight: '600' }}>{formatCurrency(quote.total)}</td>
                          <td style={{ padding: '14px 24px' }}>
                            <span style={{ background: quote.status === 'Approved' ? '#f0fdf4' : '#f9fafb', color: quote.status === 'Approved' ? '#16a34a' : '#6b7280', border: `1px solid ${quote.status === 'Approved' ? '#bbf7d0' : '#e5e7eb'}`, borderRadius: '100px', padding: '3px 10px', fontSize: '12px', fontWeight: '600' }}>
                              {quote.status || 'Draft'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 24px', color: '#6b7280', fontSize: '13px' }}>{formatDate(quote.created_at)}</td>
                          <td style={{ padding: '14px 24px' }}>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                              <button onClick={() => router.push(`/quotes/${quote.id}/edit`)} style={{ padding: '6px 12px', background: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Edit</button>
                              <button onClick={() => generateQuotePDF(quoteRowToPdfData(quote))} style={{ padding: '6px 12px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>PDF</button>
                              <button disabled={convertingId === quote.id} onClick={() => void handleConvertToInvoice(quote)} style={{ padding: '6px 12px', background: '#fefce8', color: '#854d0e', border: '1px solid #fde047', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', opacity: convertingId === quote.id ? 0.6 : 1 }}>{convertingId === quote.id ? 'Converting...' : '→ Invoice'}</button>
                              <button onClick={async () => { const anyQuote = quote as any; let token = anyQuote.portal_token; if (!token) { token = crypto.randomUUID(); await supabase.from('quotes').update({ portal_token: token }).eq('id', quote.id); } const link = `${window.location.origin}/portal?token=${token}`; await navigator.clipboard.writeText(link); setToast('Portal link copied — send it to your customer.'); setTimeout(() => setToast(''), 3000); }} style={{ padding: '6px 12px', background: '#faf5ff', color: '#7c3aed', border: '1px solid #ddd6fe', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Portal Link</button>
                              <button disabled={deletingId === quote.id} onClick={() => void handleDeleteQuote(quote.id)} style={{ padding: '6px 12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', opacity: deletingId === quote.id ? 0.5 : 1 }}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="q-mobile-cards" style={{ display: 'none', flexDirection: 'column', gap: '0' }}>
                  {quotes.map((quote, i) => (
                    <div key={quote.id} style={{ padding: '16px 20px', borderBottom: i < quotes.length - 1 ? '1px solid #f3f4f6' : 'none', background: selectedIds.has(quote.id) ? '#f0fdf4' : 'transparent' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <input type="checkbox" checked={selectedIds.has(quote.id)} onChange={() => toggleSelected(quote.id)} style={{ width: '18px', height: '18px', cursor: 'pointer', marginTop: '3px' }} />
                          <div>
                            <p style={{ fontSize: '16px', fontWeight: '700', color: '#111', margin: '0 0 3px' }}>{quote.customer_name || '—'}</p>
                            <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>{formatDate(quote.created_at)}</p>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '20px', fontWeight: '800', color: '#16a34a', margin: '0 0 4px', letterSpacing: '-0.5px' }}>{formatCurrency(quote.total)}</p>
                          <span style={{ background: quote.status === 'Approved' ? '#f0fdf4' : '#f9fafb', color: quote.status === 'Approved' ? '#16a34a' : '#6b7280', border: `1px solid ${quote.status === 'Approved' ? '#bbf7d0' : '#e5e7eb'}`, borderRadius: '100px', padding: '2px 8px', fontSize: '11px', fontWeight: '600' }}>{quote.status || 'Draft'}</span>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <button onClick={() => router.push(`/quotes/${quote.id}/edit`)} style={{ padding: '12px', background: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', minHeight: '48px' }}>Edit</button>
                        <button onClick={() => generateQuotePDF(quoteRowToPdfData(quote))} style={{ padding: '12px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', minHeight: '48px' }}>Download PDF</button>
                        <button disabled={convertingId === quote.id} onClick={() => void handleConvertToInvoice(quote)} style={{ padding: '12px', background: '#fefce8', color: '#854d0e', border: '1px solid #fde047', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', minHeight: '48px', opacity: convertingId === quote.id ? 0.6 : 1 }}>{convertingId === quote.id ? 'Converting...' : 'Convert to Invoice'}</button>
                        <button disabled={deletingId === quote.id} onClick={() => void handleDeleteQuote(quote.id)} style={{ padding: '12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', minHeight: '48px', opacity: deletingId === quote.id ? 0.5 : 1 }}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}