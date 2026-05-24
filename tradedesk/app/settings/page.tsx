'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

const inputStyle = {
  width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb',
  borderRadius: '8px', fontSize: '14px', color: '#111',
  background: '#f9fafb', boxSizing: 'border-box' as const,
};

const labelStyle = {
  display: 'block', fontSize: '12px', fontWeight: '600' as const,
  color: '#374151', marginBottom: '6px',
  textTransform: 'uppercase' as const, letterSpacing: '0.5px',
};

export default function SettingsPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState({
    full_name: '', email: '', trade_type: '', company_name: '',
    phone: '', address: '', hst_number: '', wsib_number: '',
    payment_terms: 'Payment due within 30 days.', google_review_link: '',
  });

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) setProfile(prev => ({
      ...prev, ...data, email: user.email || '',
      phone: data.phone || '', company_name: data.company_name || '',
      address: data.address || '', hst_number: data.hst_number || '',
      wsib_number: data.wsib_number || '',
      payment_terms: data.payment_terms || 'Payment due within 30 days.',
      google_review_link: data.google_review_link || '',
    }));
  }

  async function saveProfile() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('profiles').upsert({ id: user.id, ...profile });
    if (error) setMessage('Error saving: ' + error.message);
    else setMessage('Settings saved successfully!');
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  }

  const sectionStyle = {
    background: 'white', border: '1px solid #e5e7eb',
    borderRadius: '12px', padding: '24px', marginBottom: '20px',
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
            const isActive = item.href === '/settings';
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
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: 0 }}>Settings</h1>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '2px 0 0' }}>Manage your account and business information</p>
          </div>
          <button onClick={saveProfile} disabled={saving} style={{
            padding: '10px 20px', background: '#16a34a', color: 'white',
            borderRadius: '8px', fontWeight: '600', fontSize: '14px',
            border: 'none', cursor: 'pointer', opacity: saving ? 0.7 : 1,
            boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
          }}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        <div style={{ padding: '32px', overflowY: 'auto', flex: 1, maxWidth: '800px' }}>

          {message && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#15803d', fontSize: '14px' }}>
              ✓ {message}
            </div>
          )}

          {/* Personal Info */}
          <div style={sectionStyle}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111', margin: '0 0 20px' }}>Personal Information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input value={profile.full_name} onChange={e => setProfile({...profile, full_name: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input value={profile.email} disabled style={{ ...inputStyle, color: '#9ca3af', cursor: 'not-allowed' }} />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} placeholder="519-555-0000" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Trade Type</label>
                <select value={profile.trade_type} onChange={e => setProfile({...profile, trade_type: e.target.value})} style={inputStyle}>
                  <option value="">Select trade</option>
                  {['Electrician', 'Plumber', 'HVAC', 'General Contractor', 'Roofer', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Business Info */}
          <div style={sectionStyle}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111', margin: '0 0 20px' }}>Business Information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Company Name</label>
                <input value={profile.company_name} onChange={e => setProfile({...profile, company_name: e.target.value})} placeholder="Smith Electrical Ltd." style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>HST Number</label>
                <input value={profile.hst_number} onChange={e => setProfile({...profile, hst_number: e.target.value})} placeholder="123456789 RT0001" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>WSIB Account Number</label>
                <input value={profile.wsib_number} onChange={e => setProfile({...profile, wsib_number: e.target.value})} placeholder="1234567" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Business Address</label>
                <input value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} placeholder="123 Main St, London ON" style={inputStyle} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Default Payment Terms</label>
                <textarea value={profile.payment_terms} onChange={e => setProfile({...profile, payment_terms: e.target.value})} rows={2}
                  style={{ ...inputStyle, resize: 'none' }} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Google Review Link</label>
                <input value={profile.google_review_link} onChange={e => setProfile({...profile, google_review_link: e.target.value})} placeholder="https://g.page/r/your-business/review" style={inputStyle} />
                <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '6px' }}>Find this in your Google Business Profile. Sent automatically when a job is completed.</p>
              </div>
            </div>
          </div>

          {/* Subscription */}
          <div style={sectionStyle}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111', margin: '0 0 20px' }}>Subscription</h2>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <p style={{ color: '#15803d', fontWeight: '700', fontSize: '15px', margin: '0 0 4px' }}>Free Trial</p>
                <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>14 days remaining — upgrade to keep access</p>
              </div>
              <button style={{ padding: '8px 18px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
                Upgrade to Pro
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { name: 'Starter', price: '$99/month', desc: 'Quotes, Invoices, WSIB, Jobs', priceId: 'price_1TYyLwHtCISkRQL6TBKz9xQh', highlight: false },
                { name: 'Pro', price: '$199/month', desc: 'Everything + Priority Support', priceId: 'price_1TYyMaHtCISkRQL6RWAB2eoo', highlight: true },
              ].map(plan => (
                <div key={plan.name} style={{
                  padding: '20px', border: `1px solid ${plan.highlight ? '#bbf7d0' : '#e5e7eb'}`,
                  borderRadius: '10px', background: plan.highlight ? '#f0fdf4' : 'white',
                }}>
                  <p style={{ fontWeight: '700', color: '#111', margin: '0 0 4px' }}>{plan.name}</p>
                  <p style={{ fontSize: '22px', fontWeight: '800', color: plan.highlight ? '#16a34a' : '#111', margin: '0 0 4px' }}>{plan.price}</p>
                  <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 16px' }}>{plan.desc}</p>
                  <button
                    onClick={async () => {
                      const res = await fetch('/api/create-checkout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ priceId: plan.priceId, email: profile.email })
                      });
                      const { url } = await res.json();
                      if (url) window.location.href = url;
                    }}
                    style={{ width: '100%', padding: '10px', background: plan.highlight ? '#16a34a' : 'white', color: plan.highlight ? 'white' : '#16a34a', border: `1px solid ${plan.highlight ? '#16a34a' : '#bbf7d0'}`, borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                    Select {plan.name}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}