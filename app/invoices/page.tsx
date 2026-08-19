"use client";

import { loadStripe } from "@stripe/stripe-js";
import { useCallback, useEffect, useState } from "react";
import { generateInvoicePDF, invoiceRowToPdfData, type InvoiceDbRow } from "../../lib/generateInvoicePDF";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Sidebar from '../../components/Sidebar';

type InvoiceRow = InvoiceDbRow & {
  id: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
  payment_token?: string | null;
};

const getPayLink = (invoice: InvoiceRow) =>
  invoice.payment_token && typeof window !== 'undefined'
    ? `${window.location.origin}/pay?token=${invoice.payment_token}`
    : '';


const formatCurrency = (value: number) =>
  (value ?? 0).toLocaleString("en-CA", { style: "currency", currency: "CAD" });

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [paymentLinkLoadingId, setPaymentLinkLoadingId] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  useEffect(() => {
    if (stripePublishableKey) void loadStripe(stripePublishableKey);
  }, [stripePublishableKey]);

  const fetchInvoices = useCallback(async () => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) { setErrorMessage("Please sign in."); setLoading(false); return; }
    const { data, error } = await supabase
      .from("invoices")
      .select("id, customer_name, customer_email, customer_phone, job_description, line_items, subtotal, hst, total, notes, status, created_at, payment_token")
      .eq("user_id", authData.user.id)
      .order("created_at", { ascending: false });
    if (error) { setErrorMessage('Could not load invoices. Please refresh.'); setLoading(false); return; }
    setInvoices((data ?? []) as InvoiceRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { queueMicrotask(() => { void fetchInvoices(); }); }, [fetchInvoices]);

  const handleMarkPaid = async (invoiceId: string) => {
    setMarkingPaidId(invoiceId);
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) { setMarkingPaidId(null); return; }
    await supabase.from("invoices").update({ status: "paid" }).eq("id", invoiceId).eq("user_id", authData.user.id);
    setMarkingPaidId(null);
    setInvoices(current => current.map(inv => inv.id === invoiceId ? { ...inv, status: "paid" } : inv));
  };

  const handleSendPaymentLink = async (invoice: InvoiceRow) => {
    setPaymentLinkLoadingId(invoice.id);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setErrorMessage("Please sign in."); setPaymentLinkLoadingId(null); return; }
    let token = invoice.payment_token;
    if (!token) {
      token = crypto.randomUUID();
      const { error } = await supabase.from("invoices").update({ payment_token: token }).eq("id", invoice.id).eq("user_id", userData.user.id);
      if (error) { setErrorMessage("Could not create payment link."); setPaymentLinkLoadingId(null); return; }
    }
    setInvoices(current => current.map(inv => inv.id === invoice.id ? { ...inv, payment_token: token } : inv));
    setPaymentLinkLoadingId(null);
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('Delete this invoice? This cannot be undone.')) return;
    setDeletingId(id);
    const { data: authData } = await supabase.auth.getUser();
    if (authData.user) {
      await supabase.from('invoices').delete().eq('id', id).eq('user_id', authData.user.id);
      setInvoices(current => current.filter(inv => inv.id !== id));
    }
    setDeletingId(null);
  };

  const handleCopyPaymentLink = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopyToast("Link copied!");
    setTimeout(() => setCopyToast(null), 2500);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f4', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Sidebar activePath="/invoices" />

      

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Top bar */}
        <div className="td-topbar" style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: 0 }}>Invoices</h1>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '2px 0 0' }}>Track and manage customer payments</p>
          </div>
          <a href="/quotes" style={{ padding: '10px 20px', background: '#f9fafb', color: '#374151', borderRadius: '8px', fontWeight: '600', fontSize: '14px', textDecoration: 'none', border: '1px solid #e5e7eb' }}>
            From Quotes →
          </a>
        </div>

        <div className="td-body" style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>

          {copyToast && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#15803d', fontSize: '14px' }}>
              {copyToast}
            </div>
          )}

          {errorMessage && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#991b1b', fontSize: '14px' }}>
              {errorMessage}
            </div>
          )}

          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e5e7eb' }}>
              <h2 style={{ color: '#111', fontSize: '15px', fontWeight: '700', margin: 0 }}>All Invoices</h2>
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading invoices...</div>
            ) : invoices.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
                <div style={{ width: '48px', height: '48px', margin: '0 auto 16px', background: '#f3f4f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 1h16v20l-2.5-2L14 21l-2-2-2 2-2.5-1.5L3 21z" stroke="#9ca3af" strokeWidth="1.5" strokeLinejoin="round"/><line x1="6" y1="7" x2="16" y2="7" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round"/><line x1="6" y1="11" x2="16" y2="11" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round"/></svg>
                </div>
                <p style={{ margin: '0 0 6px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>No invoices yet</p>
                <p style={{ margin: '0 0 20px', fontSize: '13px' }}>Convert a quote to create your first invoice</p>
                <a href="/quotes" style={{ background: '#16a34a', color: 'white', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '14px' }}>Go to Quotes</a>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="inv-desktop-table" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '960px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                        {['Customer', 'Total', 'Status', 'Date', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '12px 24px', textAlign: 'left', color: '#6b7280', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map(invoice => {
                        const isPaid = (invoice.status || '').toLowerCase() === 'paid';
                        return (
                          <tr key={invoice.id}
                            onMouseEnter={e => { e.currentTarget.style.background = '#fafafa'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                            style={{ borderBottom: '1px solid #f9fafb', transition: 'background 0.1s' }}>
                            <td style={{ padding: '16px 24px', color: '#111', fontSize: '14px', fontWeight: '500' }}>{invoice.customer_name || '—'}</td>
                            <td style={{ padding: '16px 24px' }}>
                              <span style={{ color: '#16a34a', fontSize: '14px', fontWeight: '700' }}>{formatCurrency(invoice.total)}</span>
                              {invoice.hst > 0 && <span style={{ display: 'block', fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>incl. {formatCurrency(invoice.hst)} HST</span>}
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                              <span style={{ background: isPaid ? '#f0fdf4' : '#fef2f2', color: isPaid ? '#16a34a' : '#dc2626', border: `1px solid ${isPaid ? '#bbf7d0' : '#fecaca'}`, borderRadius: '100px', padding: '3px 10px', fontSize: '12px', fontWeight: '600' }}>
                                {isPaid ? 'Paid' : 'Unpaid'}
                              </span>
                            </td>
                            <td style={{ padding: '16px 24px', color: '#6b7280', fontSize: '13px' }}>{formatDate(invoice.created_at)}</td>
                            <td style={{ padding: '16px 24px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                                  <button onClick={() => router.push(`/invoices/${invoice.id}/edit`)} style={{ padding: '6px 12px', background: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Edit</button>
                                  <button onClick={() => generateInvoicePDF(invoiceRowToPdfData(invoice))} style={{ padding: '6px 12px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>PDF</button>
                                  {!isPaid && (<>
                                    <button disabled={paymentLinkLoadingId === invoice.id} onClick={() => void handleSendPaymentLink(invoice)} style={{ padding: '6px 12px', background: '#faf5ff', color: '#7c3aed', border: '1px solid #ddd6fe', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', opacity: paymentLinkLoadingId === invoice.id ? 0.6 : 1 }}>{paymentLinkLoadingId === invoice.id ? 'Generating...' : 'Pay Link'}</button>
                                    <button disabled={markingPaidId === invoice.id} onClick={() => void handleMarkPaid(invoice.id)} style={{ padding: '6px 12px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', opacity: markingPaidId === invoice.id ? 0.6 : 1 }}>{markingPaidId === invoice.id ? 'Updating...' : 'Mark Paid'}</button>
                                    <button onClick={async () => { const res = await fetch('/api/send-invoice-reminder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerEmail: invoice.customer_email, customerName: invoice.customer_name, invoiceTotal: invoice.total?.toFixed(2), invoiceId: invoice.id, contractorName: 'TradeDesk Contractor', contractorPhone: '', paymentLink: getPayLink(invoice) }) }); const data = await res.json(); if (data.success) { setCopyToast('Reminder sent to ' + invoice.customer_name); setTimeout(() => setCopyToast(null), 3000); } else setErrorMessage('Something went wrong. Please try again.'); }} style={{ padding: '6px 12px', background: '#fefce8', color: '#854d0e', border: '1px solid #fde047', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Remind</button>
                                  </>)}
                                  <button disabled={deletingId === invoice.id} onClick={() => void handleDeleteInvoice(invoice.id)} style={{ padding: '6px 12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', opacity: deletingId === invoice.id ? 0.5 : 1 }}>Delete</button>
                                </div>
                                {!isPaid && invoice.payment_token && (
                                  <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px' }}>
                                    <p style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 6px' }}>Pay Link</p>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                      <input readOnly value={getPayLink(invoice)} style={{ flex: 1, padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', color: '#374151', background: 'white' }} />
                                      <button onClick={() => void handleCopyPaymentLink(getPayLink(invoice))} style={{ padding: '6px 12px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#374151', cursor: 'pointer', whiteSpace: 'nowrap' as const }}>Copy</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="inv-mobile-cards" style={{ display: 'none', flexDirection: 'column' }}>
                  {invoices.map((invoice, i) => {
                    const isPaid = (invoice.status || '').toLowerCase() === 'paid';
                    return (
                      <div key={invoice.id} style={{ padding: '16px 20px', borderBottom: i < invoices.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                          <div>
                            <p style={{ fontSize: '16px', fontWeight: '700', color: '#111', margin: '0 0 3px' }}>{invoice.customer_name || '—'}</p>
                            <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>{formatDate(invoice.created_at)}</p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '22px', fontWeight: '800', color: '#16a34a', margin: '0 0 4px', letterSpacing: '-0.5px' }}>{formatCurrency(invoice.total)}</p>
                            <span style={{ background: isPaid ? '#f0fdf4' : '#fef2f2', color: isPaid ? '#16a34a' : '#dc2626', border: `1px solid ${isPaid ? '#bbf7d0' : '#fecaca'}`, borderRadius: '100px', padding: '2px 10px', fontSize: '12px', fontWeight: '700' }}>{isPaid ? 'Paid' : 'Unpaid'}</span>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <button onClick={() => router.push(`/invoices/${invoice.id}/edit`)} style={{ padding: '12px', background: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', minHeight: '48px' }}>Edit</button>
                          <button onClick={() => generateInvoicePDF(invoiceRowToPdfData(invoice))} style={{ padding: '12px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', minHeight: '48px' }}>Download PDF</button>
                          {!isPaid && <>
                            <button disabled={markingPaidId === invoice.id} onClick={() => void handleMarkPaid(invoice.id)} style={{ padding: '12px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', minHeight: '52px', opacity: markingPaidId === invoice.id ? 0.6 : 1, gridColumn: 'span 2' }}>{markingPaidId === invoice.id ? 'Updating...' : 'Mark as Paid'}</button>
                            <button disabled={paymentLinkLoadingId === invoice.id} onClick={() => void handleSendPaymentLink(invoice)} style={{ padding: '12px', background: '#faf5ff', color: '#7c3aed', border: '1px solid #ddd6fe', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', minHeight: '48px', opacity: paymentLinkLoadingId === invoice.id ? 0.6 : 1 }}>{paymentLinkLoadingId === invoice.id ? 'Generating...' : 'Pay Link'}</button>
                            <button onClick={async () => { const res = await fetch('/api/send-invoice-reminder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerEmail: invoice.customer_email, customerName: invoice.customer_name, invoiceTotal: invoice.total?.toFixed(2), invoiceId: invoice.id, contractorName: 'TradeDesk Contractor', contractorPhone: '', paymentLink: getPayLink(invoice) }) }); const data = await res.json(); if (data.success) { setCopyToast('Reminder sent to ' + invoice.customer_name); setTimeout(() => setCopyToast(null), 3000); } else setErrorMessage('Something went wrong. Please try again.'); }} style={{ padding: '12px', background: '#fefce8', color: '#854d0e', border: '1px solid #fde047', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', minHeight: '48px' }}>Remind</button>
                            <button disabled={deletingId === invoice.id} onClick={() => void handleDeleteInvoice(invoice.id)} style={{ padding: '12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', minHeight: '48px', opacity: deletingId === invoice.id ? 0.5 : 1 }}>Delete</button>
                          </>}
                          {isPaid && <button disabled={deletingId === invoice.id} onClick={() => void handleDeleteInvoice(invoice.id)} style={{ padding: '12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', minHeight: '48px', opacity: deletingId === invoice.id ? 0.5 : 1, gridColumn: 'span 2' }}>Delete</button>}
                        </div>
                        {!isPaid && invoice.payment_token && (
                          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px', marginTop: '8px' }}>
                            <p style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 6px' }}>Pay Link</p>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input readOnly value={getPayLink(invoice)} style={{ flex: 1, padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', color: '#374151', background: 'white', minWidth: 0 }} />
                              <button onClick={() => void handleCopyPaymentLink(getPayLink(invoice))} style={{ padding: '8px 14px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#374151', cursor: 'pointer', whiteSpace: 'nowrap' as const, minHeight: '36px' }}>Copy</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}