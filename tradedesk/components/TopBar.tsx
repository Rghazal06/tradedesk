'use client';

import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface TopBarProps {
  title: string;
  subtitle?: string;
  userName?: string;
  actions?: React.ReactNode;
}

export default function TopBar({ title, subtitle, userName, actions }: TopBarProps) {
  const router = useRouter();

  return (
    <div style={{
      background: 'rgba(13, 21, 38, 0.8)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      padding: '16px 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      <div>
        <h1 style={{ color: 'white', fontSize: '20px', fontWeight: '700', margin: 0, letterSpacing: '-0.3px' }}>
          {userName ? `Welcome back, ${userName} 👋` : title}
        </h1>
        {subtitle && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '2px 0 0' }}>{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {actions}
        <button
          onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
          style={{
            padding: '8px 16px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}>
          Logout
        </button>
      </div>
    </div>
  );
}