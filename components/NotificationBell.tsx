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
  type: string;
  read: boolean;
  created_at: string;
}

const TYPE_COLOR: Record<string, string> = {
  payment:      '#16a34a',
  quote:        '#2563eb',
  wsib:         '#d97706',
  job:          '#7c3aed',
  referral:     '#0891b2',
  quote_request:'#2563eb',
  info:         '#6b7280',
};

function BellIcon({ hasUnread }: { hasUnread: boolean }) {
  const color = hasUnread ? '#16a34a' : '#6b6b6b';
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <path
        d="M8 1.5A4.5 4.5 0 0 0 3.5 6v2.5L2 10h12l-1.5-1.5V6A4.5 4.5 0 0 0 8 1.5z"
        stroke={color}
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M6.5 10.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

// Self-contained — no userId prop needed.
// Fetches its own auth, subscribes to real-time inserts.
export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Resolve auth once
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  // Load + subscribe once we have a userId
  useEffect(() => {
    if (!userId) return;

    loadNotifications(userId);
    subscribeRealtime(userId);

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function loadNotifications(uid: string) {
    const { data } = await supabase
      .from('notifications')
      .select('id, title, message, type, read, created_at')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(30);
    setNotifications(data || []);
  }

  function subscribeRealtime(uid: string) {
    const channel = supabase
      .channel(`notifications-${uid}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${uid}`,
        },
        (payload) => {
          const n = payload.new as Notification;
          setNotifications(prev => [n, ...prev].slice(0, 30));
        }
      )
      .subscribe();

    channelRef.current = channel;
  }

  async function markRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await supabase.from('notifications').update({ read: true }).eq('id', id).eq('user_id', userId!);
  }

  async function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId!).eq('read', false);
  }

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => userId && setOpen(o => !o)}
        title="Notifications"
        style={{
          display: 'flex', alignItems: 'center', gap: '9px',
          width: '100%', padding: '6px 8px',
          background: open ? 'rgba(255,255,255,0.06)' : 'transparent',
          border: 'none', borderRadius: '5px',
          color: unread > 0 ? '#16a34a' : '#6b6b6b',
          fontSize: '13px', cursor: userId ? 'pointer' : 'default',
          fontFamily: 'inherit', textAlign: 'left',
          borderLeft: `2px solid ${open ? '#16a34a' : 'transparent'}`,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', position: 'relative', flexShrink: 0 }}>
          <BellIcon hasUnread={unread > 0} />
          {unread > 0 && (
            <span style={{
              position: 'absolute', top: '-5px', right: '-6px',
              background: '#dc2626', color: 'white',
              width: '14px', height: '14px', borderRadius: '50%',
              fontSize: '8px', fontWeight: '800',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1.5px solid #0f0f0f',
            }}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </span>
        <span style={{ fontWeight: unread > 0 ? '600' : '400', color: unread > 0 ? '#f5f5f5' : '#525252', fontSize: '13px' }}>
          Notifications
        </span>
        {unread > 0 && (
          <span style={{
            marginLeft: 'auto', background: '#dc2626', color: 'white',
            padding: '1px 6px', borderRadius: '100px', fontSize: '10px', fontWeight: '700',
          }}>
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'fixed',
          bottom: '60px',
          left: '230px',
          width: '360px',
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '14px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.16)',
          zIndex: 500,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#111' }}>
              Notifications
              {unread > 0 && (
                <span style={{ marginLeft: '8px', background: '#fef2f2', color: '#dc2626', borderRadius: '100px', padding: '1px 7px', fontSize: '11px', fontWeight: '700' }}>
                  {unread} new
                </span>
              )}
            </span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <BellIcon hasUnread={false} />
                <p style={{ color: '#9ca3af', fontSize: '13px', margin: '10px 0 0' }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const dot = TYPE_COLOR[n.type] || '#6b7280';
                const timeStr = (() => {
                  const d = new Date(n.created_at);
                  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
                  if (diffMin < 1) return 'just now';
                  if (diffMin < 60) return `${diffMin}m ago`;
                  const diffH = Math.floor(diffMin / 60);
                  if (diffH < 24) return `${diffH}h ago`;
                  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
                })();

                return (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    style={{
                      padding: '13px 18px',
                      borderBottom: '1px solid #f9fafb',
                      cursor: 'pointer',
                      background: n.read ? 'white' : '#f0fdf4',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                      transition: 'background 0.1s',
                    }}
                  >
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: dot, flexShrink: 0, marginTop: '5px',
                      opacity: n.read ? 0.3 : 1,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: '700', color: '#111', margin: '0 0 2px', lineHeight: 1.3 }}>{n.title}</p>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 5px', lineHeight: 1.45, wordBreak: 'break-word' }}>{n.message}</p>
                      <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>{timeStr}</p>
                    </div>
                    {!n.read && (
                      <div style={{ width: '7px', height: '7px', background: '#16a34a', borderRadius: '50%', flexShrink: 0, marginTop: '5px' }} />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
