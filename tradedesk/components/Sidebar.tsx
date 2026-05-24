'use client';

import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: '⚡' },
  { label: 'Quotes', href: '/quotes', icon: '📋' },
  { label: 'Invoices', href: '/invoices', icon: '🧾' },
  { label: 'Jobs', href: '/jobs', icon: '🔧' },
  { label: 'WSIB Tracking', href: '/wsib', icon: '🛡️' },
  { label: 'AI Profit Analyzer', href: '/profit', icon: '🤖' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div style={{
      width: '240px',
      minWidth: '240px',
      background: 'linear-gradient(180deg, #0d1526 0%, #0a1020 100%)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: '800', color: 'white',
            boxShadow: '0 4px 12px rgba(59,130,246,0.4)',
          }}>TD</div>
          <div>
            <div style={{ color: 'white', fontWeight: '700', fontSize: '16px', letterSpacing: '-0.3px' }}>TradeDesk</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', letterSpacing: '0.5px' }}>ONTARIO CONTRACTORS</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 12px', flex: 1, overflowY: 'auto' }}>
        {navItems.map(item => {
          const isActive = pathname === item.href;
          return (
            <a key={item.href} href={item.href} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '10px',
              marginBottom: '2px',
              textDecoration: 'none',
              fontSize: '13.5px',
              fontWeight: isActive ? '600' : '400',
              color: isActive ? 'white' : 'rgba(255,255,255,0.45)',
              background: isActive ? 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.1))' : 'transparent',
              border: isActive ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}}
            onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}}
            >
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.1))',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: '10px',
          padding: '12px',
        }}>
          <div style={{ color: 'white', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Free Trial</div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', marginBottom: '8px' }}>14 days remaining</div>
          <a href="/settings" style={{
            display: 'block', textAlign: 'center',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            color: 'white', fontSize: '11px', fontWeight: '600',
            padding: '6px', borderRadius: '6px', textDecoration: 'none',
          }}>Upgrade to Pro</a>
        </div>
      </div>
    </div>
  );
}