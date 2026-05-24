"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { generateQuotePDF, quoteRowToPdfData, type QuoteDbRow } from "../../lib/generatePDF";
import { supabase } from "../../lib/supabase";

type QuoteRow = QuoteDbRow & {
  id: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
};

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: '⚡' },
  { label: 'Appointments', href: '/appointments', icon: '📅' },
  { label: 'Quotes', href: '/quotes', icon: '📋' },
  { label: 'Invoices', href: '/invoices', icon: '🧾' },
  { label: 'Jobs', href: '/jobs', icon: '🔧' },
  { label: 'WSIB Tracking', href: '/wsib', icon: '🛡️' },
  { label: 'AI Profit Analyzer', href: '/profit', icon: '🤖' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
];

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
      if (error) { setErrorMessage(error.message); setLoading(false); return; }
      setQuotes(data ?? []);
      setLoading(false);
    };
    void fetchQuotes();
  }, []);

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
    if (error) { setErrorMessage(error.message); return; }
    router.push("/invoices");
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Sidebar */}
      <div style={{ width: '240px', minWidth: '240px', background: 'white', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0 }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', background: '#16a34a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '13px' }}>TD</div>
            <span style={{ fontWeight: '700', fontSize: '16px', color: '#111' }}>TradeDesk</span>
          </div>
        </div>
        <nav style={{ padding: '12px', flex: 1 }}>
          {NAV_ITEMS.map(item => {
            const isActive = item.href === '/quotes';
            return (
              <a key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px', borderRadius: '8px', marginBottom: '2px',
                textDecoration: 'none', fontSize: '13.5px',
                fontWeight: isActive ? '600' : '400',
                color: isActive ? '#16a34a' : '#6b7280',
                background: isActive ? '#f0fdf4' : 'transparent',
                border: isActive ? '1px solid #bbf7d0' : '1px solid transparent',
              }}>
                <span>{item.icon}</span>{item.label}
              </a>
            );
          })}
        </nav>
        <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb' }}>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
            style={{ width: '100%', padding: '8px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#6b7280', fontSize: '13px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Top bar */}
        <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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

        <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
          {errorMessage && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#991b1b', fontSize: '14px' }}>
              {errorMessage}
            </div>
          )}

          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
              <h2 style={{ color: '#111', fontSize: '15px', fontWeight: '700', margin: 0 }}>All Quotes</h2>
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading quotes...</div>
            ) : quotes.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
                <p style={{ margin: '0 0 16px', fontWeight: '500', color: '#374151' }}>No quotes yet</p>
                <a href="/quotes/new" style={{ background: '#16a34a', color: 'white', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '14px' }}>Create your first quote</a>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      {['Customer', 'Total', 'Status', 'Date', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '12px 24px', textAlign: 'left', color: '#6b7280', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {quotes.map(quote => (
                      <tr key={quote.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                        <td style={{ padding: '14px 24px', color: '#111', fontSize: '14px', fontWeight: '500' }}>{quote.customer_name || '—'}</td>
                        <td style={{ padding: '14px 24px', color: '#16a34a', fontSize: '14px', fontWeight: '600' }}>{formatCurrency(quote.total)}</td>
                        <td style={{ padding: '14px 24px' }}>
                          <span style={{
                            background: quote.status === 'Approved' ? '#f0fdf4' : '#f9fafb',
                            color: quote.status === 'Approved' ? '#16a34a' : '#6b7280',
                            border: `1px solid ${quote.status === 'Approved' ? '#bbf7d0' : '#e5e7eb'}`,
                            borderRadius: '100px', padding: '3px 10px', fontSize: '12px', fontWeight: '600'
                          }}>
                            {quote.status || 'Draft'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 24px', color: '#6b7280', fontSize: '13px' }}>{formatDate(quote.created_at)}</td>
                        <td style={{ padding: '14px 24px' }}>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => generateQuotePDF(quoteRowToPdfData(quote))}
                              style={{ padding: '6px 12px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                              PDF
                            </button>
                            <button
                              disabled={convertingId === quote.id}
                              onClick={() => void handleConvertToInvoice(quote)}
                              style={{ padding: '6px 12px', background: '#fefce8', color: '#854d0e', border: '1px solid #fde047', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', opacity: convertingId === quote.id ? 0.6 : 1 }}>
                              {convertingId === quote.id ? 'Converting...' : '→ Invoice'}
                            </button>
                            <button
                              onClick={async () => {
                                const anyQuote = quote as any;
                                if (!anyQuote.portal_token) {
                                  const token = crypto.randomUUID();
                                  await supabase.from('quotes').update({ portal_token: token }).eq('id', quote.id);
                                  const link = `${window.location.origin}/portal?token=${token}`;
                                  navigator.clipboard.writeText(link);
                                  alert('Portal link copied! Send this to your customer: ' + link);
                                } else {
                                  const link = `${window.location.origin}/portal?token=${anyQuote.portal_token}`;
                                  navigator.clipboard.writeText(link);
                                  alert('Portal link copied! Send this to your customer: ' + link);
                                }
                              }}
                              style={{ padding: '6px 12px', background: '#faf5ff', color: '#7c3aed', border: '1px solid #ddd6fe', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                              🔗 Portal
                            </button>
                          </div>
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