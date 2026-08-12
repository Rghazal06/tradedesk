'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import UpgradeModal from '../../components/UpgradeModal';
import Sidebar from '../../components/Sidebar';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);


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

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const upgradeParam = searchParams.get('upgrade');
  const [showUpgradeModal, setShowUpgradeModal] = useState(!!upgradeParam);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageIsError, setMessageIsError] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [profile, setProfile] = useState({
    full_name: '', email: '', trade_type: '', company_name: '',
    phone: '', address: '', hst_number: '', wsib_number: '',
    payment_terms: 'Payment due within 30 days.', google_review_link: '',
    public_slug: '', is_public: false, bio: '', services: '',
    twilio_phone: '', sms_bot_enabled: false,
    booking_enabled: false, booking_hours_start: '08:00', booking_hours_end: '17:00',
    booking_days: [1,2,3,4,5] as number[], booking_notice_hours: 24, booking_slot_minutes: 60,
  });

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) {
      setReferralCode(data.referral_code || '');
      setReferralCount(data.referral_count || 0);
    }
    if (data) setProfile(prev => ({
      ...prev, ...data, email: user.email || '',
      phone: data.phone || '', company_name: data.company_name || '',
      address: data.address || '', hst_number: data.hst_number || '',
      wsib_number: data.wsib_number || '',
      payment_terms: data.payment_terms || 'Payment due within 30 days.',
      google_review_link: data.google_review_link || '',
      public_slug: data.public_slug || '',
      is_public: data.is_public || false,
      bio: data.bio || '',
      services: Array.isArray(data.services) ? data.services.join(', ') : (data.services || ''),
      twilio_phone: data.twilio_phone || '',
      sms_bot_enabled: data.sms_bot_enabled || false,
      booking_enabled: data.booking_enabled || false,
      booking_hours_start: data.booking_hours_start || '08:00',
      booking_hours_end: data.booking_hours_end || '17:00',
      booking_days: Array.isArray(data.booking_days) ? data.booking_days : [1,2,3,4,5],
      booking_notice_hours: data.booking_notice_hours || 24,
      booking_slot_minutes: data.booking_slot_minutes || 60,
    }));
  }

  async function saveProfile() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const servicesArray = profile.services
      ? profile.services.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];
    const { error } = await supabase.from('profiles').upsert({
      id: user.id, ...profile,
      services: servicesArray,
      is_public: profile.is_public,
      twilio_phone: profile.twilio_phone || null,
      sms_bot_enabled: profile.sms_bot_enabled,
      booking_enabled: profile.booking_enabled,
      booking_hours_start: profile.booking_hours_start,
      booking_hours_end: profile.booking_hours_end,
      booking_days: profile.booking_days,
      booking_notice_hours: profile.booking_notice_hours,
      booking_slot_minutes: profile.booking_slot_minutes,
    });
    setMessageIsError(!!error);
    if (error) {
      if (error.code === '23505' && error.message?.includes('public_slug')) {
        setMessage('That profile URL is already taken by another contractor — please choose a different one. No other changes on this page were saved.');
      } else {
        setMessage('Something went wrong and your changes were not saved. Please try again.');
      }
    } else {
      setMessage('Settings saved successfully!');
    }
    setSaving(false);
    setTimeout(() => setMessage(''), error ? 6000 : 3000);
  }

  const sectionStyle = {
    background: 'white', border: '1px solid #e5e7eb',
    borderRadius: '12px', padding: '24px', marginBottom: '20px',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f4', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <style>{`
        @media (max-width: 768px) {
          .set-topbar { padding: 14px 16px !important; flex-wrap: wrap !important; gap: 12px !important; }
          .set-topbar button { width: 100% !important; }
          .set-body { padding: 16px !important; }
          .set-grid-2 { grid-template-columns: 1fr !important; }
          .set-grid-2 > [style*="span 2"] { grid-column: span 1 !important; }
          .set-ref-cards { grid-template-columns: 1fr !important; }
          .set-pub-grid { grid-template-columns: 1fr !important; }
          .set-pub-grid > [style*="span 2"] { grid-column: span 1 !important; }
        }
      `}</style>
      <Sidebar activePath="/settings" />

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Top bar */}
        <div className="set-topbar" style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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

        <div className="set-body" style={{ padding: '32px', overflowY: 'auto', flex: 1, maxWidth: '800px' }}>

          {message && (
            <div style={messageIsError
              ? { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#991b1b', fontSize: '14px' }
              : { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#15803d', fontSize: '14px' }}>
              {messageIsError ? message : `✓ ${message}`}
            </div>
          )}

          {/* Personal Info */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111', margin: 0 }}>Personal Information</h2>
              <span style={{ fontSize: '12px', color: '#6b7280' }}><span style={{ color: '#dc2626' }}>*</span> Required</span>
            </div>
            <div className="set-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Full Name <span style={{ color: '#dc2626' }}>*</span></label>
                <input value={profile.full_name} onChange={e => setProfile({...profile, full_name: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input value={profile.email} disabled style={{ ...inputStyle, color: '#9ca3af', cursor: 'not-allowed' }} />
              </div>
              <div>
                <label style={labelStyle}>Phone <span style={{ color: '#dc2626' }}>*</span></label>
                <input value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} placeholder="519-555-0000" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Trade Type <span style={{ color: '#dc2626' }}>*</span></label>
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
            <div className="set-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Company Name <span style={{ color: '#dc2626' }}>*</span></label>
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

          {/* Referral Program */}
          <div style={sectionStyle}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111', margin: '0 0 4px' }}>Referral Program</h2>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 20px' }}>Refer a contractor and you both get 1 month free.</p>
            {referralCode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="set-ref-cards" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '16px' }}>
                    <p style={{ color: '#6b7280', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px' }}>Your Referral Code</p>
                    <p style={{ color: '#15803d', fontSize: '22px', fontWeight: '800', margin: '0', letterSpacing: '1px' }}>{referralCode}</p>
                  </div>
                  <div style={{ background: '#f5f5f4', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px' }}>
                    <p style={{ color: '#6b7280', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px' }}>Contractors Referred</p>
                    <p style={{ color: '#111', fontSize: '22px', fontWeight: '800', margin: '0' }}>{referralCount}</p>
                    <p style={{ color: '#16a34a', fontSize: '12px', margin: '4px 0 0', fontWeight: '600' }}>{referralCount} month{referralCount !== 1 ? 's' : ''} free earned</p>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Your Referral Link</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      readOnly
                      value={`${process.env.NEXT_PUBLIC_APP_URL || 'https://mytradedesk.ca'}/signup?ref=${referralCode}`}
                      style={{ ...inputStyle, flex: 1, color: '#6b7280' }}
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL || 'https://mytradedesk.ca'}/signup?ref=${referralCode}`);
                        setMessage('Referral link copied!');
                        setTimeout(() => setMessage(''), 2000);
                      }}
                      style={{ padding: '10px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>Referral code will appear here after your account is set up.</p>
            )}
          </div>

          {/* Public Profile */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111', margin: '0 0 4px' }}>Public Profile</h2>
                <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>Let customers find and contact you at tradedesk.ca/contractors/your-slug</p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <span style={{ color: '#374151', fontSize: '13px', fontWeight: '600' }}>{profile.is_public ? 'Public' : 'Private'}</span>
                <div
                  onClick={() => setProfile({ ...profile, is_public: !profile.is_public })}
                  style={{
                    width: '40px', height: '22px', borderRadius: '11px', cursor: 'pointer',
                    background: profile.is_public ? '#16a34a' : '#d1d5db', position: 'relative', transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: '3px', left: profile.is_public ? '21px' : '3px',
                    width: '16px', height: '16px', borderRadius: '50%', background: 'white',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </div>
              </label>
            </div>
            <div className="set-pub-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Profile Slug</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                  <span style={{ padding: '10px 12px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRight: 'none', borderRadius: '8px 0 0 8px', fontSize: '13px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                    /contractors/
                  </span>
                  <input
                    value={profile.public_slug}
                    onChange={e => setProfile({ ...profile, public_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                    placeholder="smith-electrical"
                    style={{ ...inputStyle, borderRadius: '0 8px 8px 0', flex: 1 }}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Services (comma separated)</label>
                <input
                  value={profile.services}
                  onChange={e => setProfile({ ...profile, services: e.target.value })}
                  placeholder="Panel upgrades, Rewiring, EV chargers"
                  style={inputStyle}
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Bio</label>
                <textarea
                  value={profile.bio}
                  onChange={e => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Licensed electrician with 15 years experience in residential and commercial work across London, ON..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'none' }}
                />
              </div>
              {profile.public_slug && profile.is_public && (
                <div style={{ gridColumn: 'span 2' }}>
                  <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>
                    Your public profile: <a href={`/contractors/${profile.public_slug}`} target="_blank" style={{ color: '#16a34a', fontWeight: '600' }}>
                      tradedesk.ca/contractors/{profile.public_slug}
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* AI SMS Handler */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111', margin: '0 0 4px' }}>AI SMS — Missed Call Handler</h2>
                <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>When you miss a call on your Twilio number, AI texts the caller to qualify the lead automatically.</p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <span style={{ color: '#374151', fontSize: '13px', fontWeight: '600' }}>{profile.sms_bot_enabled ? 'On' : 'Off'}</span>
                <div
                  onClick={() => setProfile({ ...profile, sms_bot_enabled: !profile.sms_bot_enabled })}
                  style={{ width: '40px', height: '22px', borderRadius: '11px', cursor: 'pointer', background: profile.sms_bot_enabled ? '#16a34a' : '#d1d5db', position: 'relative', transition: 'background 0.2s' }}
                >
                  <div style={{ position: 'absolute', top: '3px', left: profile.sms_bot_enabled ? '21px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Twilio Phone Number</label>
                <input
                  value={profile.twilio_phone}
                  onChange={e => setProfile({ ...profile, twilio_phone: e.target.value })}
                  placeholder="+15195550000"
                  style={inputStyle}
                />
                <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '6px' }}>
                  Your Twilio number in +1XXXXXXXXXX format. Point its voice webhook to <code style={{ background: '#f3f4f6', padding: '2px 5px', borderRadius: '4px', fontSize: '11px' }}>https://yoursite.com/api/twilio/voice</code> and SMS webhook to <code style={{ background: '#f3f4f6', padding: '2px 5px', borderRadius: '4px', fontSize: '11px' }}>https://yoursite.com/api/twilio/sms</code>
                </p>
              </div>
            </div>
            <div style={{ marginTop: '14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 16px' }}>
              <p style={{ fontSize: '13px', color: '#374151', margin: '0 0 4px', fontWeight: '600' }}>You also need these environment variables:</p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, fontFamily: 'monospace' }}>
                TWILIO_ACCOUNT_SID · TWILIO_AUTH_TOKEN
              </p>
            </div>
            <div style={{ marginTop: '12px' }}>
              <a href="/leads" style={{ color: '#16a34a', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
                View SMS Leads inbox →
              </a>
            </div>
          </div>

          {/* Online Booking */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111', margin: '0 0 4px' }}>Online Booking</h2>
                <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>Let customers book appointments directly from a public link. Jobs with scheduled times block those slots automatically.</p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0, marginLeft: '16px' }}>
                <span style={{ color: '#374151', fontSize: '13px', fontWeight: '600' }}>{profile.booking_enabled ? 'On' : 'Off'}</span>
                <div
                  onClick={() => setProfile({ ...profile, booking_enabled: !profile.booking_enabled })}
                  style={{ width: '40px', height: '22px', borderRadius: '11px', cursor: 'pointer', background: profile.booking_enabled ? '#16a34a' : '#d1d5db', position: 'relative', transition: 'background 0.2s' }}
                >
                  <div style={{ position: 'absolute', top: '3px', left: profile.booking_enabled ? '21px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </label>
            </div>

            {profile.booking_enabled && !profile.is_public && (
              <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 14px', marginBottom: '4px' }}>
                <p style={{ fontSize: '13px', color: '#854d0e', margin: 0, fontWeight: '600' }}>
                  Your public profile is set to Private. Customers won't be able to reach your booking page until you enable Public Profile above.
                </p>
              </div>
            )}

            {profile.booking_enabled && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Working hours */}
                <div>
                  <label style={labelStyle}>Working Hours</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="time" value={profile.booking_hours_start} onChange={e => setProfile({ ...profile, booking_hours_start: e.target.value })} style={{ ...inputStyle, width: '130px' }} />
                    <span style={{ color: '#6b7280', fontSize: '13px' }}>to</span>
                    <input type="time" value={profile.booking_hours_end} onChange={e => setProfile({ ...profile, booking_hours_end: e.target.value })} style={{ ...inputStyle, width: '130px' }} />
                  </div>
                </div>

                {/* Working days */}
                <div>
                  <label style={labelStyle}>Working Days</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[['Sun',0],['Mon',1],['Tue',2],['Wed',3],['Thu',4],['Fri',5],['Sat',6]].map(([label, val]) => {
                      const dayVal = val as number;
                      const active = (profile.booking_days || []).includes(dayVal);
                      return (
                        <button
                          key={dayVal}
                          type="button"
                          onClick={() => {
                            const days = profile.booking_days || [];
                            setProfile({ ...profile, booking_days: active ? days.filter(d => d !== dayVal) : [...days, dayVal].sort() });
                          }}
                          style={{ padding: '6px 12px', borderRadius: '8px', border: active ? '2px solid #16a34a' : '1px solid #e5e7eb', background: active ? '#f0fdf4' : 'white', color: active ? '#15803d' : '#374151', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                        >{label as string}</button>
                      );
                    })}
                  </div>
                </div>

                {/* Slot duration + notice */}
                <div className="set-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>Slot Duration</label>
                    <select value={profile.booking_slot_minutes} onChange={e => setProfile({ ...profile, booking_slot_minutes: parseInt(e.target.value) })} style={inputStyle}>
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={90}>1.5 hours</option>
                      <option value={120}>2 hours</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Minimum Notice</label>
                    <select value={profile.booking_notice_hours} onChange={e => setProfile({ ...profile, booking_notice_hours: parseInt(e.target.value) })} style={inputStyle}>
                      <option value={2}>2 hours</option>
                      <option value={4}>4 hours</option>
                      <option value={12}>12 hours</option>
                      <option value={24}>24 hours</option>
                      <option value={48}>48 hours</option>
                    </select>
                  </div>
                </div>

                {/* Booking link */}
                {profile.public_slug && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px 16px' }}>
                    <p style={{ fontSize: '12px', fontWeight: '700', color: '#15803d', margin: '0 0 6px' }}>Your booking link</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <code style={{ fontSize: '12px', color: '#374151', background: 'white', border: '1px solid #d1fae5', padding: '6px 10px', borderRadius: '6px', flex: 1, overflowX: 'auto' }}>
                        {typeof window !== 'undefined' ? window.location.origin : 'https://mytradedesk.ca'}/book/{profile.public_slug}
                      </code>
                      <button
                        onClick={() => navigator.clipboard.writeText(`${window.location.origin}/book/${profile.public_slug}`)}
                        style={{ padding: '6px 12px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', flexShrink: 0 }}
                      >Copy</button>
                    </div>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '8px 0 0' }}>Share this link with customers. They can self-book based on your availability.</p>
                  </div>
                )}
              </div>
            )}
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
            <div className="set-ref-cards" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
              {[
                { name: 'Starter', price: '$99/month', desc: 'Quotes, Invoices, WSIB, Jobs', priceId: 'price_1TYyLwHtCISkRQL6TBKz9xQh', highlight: false },
                { name: 'Pro', price: '$199/month', desc: 'Everything + AI features + Priority Support', priceId: 'price_1TYyMaHtCISkRQL6RWAB2eoo', highlight: true },
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
            {/* Enterprise */}
            <div style={{ border: '1px solid #1e2d45', background: '#141c2e', borderRadius: '10px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <p style={{ fontWeight: '700', color: '#f0f4ff', margin: 0, fontSize: '14px' }}>Enterprise</p>
                  <span style={{ background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.3)', borderRadius: '100px', padding: '2px 8px', fontSize: '10px', fontWeight: '700', color: '#4ade80', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Custom pricing</span>
                </div>
                <p style={{ color: '#8faac4', fontSize: '13px', margin: 0 }}>Multiple users, dedicated support, custom onboarding, volume pricing</p>
              </div>
              <a
                href={`mailto:rayanghazal06@gmail.com?subject=Enterprise%20Plan%20Inquiry`}
                style={{ flexShrink: 0, padding: '10px 20px', background: '#16a34a', color: 'white', borderRadius: '8px', fontWeight: '700', fontSize: '13px', textDecoration: 'none', whiteSpace: 'nowrap' as const }}
              >
                Talk to us
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade modal */}
      {showUpgradeModal && (
        <UpgradeModal
          reason={upgradeParam === 'pro' ? 'pro_required' : 'trial_expired'}
          email={profile.email}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f5f5f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, sans-serif', color: '#6b7280' }}>Loading...</div>}>
      <SettingsContent />
    </Suspense>
  );
}