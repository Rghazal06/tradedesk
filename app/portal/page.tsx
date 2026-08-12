'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const FF = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const pageStyle: React.CSSProperties = {
  minHeight: '100vh', background: '#f8fafc', fontFamily: FF, padding: '48px 16px',
};
const cardStyle: React.CSSProperties = {
  background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '16px',
};
const centeredStyle: React.CSSProperties = {
  minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FF, color: '#6b7280',
};

function PortalContent(): React.JSX.Element {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [payingDeposit, setPayingDeposit] = useState(false);
  const [depositError, setDepositError] = useState('');

  useEffect(() => { if (token) loadQuote(); else setNotFound(true); }, [token]);

  async function loadQuote() {
    const res = await fetch(`/api/quotes/by-token?token=${encodeURIComponent(token!)}`);
    if (!res.ok) { setNotFound(true); setLoading(false); return; }
    const { quote: data } = await res.json();
    setQuote(data);
    setApproved(data.approved || false);
    setLoading(false);
  }

  async function approveQuote() {
    if (!quote || !token) return;
    setApproving(true);
    const res = await fetch('/api/quotes/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (res.ok) {
      setApproved(true);
    }
    setApproving(false);
  }

  async function payDeposit() {
    if (!token) return;
    setPayingDeposit(true);
    setDepositError('');
    try {
      const res = await fetch('/api/quotes/create-deposit-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setDepositError(data.error || 'Could not start payment.');
        setPayingDeposit(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setDepositError('Network error. Please try again.');
      setPayingDeposit(false);
    }
  }

  const formatCurrency = (value: number) =>
    (value ?? 0).toLocaleString('en-CA', { style: 'currency', currency: 'CAD' });

  if (loading) return <div style={centeredStyle}>Loading your quote...</div>;

  if (notFound) return (
    <div style={centeredStyle}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: '0 0 8px' }}>Quote Not Found</h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>This link may have expired or is invalid.</p>
      </div>
    </div>
  );

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ background: '#16a34a', borderRadius: '12px', padding: '28px', marginBottom: '16px', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '6px 14px' }}>
              <span style={{ fontWeight: '700', fontSize: '15px' }}>TradeDesk</span>
            </div>
            <span style={{ color: '#dcfce7', fontSize: '13px' }}>Customer Quote Portal</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 4px' }}>Hi, {quote?.customer_name}!</h1>
          <p style={{ color: '#dcfce7', margin: 0, fontSize: '14px' }}>Here's your quote. Review it and approve when ready.</p>
        </div>

        {approved && (
          <div style={{ ...cardStyle, background: '#f0fdf4', border: '1px solid #bbf7d0', textAlign: 'center' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" style={{ display: 'block', margin: '0 auto 8px' }}><circle cx="12" cy="12" r="10" fill="#dcfce7" stroke="#86efac" strokeWidth="1.5"/><path d="M8 12l3 3 5-5" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <h2 style={{ color: '#15803d', fontWeight: '800', fontSize: '18px', margin: '0 0 4px' }}>Quote Approved!</h2>
            <p style={{ color: '#16a34a', margin: 0, fontSize: '13px' }}>
              {quote?.deposit_amount > 0
                ? `Thank you! Your deposit of ${formatCurrency(Number(quote.deposit_amount))} was received and the contractor will be in touch shortly.`
                : 'Thank you! The contractor will be in touch shortly.'}
            </p>
          </div>
        )}

        {quote?.job_description && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111', margin: '0 0 8px' }}>Job Description</h2>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '14px', lineHeight: 1.6 }}>{quote.job_description}</p>
          </div>
        )}

        <div style={cardStyle}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111', margin: '0 0 16px' }}>Quote Details</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <th style={{ textAlign: 'left', padding: '6px 0', color: '#6b7280', fontWeight: '600' }}>Description</th>
                  <th style={{ textAlign: 'center', padding: '6px 0', color: '#6b7280', fontWeight: '600' }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '6px 0', color: '#6b7280', fontWeight: '600' }}>Unit Price</th>
                  <th style={{ textAlign: 'right', padding: '6px 0', color: '#6b7280', fontWeight: '600' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {quote?.line_items?.map((item: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}>
                    <td style={{ padding: '10px 0', color: '#111' }}>{item.description}</td>
                    <td style={{ padding: '10px 0', textAlign: 'center', color: '#6b7280' }}>{item.quantity}</td>
                    <td style={{ padding: '10px 0', textAlign: 'right', color: '#6b7280' }}>{formatCurrency(Number(item.unit_price))}</td>
                    <td style={{ padding: '10px 0', textAlign: 'right', color: '#111', fontWeight: '600' }}>{formatCurrency(Number(item.total || item.quantity * item.unit_price))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>
              <span>Subtotal</span><span>{formatCurrency(Number(quote?.subtotal))}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>
              <span>HST (13%)</span><span>{formatCurrency(Number(quote?.hst))}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '800', color: '#111', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
              <span>Total (CAD)</span><span>{formatCurrency(Number(quote?.total))}</span>
            </div>
          </div>
        </div>

        {quote?.notes && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111', margin: '0 0 8px' }}>Notes &amp; Terms</h2>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '13px', lineHeight: 1.6 }}>{quote.notes}</p>
          </div>
        )}

        {!approved && quote?.deposit_amount > 0 && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111', margin: '0 0 8px' }}>Deposit Required</h2>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 16px', lineHeight: 1.6 }}>
              A deposit of <strong>{formatCurrency(Number(quote.deposit_amount))}</strong> is required to approve this quote. You'll be redirected to a secure payment page.
            </p>
            {depositError && <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '12px' }}>{depositError}</p>}
            <button
              onClick={payDeposit}
              disabled={payingDeposit}
              style={{
                width: '100%', padding: '16px', background: '#16a34a', color: 'white', border: 'none',
                borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', opacity: payingDeposit ? 0.7 : 1,
              }}>
              {payingDeposit ? 'Redirecting to payment...' : `Pay Deposit (${formatCurrency(Number(quote.deposit_amount))}) & Approve`}
            </button>
          </div>
        )}

        {!approved && !(quote?.deposit_amount > 0) && (
          <button
            onClick={approveQuote}
            disabled={approving}
            style={{
              width: '100%', padding: '16px', background: '#16a34a', color: 'white', border: 'none',
              borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', opacity: approving ? 0.7 : 1,
            }}>
            {approving ? 'Approving...' : 'Approve This Quote'}
          </button>
        )}

        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '12px', marginTop: '20px' }}>
          Powered by TradeDesk — Business software for Ontario contractors
        </p>
      </div>
    </div>
  );
}

export default function PortalPage(): React.JSX.Element {
  return (
    <Suspense fallback={<div style={centeredStyle}>Loading...</div>}>
      <PortalContent />
    </Suspense>
  );
}
