'use client';

import React from 'react';

import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Logo A — angle mark (carpenter's square), green accent at inner elbow
function LogoMark({ onDark = true }: { onDark?: boolean }) {
  const bar = onDark ? '#ffffff' : '#0a0a0a';
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Vertical bar */}
      <rect x="2" y="2" width="4" height="16" fill={bar} />
      {/* Horizontal bar */}
      <rect x="2" y="18" width="20" height="4" fill={bar} />
      {/* Green accent at inner elbow */}
      <rect x="6" y="18" width="4" height="4" fill="#16a34a" />
    </svg>
  );
}

export function LogoWordmark({ onDark = false }: { onDark?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <LogoMark onDark={onDark} />
      <span style={{ fontWeight: '800', fontSize: '16px', letterSpacing: '-0.5px', color: onDark ? '#ffffff' : '#0a0a0a', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        TradeDesk
      </span>
    </div>
  );
}

const Icon: Record<string, () => React.JSX.Element> = {
  dashboard: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect x="1" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="8.5" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="1" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  quote: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M3 1h9a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.4"/>
      <line x1="4.5" y1="5" x2="10.5" y2="5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="4.5" y1="7.5" x2="10.5" y2="7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="4.5" y1="10" x2="7.5" y2="10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
  invoice: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M2 1h11v13l-2-1.5L9 14l-1.5-1.5L6 14l-1.5-1.5L2.5 14z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <line x1="4.5" y1="5" x2="10.5" y2="5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="4.5" y1="7.5" x2="10.5" y2="7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
  job: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M10.5 1.5C12 1.5 13.5 3 13.5 4.5c0 1-.5 1.7-1.2 2.3L4.5 14 1 11l7.5-7.2C9.1 2 9.8 1.5 10.5 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  ),
  calendar: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect x="1" y="2.5" width="13" height="11.5" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <line x1="1" y1="6" x2="14" y2="6" stroke="currentColor" strokeWidth="1.4"/>
      <line x1="5" y1="1" x2="5" y2="4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="10" y1="1" x2="10" y2="4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  shield: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M7.5 1L13 3.5v4C13 10.5 10.5 13 7.5 14 4.5 13 2 10.5 2 7.5v-4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M5 7.5l1.5 1.5L10 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  receipt: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M3 1h9v13l-1.5-1.5L9 14l-1.5-1.5L6 14l-1.5-1.5L3 14z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <line x1="5" y1="5" x2="10" y2="5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="5" y1="7.5" x2="10" y2="7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
  clients: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="5.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M1 13c0-2.5 2-4.5 4.5-4.5S10 10.5 10 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="11.5" cy="5" r="1.8" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M13 10c.7.3 2 1.2 2 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
  sparkle: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M7.5 1l1.2 5.3L14 7.5l-5.3 1.2L7.5 14 6.3 8.7 1 7.5l5.3-1.2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  ),
  chart: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <polyline points="1,12 5,7 8,9 13,3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="11,3 13,3 13,5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  graduation: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <polygon points="7.5,2 14,5.5 7.5,9 1,5.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M4 7.5V11c0 0 1.5 2 3.5 2s3.5-2 3.5-2V7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  settings: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M7.5 1v1.5M7.5 12.5V14M14 7.5h-1.5M2.5 7.5H1M12 3l-1 1M4 11l-1 1M12 12l-1-1M4 4l-1-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  signout: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <polyline points="9,4 13,7 9,10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="13" y1="7" x2="5" y2="7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
};

const NAV_GROUPS = [
  { label: 'Work', items: [
    { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
    { label: 'Quotes', href: '/quotes', icon: 'quote' },
    { label: 'Invoices', href: '/invoices', icon: 'invoice' },
    { label: 'Jobs', href: '/jobs', icon: 'job' },
  ]},
  { label: 'Schedule', items: [
    { label: 'Appointments', href: '/appointments', icon: 'calendar' },
  ]},
  { label: 'Finance', items: [
    { label: 'WSIB Tracking', href: '/wsib', icon: 'shield' },
    { label: 'Receipts', href: '/receipts', icon: 'receipt' },
  ]},
  { label: 'People', items: [
    { label: 'Clients', href: '/clients', icon: 'clients' },
  ]},
  { label: 'AI', items: [
    { label: 'AI Assistant', href: '/assistant', icon: 'sparkle' },
    { label: 'Profit Analyzer', href: '/profit', icon: 'chart' },
  ]},
  { label: 'More', items: [
    { label: 'Apprenticeship', href: '/apprenticeship', icon: 'graduation' },
    { label: 'Settings', href: '/settings', icon: 'settings' },
  ]},
];

export default function Sidebar({ activePath }: { activePath: string }) {
  const router = useRouter();

  function active(href: string) {
    if (href === '/dashboard') return activePath === '/dashboard';
    return activePath === href || activePath.startsWith(href + '/');
  }

  return (
    <div style={{ width: '220px', minWidth: '220px', background: '#0f0f0f', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, borderRight: '1px solid #1c1c1c' }}>
      {/* Logo */}
      <div style={{ padding: '20px 18px 18px', borderBottom: '1px solid #1c1c1c' }}>
        <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '11px', textDecoration: 'none' }}>
          <LogoMark onDark={true} />
          <span style={{ color: '#f5f5f5', fontWeight: '700', fontSize: '15px', letterSpacing: '-0.4px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
            TradeDesk
          </span>
        </a>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '4px 10px 8px', overflowY: 'auto' }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p style={{ color: '#2e2e2e', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '16px 0 4px', padding: '0 8px' }}>
              {group.label}
            </p>
            {group.items.map(item => {
              const isActive = active(item.href);
              const IconComp = Icon[item.icon];
              return (
                <a key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '6px 8px', borderRadius: '5px', marginBottom: '1px', textDecoration: 'none', fontSize: '13px', fontWeight: isActive ? '600' : '400', color: isActive ? '#f5f5f5' : '#525252', background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent', borderLeft: `2px solid ${isActive ? '#16a34a' : 'transparent'}` }}>
                  <span style={{ color: isActive ? '#16a34a' : '#383838', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    {IconComp && <IconComp />}
                  </span>
                  {item.label}
                </a>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Sign out */}
      <div style={{ padding: '10px', borderTop: '1px solid #1c1c1c' }}>
        <button
          onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
          style={{ display: 'flex', alignItems: 'center', gap: '9px', width: '100%', padding: '7px 8px', background: 'transparent', border: 'none', borderRadius: '5px', color: '#383838', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
        >
          <Icon.signout />
          Sign out
        </button>
      </div>
    </div>
  );
}
