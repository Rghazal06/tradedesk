'use client';

import { useState } from 'react';

interface UpgradeModalProps {
  reason?: 'trial_expired' | 'pro_required' | 'required';
  email: string;
  onClose?: () => void;
}

const STARTER_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || 'price_1TYyLwHtCISkRQL6TBKz9xQh';
const PRO_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_1TYyMaHtCISkRQL6RWAB2eoo';

export default function UpgradeModal({ reason = 'required', email, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState<string | null>(null);

  async function checkout(priceId: string, planName: string) {
    setLoading(planName);
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId, email }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
    setLoading(null);
  }

  const messages = {
    trial_expired: {
      title: 'Your free trial has ended',
      body: 'Upgrade to keep access to your quotes, invoices, clients, and all your data.',
    },
    pro_required: {
      title: 'Pro plan required',
      body: 'This feature is available on the Pro plan. Upgrade to unlock AI features and priority support.',
    },
    required: {
      title: 'Subscription required',
      body: 'Your trial has expired. Choose a plan to keep your business running on TradeDesk.',
    },
  };

  const msg = messages[reason];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '22px' }}>
            TD
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#111', margin: '0 0 8px' }}>{msg.title}</h2>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>{msg.body}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
            <p style={{ fontWeight: '700', color: '#111', margin: '0 0 4px', fontSize: '14px' }}>Starter</p>
            <p style={{ color: '#16a34a', fontSize: '20px', fontWeight: '800', margin: '0 0 6px' }}>$99/mo</p>
            <p style={{ color: '#6b7280', fontSize: '12px', margin: '0 0 14px' }}>Quotes, Invoices, Jobs, WSIB, Appointments</p>
            <button
              onClick={() => checkout(STARTER_PRICE_ID, 'starter')}
              disabled={!!loading}
              style={{ width: '100%', padding: '9px', background: 'white', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading === 'starter' ? '...' : 'Select Starter'}
            </button>
          </div>
          <div style={{ border: '1px solid #bbf7d0', background: '#f0fdf4', borderRadius: '12px', padding: '16px' }}>
            <p style={{ fontWeight: '700', color: '#111', margin: '0 0 4px', fontSize: '14px' }}>Pro</p>
            <p style={{ color: '#16a34a', fontSize: '20px', fontWeight: '800', margin: '0 0 6px' }}>$199/mo</p>
            <p style={{ color: '#6b7280', fontSize: '12px', margin: '0 0 14px' }}>Everything + AI features + priority support</p>
            <button
              onClick={() => checkout(PRO_PRICE_ID, 'pro')}
              disabled={!!loading}
              style={{ width: '100%', padding: '9px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading === 'pro' ? '...' : 'Select Pro'}
            </button>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} style={{ width: '100%', padding: '10px', background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer' }}>
            Maybe later
          </button>
        )}
      </div>
    </div>
  );
}
