'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Sidebar from '../../components/Sidebar';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);


const SUGGESTIONS = [
  "What's my revenue this month?",
  "Which customers owe me money?",
  "How many active jobs do I have?",
  "What's my WSIB status?",
  "Which quote is my biggest?",
  "How do I send a payment link?",
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AssistantPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your TradeDesk AI assistant. I have access to all your business data — quotes, invoices, jobs, and WSIB entries. Ask me anything about your business!",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
      if (profile?.full_name) setUserName(profile.full_name.split(' ')[0]);
    }
    init();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text?: string) {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMessage: Message = { role: 'user', content: messageText, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, userId }),
      });

      let data: { reply?: string; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        // Server returned non-JSON (e.g. HTML error page from Vercel)
        setMessages(prev => [...prev, { role: 'assistant', content: `Server error (${res.status}). Check that OPENAI_API_KEY is set in Vercel environment variables.`, timestamp: new Date() }]);
        return;
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: res.ok ? (data.reply || 'No response.') : (data.error || `Error ${res.status}`),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Network error — could not reach the server. Check your connection and try again.', timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f4', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Sidebar activePath="/assistant" />

      

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', minWidth: 0 }}>

        {/* Top bar */}
        <div className="td-topbar" style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: 0 }}>AI Assistant</h1>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '2px 0 0' }}>Ask anything about your business</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '100px', padding: '6px 14px' }}>
            <div style={{ width: '8px', height: '8px', background: '#16a34a', borderRadius: '50%' }}></div>
            <span style={{ fontSize: '13px', color: '#15803d', fontWeight: '600' }}>AI Online</span>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>

          {/* Suggestions — show only at start */}
          {messages.length === 1 && (
            <div style={{ marginBottom: '24px' }}>
              <p style={{ color: '#6b7280', fontSize: '13px', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Try asking:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => sendMessage(s)} style={{
                    padding: '8px 14px', background: 'white', border: '1px solid #e5e7eb',
                    borderRadius: '100px', fontSize: '13px', color: '#374151', cursor: 'pointer',
                    fontWeight: '500',
                  }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message bubbles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '12px', alignItems: 'flex-start' }}>
                {msg.role === 'assistant' && (
                  <div style={{ width: '32px', height: '32px', background: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.38-1 1.72V7h3a3 3 0 0 1 3 3v1h1a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-1v1a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-1H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h1v-1a3 3 0 0 1 3-3h3V5.72A2 2 0 0 1 10 4a2 2 0 0 1 2-2zm-2 10a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm4 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" fill="white"/></svg></div>
                )}
                <div style={{
                  maxWidth: '70%', padding: '12px 16px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user' ? '#16a34a' : 'white',
                  color: msg.role === 'user' ? 'white' : '#111',
                  border: msg.role === 'user' ? 'none' : '1px solid #e5e7eb',
                  fontSize: '14px', lineHeight: '1.6',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}>
                  {msg.content}
                  <div style={{ fontSize: '11px', color: msg.role === 'user' ? 'rgba(255,255,255,0.6)' : '#9ca3af', marginTop: '6px' }}>
                    {msg.timestamp.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div style={{ width: '32px', height: '32px', background: '#374151', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: '700', flexShrink: 0 }}>
                    {userName?.[0] || 'U'}
                  </div>
                )}
              </div>
            ))}

            {/* Loading */}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', background: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.38-1 1.72V7h3a3 3 0 0 1 3 3v1h1a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-1v1a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-1H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h1v-1a3 3 0 0 1 3-3h3V5.72A2 2 0 0 1 10 4a2 2 0 0 1 2-2zm-2 10a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm4 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" fill="white"/></svg></div>
                <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '16px 16px 16px 4px', padding: '12px 16px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: '8px', height: '8px', background: '#16a34a', borderRadius: '50%', animation: `bounce 1s infinite ${i * 0.2}s` }}/>
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div style={{ background: 'white', borderTop: '1px solid #e5e7eb', padding: '16px 32px', flexShrink: 0 }}>
          <style>{`
            @keyframes bounce {
              0%, 60%, 100% { transform: translateY(0); }
              30% { transform: translateY(-8px); }
            }
          `}</style>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '8px 8px 8px 16px' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask anything — revenue, jobs, customers, WSIB..."
              style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '14px', color: '#111', outline: 'none' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                padding: '10px 20px', background: '#16a34a', color: 'white',
                border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px',
                cursor: 'pointer', opacity: loading || !input.trim() ? 0.5 : 1,
              }}>
              Send
            </button>
          </div>
          <p style={{ color: '#9ca3af', fontSize: '11px', marginTop: '8px', textAlign: 'center' }}>
            AI has access to your real business data — quotes, invoices, jobs, and WSIB entries
          </p>
        </div>
      </div>
    </div>
  );
}
