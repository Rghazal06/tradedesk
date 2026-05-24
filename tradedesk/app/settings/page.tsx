'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SettingsPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    trade_type: '',
    company_name: '',
    phone: '',
    address: '',
    hst_number: '',
    wsib_number: '',
    payment_terms: 'Payment due within 30 days.',
    google_review_link: '',
  });

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) setProfile(prev => ({
      ...prev,
      ...data,
      email: user.email || '',
      phone: data.phone || '',
      company_name: data.company_name || '',
      address: data.address || '',
      hst_number: data.hst_number || '',
      wsib_number: data.wsib_number || '',
      payment_terms: data.payment_terms || 'Payment due within 30 days.',
      google_review_link: data.google_review_link || '',
    }));
  }

  async function saveProfile() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      ...profile,
    });
    if (error) setMessage('Error saving: ' + error.message);
    else setMessage('Settings saved successfully!');
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  }

  return (
    <div className="flex min-h-screen bg-[#0a0f1e]">
      {/* Sidebar */}
      <div className="w-64 bg-[#0d1526] border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">TD</div>
            <span className="text-white font-semibold text-lg">TradeDesk</span>
          </div>
        </div>
        <nav className="p-4 flex-1">
          {[['Dashboard', '/dashboard'], ['Quotes', '/quotes'], ['Invoices', '/invoices'], ['Jobs', '/jobs'], ['WSIB Tracking', '/wsib'], ['AI Profit Analyzer', '/profit'], ['Settings', '/settings']].map(([label, href]) => (
            <a key={href} href={href} className={`block px-4 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors ${href === '/settings' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>{label}</a>
          ))}
        </nav>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <div className="bg-[#0d1526] border-b border-gray-800 px-8 py-4 flex items-center justify-between">
          <h1 className="text-white text-xl font-semibold">Settings</h1>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="px-4 py-2 border border-gray-600 text-gray-300 rounded-full text-sm hover:bg-gray-800">Logout</button>
        </div>

        <div className="p-8 space-y-6 max-w-3xl">
          {message && (
            <div className="p-4 bg-green-900/30 border border-green-700 rounded-xl text-green-300 text-sm">{message}</div>
          )}

          {/* Personal Info */}
          <div className="bg-[#0d1526] border border-gray-800 rounded-xl p-6">
            <h2 className="text-white font-semibold text-lg mb-4">Personal Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm block mb-1">Full Name</label>
                <input value={profile.full_name} onChange={e => setProfile({...profile, full_name: e.target.value})} className="w-full bg-[#0a0f1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm"/>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Email</label>
                <input value={profile.email} disabled className="w-full bg-[#0a0f1e] border border-gray-700 rounded-lg px-4 py-2.5 text-gray-500 text-sm cursor-not-allowed"/>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Phone</label>
                <input value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} placeholder="519-555-0000" className="w-full bg-[#0a0f1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm"/>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Trade Type</label>
                <select value={profile.trade_type} onChange={e => setProfile({...profile, trade_type: e.target.value})} className="w-full bg-[#0a0f1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm">
                  <option value="">Select trade</option>
                  {['Electrician', 'Plumber', 'HVAC', 'General Contractor', 'Roofer', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Business Info */}
          <div className="bg-[#0d1526] border border-gray-800 rounded-xl p-6">
            <h2 className="text-white font-semibold text-lg mb-4">Business Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm block mb-1">Company Name</label>
                <input value={profile.company_name} onChange={e => setProfile({...profile, company_name: e.target.value})} placeholder="Smith Electrical Ltd." className="w-full bg-[#0a0f1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm"/>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">HST Number</label>
                <input value={profile.hst_number} onChange={e => setProfile({...profile, hst_number: e.target.value})} placeholder="123456789 RT0001" className="w-full bg-[#0a0f1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm"/>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">WSIB Account Number</label>
                <input value={profile.wsib_number} onChange={e => setProfile({...profile, wsib_number: e.target.value})} placeholder="1234567" className="w-full bg-[#0a0f1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm"/>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Business Address</label>
                <input value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} placeholder="123 Main St, London ON" className="w-full bg-[#0a0f1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm"/>
              </div>
              <div className="col-span-2">
                <label className="text-gray-400 text-sm block mb-1">Default Payment Terms</label>
                <textarea value={profile.payment_terms} onChange={e => setProfile({...profile, payment_terms: e.target.value})} rows={2} className="w-full bg-[#0a0f1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm resize-none"/>
              </div>
              <div className="col-span-2">
                <label className="text-gray-400 text-sm block mb-1">Google Review Link</label>
                <input value={profile.google_review_link} onChange={e => setProfile({...profile, google_review_link: e.target.value})} placeholder="https://g.page/r/your-business/review" className="w-full bg-[#0a0f1e] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm"/>
                <p className="text-gray-500 text-xs mt-1">Find this in your Google Business Profile dashboard. Sent automatically when a job is completed.</p>
              </div>
            </div>
          </div>

          {/* Subscription */}
          <div className="bg-[#0d1526] border border-gray-800 rounded-xl p-6">
            <h2 className="text-white font-semibold text-lg mb-4">Subscription</h2>
            <div className="flex items-center justify-between p-4 bg-blue-900/20 border border-blue-800 rounded-xl">
              <div>
                <p className="text-white font-medium">Free Trial</p>
                <p className="text-gray-400 text-sm mt-1">14 days remaining — upgrade to keep access</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">Upgrade to Pro</button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="p-4 border border-gray-700 rounded-xl">
                <p className="text-white font-semibold">Starter</p>
                <p className="text-blue-400 text-xl font-bold mt-1">$99/month</p>
                <p className="text-gray-400 text-sm mt-1">Quotes, Invoices, WSIB, Jobs</p>
                <button
                  onClick={async () => {
                    const res = await fetch('/api/create-checkout', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ priceId: 'price_1TYyLwHtCISkRQL6TBKz9xQh', email: profile.email })
                    });
                    const { url } = await res.json();
                    if (url) window.location.href = url;
                  }}
                  className="mt-3 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
                  Select Starter
                </button>
              </div>
              <div className="p-4 border border-gray-700 rounded-xl">
                <p className="text-white font-semibold">Pro</p>
                <p className="text-blue-400 text-xl font-bold mt-1">$199/month</p>
                <p className="text-gray-400 text-sm mt-1">Everything + Priority Support</p>
                <button
                  onClick={async () => {
                    const res = await fetch('/api/create-checkout', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ priceId: 'price_1TYyMaHtCISkRQL6RWAB2eoo', email: profile.email })
                    });
                    const { url } = await res.json();
                    if (url) window.location.href = url;
                  }}
                  className="mt-3 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
                  Select Pro
                </button>
              </div>
            </div>
          </div>

          <button onClick={saveProfile} disabled={saving} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}