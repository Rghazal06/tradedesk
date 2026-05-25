'use client';

import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'payment' | 'quote' | 'wsib' | 'job' | 'info';
  read: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<string, string> = {
  payment: '💰',
  quote: '📋',
  wsib: '🛡️',
  job: '🔧',
  info: 'ℹ️',
};

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userId) loadNotifications();
  }, [userId]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function loadNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifications(data || []);
    setLoading(false);
  }

  async function markAllRead() {
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  async function markRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'relative', width: '40px', height: '40px',
          background: '#f9fafb', border: '1px solid #e5e7eb',
          borderRadius: '10px', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: '18px',
        }}>
        🔔
        {unread > 0 && (
          <div style={{
            position: 'absolute', top: '-4px', right: '-4px',
            width: '18px', height: '18px', background: '#dc2626',
            borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: 'white',
            border: '2px solid white',
          }}>
            {unread > 9 ? '9+' : unread}
          </div>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '48px', width: '360px',
          background: 'white', border: '1px solid #e5e7eb', borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#111', margin: 0 }}>
              Notifications {unread > 0 && <span style={{ background: '#dc2626', color: 'white', borderRadius: '100px', padding: '2px 8px', fontSize: '11px', marginLeft: '8px' }}>{unread}</span>}
            </h3>
            {unread > 0 && (
              <button onClick={markAllRead} style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}>
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔔</div>
                <p style={{ margin: 0, fontSize: '14px' }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} onClick={() => markRead(n.id)} style={{
                  padding: '14px 20px', borderBottom: '1px solid #f9fafb',
                  cursor: 'pointer', background: n.read ? 'white' : '#f0fdf4',
                  display: 'flex', gap: '12px', alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: '20px', flexShrink: 0 }}>{TYPE_ICONS[n.type] || '🔔'}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: '#111', margin: '0 0 2px' }}>{n.title}</p>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px', lineHeight: '1.4' }}>{n.message}</p>
                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>
                      {new Date(n.created_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!n.read && <div style={{ width: '8px', height: '8px', background: '#16a34a', borderRadius: '50%', flexShrink: 0, marginTop: '4px' }} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
