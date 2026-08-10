'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

type LineItem = { description: string; quantity: number; unit_price: number; total?: number };
type InvoiceData = {
  id: string;
  customer_name: string;
  line_items: LineItem[];
  subtotal: number;
  hst: number;
  total: number;
  status: string;
  notes?: string | null;
  tip_amount?: number | null;
};

const TIP_PRESETS = [0, 0.10, 0.15, 0.20];

function PayContent(): React.JSX.Element {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [contractorName, setContractorName] = useState('TradeDesk');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tipPreset, setTipPreset] = useState<number | 'custom'>(0);
  const [customTip, setCustomTip] = useState('');
  const [paying, setPaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return; }
    (async () => {
      const res = await fetch(`/api/invoices/by-token?token=${encodeURIComponent(token)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setLoadError(`${res.status}: ${body.error || 'Unknown error'}`);
        setNotFound(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setInvoice(data.invoice);
      setContractorName(data.contractorName);
      setLoading(false);
    })();
  }, [token]);

  const tipAmount = tipPreset === 'custom'
    ? (Number.parseFloat(customTip) || 0)
    : Number(invoice?.total || 0) * tipPreset;

  const payTotal = Number(invoice?.total || 0) + tipAmount;

  async function handlePay() {
    if (!token) return;
    setPaying(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/invoices/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, tipAmount: Math.round(tipAmount * 100) / 100 }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setErrorMessage(data.error || 'Could not start payment.');
        setPaying(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setErrorMessage('Network error. Please try again.');
      setPaying(false);
    }
  }

  const formatCurrency = (value: number) =>
    (value ?? 0).toLocaleString('en-CA', { style: 'currency', currency: 'CAD' });

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh', background: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: '48px 16px',
  };
  const cardStyle: React.CSSProperties = {
    background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px',
    padding: '24px', marginBottom: '16px',
  };

  if (loading) {
    return <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>Loading invoice...</div>;
  }

  if (notFound || !invoice) {
    return (
      <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: '0 0 8px' }}>Invoice Not Found</h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>This link may have expired or is invalid.</p>
          {loadError && <p style={{ color: '#d1d5db', fontSize: '11px', marginTop: '12px' }}>({loadError})</p>}
        </div>
      </div>
    );
  }

  const isPaid = String(invoice.status).toLowerCase() === 'paid';

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Invoice from</p>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#111', margin: 0 }}>{contractorName}</h1>
        </div>

        {isPaid && (
          <div style={{ ...cardStyle, textAlign: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <p style={{ fontSize: '18px', fontWeight: '700', color: '#15803d', margin: '0 0 4px' }}>✓ Paid</p>
            <p style={{ color: '#16a34a', fontSize: '13px', margin: 0 }}>This invoice has already been paid. Thank you!</p>
          </div>
        )}

        <div style={cardStyle}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111', margin: '0 0 16px' }}>Invoice Details</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <th style={{ textAlign: 'left', padding: '6px 0', color: '#6b7280', fontWeight: '600' }}>Description</th>
                  <th style={{ textAlign: 'center', padding: '6px 0', color: '#6b7280', fontWeight: '600' }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '6px 0', color: '#6b7280', fontWeight: '600' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.line_items || []).map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}>
                    <td style={{ padding: '8px 0', color: '#111' }}>{item.description}</td>
                    <td style={{ padding: '8px 0', textAlign: 'center', color: '#6b7280' }}>{item.quantity}</td>
                    <td style={{ padding: '8px 0', textAlign: 'right', color: '#111', fontWeight: '600' }}>
                      {formatCurrency(item.total ?? item.quantity * item.unit_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>
              <span>Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>
              <span>HST (13%)</span><span>{formatCurrency(invoice.hst)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '800', color: '#111', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
              <span>Invoice Total</span><span>{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        {!isPaid && (
          <>
            <div style={cardStyle}>
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111', margin: '0 0 12px' }}>Add a Tip (optional)</h2>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                {TIP_PRESETS.map(pct => (
                  <button
                    key={pct}
                    onClick={() => setTipPreset(pct)}
                    style={{
                      flex: '1 1 70px', padding: '10px 8px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                      border: tipPreset === pct ? '2px solid #16a34a' : '1px solid #e5e7eb',
                      background: tipPreset === pct ? '#f0fdf4' : '#f9fafb',
                      color: tipPreset === pct ? '#16a34a' : '#374151',
                    }}>
                    {pct === 0 ? 'No tip' : `${pct * 100}%`}
                  </button>
                ))}
                <button
                  onClick={() => setTipPreset('custom')}
                  style={{
                    flex: '1 1 70px', padding: '10px 8px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                    border: tipPreset === 'custom' ? '2px solid #16a34a' : '1px solid #e5e7eb',
                    background: tipPreset === 'custom' ? '#f0fdf4' : '#f9fafb',
                    color: tipPreset === 'custom' ? '#16a34a' : '#374151',
                  }}>
                  Custom
                </button>
              </div>
              {tipPreset === 'custom' && (
                <input
                  value={customTip}
                  onChange={e => setCustomTip(e.target.value)}
                  type="number" min="0" step="0.01" placeholder="0.00"
                  style={{ marginTop: '10px', width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' as const }}
                />
              )}
              {tipAmount > 0 && (
                <p style={{ marginTop: '10px', fontSize: '13px', color: '#6b7280' }}>Tip: {formatCurrency(tipAmount)}</p>
              )}
            </div>

            {errorMessage && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#991b1b', fontSize: '13px' }}>
                {errorMessage}
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={paying}
              style={{
                width: '100%', padding: '16px', background: '#16a34a', color: 'white', border: 'none',
                borderRadius: '10px', fontSize: '16px', fontWeight: '700', cursor: 'pointer',
                opacity: paying ? 0.7 : 1,
              }}>
              {paying ? 'Redirecting to payment...' : `Pay ${formatCurrency(payTotal)}`}
            </button>
          </>
        )}

        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '12px', marginTop: '20px' }}>
          Powered by TradeDesk — Business software for Ontario contractors
        </p>
      </div>
    </div>
  );
}

export default function PayPage(): React.JSX.Element {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>Loading...</div>}>
      <PayContent />
    </Suspense>
  );
}
