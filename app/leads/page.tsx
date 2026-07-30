'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Sidebar from '../../components/Sidebar';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Message = {
  role: 'user' | 'assistant';
  content: string;
  ts: string;
};

interface Lead {
  id: string;
  caller_phone: string;
  status: 'new' | 'active' | 'qualified' | 'booked' | 'dismissed';
  job_summary: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string; label: string }> = {
  new:       { bg: '#fef3c7', color: '#92400e', border: '#fde68a', label: 'New' },
  active:    { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', label: 'Active' },
  qualified: { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0', label: 'Qualified' },
  booked:    { bg: '#f0fdf4', color: '#15803d', border: '#86efac', label: 'Booked' },
  dismissed: { bg: '#f3f4f6', color: '#9ca3af', border: '#e5e7eb', label: 'Dismissed' },
};

function formatPhone(phone: string) {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const n = cleaned.slice(1);
    return `(${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6)}`;
  }
  if (cleaned.length === 10) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  return phone;
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function LeadsPage() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [userId, setUserId] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => { init(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [selectedLead]);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUserId(user.id);
    await loadLeads(user.id);
  }

  async function loadLeads(uid: string) {
    const { data } = await supabase
      .from('sms_leads')
      .select('*')
      .eq('user_id', uid)
      .order('updated_at', { ascending: false });
    setLeads(data || []);
    setLoading(false);
  }

  async function updateLeadStatus(leadId: string, status: Lead['status']) {
    setUpdatingStatus(true);
    await supabase.from('sms_leads').update({ status }).eq('id', leadId);
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
    if (selectedLead?.id === leadId) setSelectedLead(prev => prev ? { ...prev, status } : null);
    setUpdatingStatus(false);
  }

  async function dismissLead(leadId: string) {
    await updateLeadStatus(leadId, 'dismissed');
    if (selectedLead?.id === leadId) setSelectedLead(null);
  }

  const filtered = leads.filter(l => {
    if (filterStatus === 'active') return l.status === 'active' || l.status === 'new';
    if (filterStatus && l.status !== filterStatus) return false;
    return true;
  });

  const newCount = leads.filter(l => l.status === 'new').length;
  const qualifiedCount = leads.filter(l => l.status === 'qualified').length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f4', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <style>{`
        @media (max-width: 768px) {
          .leads-split { flex-direction: column !important; }
          .leads-list-panel { width: 100% !important; min-width: unset !important; max-height: 45vh !important; }
          .leads-convo-panel { flex: 1 !important; min-height: 0 !important; }
        }
      `}</style>
      <Sidebar activePath="/leads" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Top bar */}
        <div className="td-topbar" style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: 0 }}>SMS Leads</h1>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '2px 0 0' }}>AI-qualified leads from missed calls</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {newCount > 0 && (
              <span style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: '100px', padding: '4px 12px', fontSize: '13px', fontWeight: '700' }}>
                {newCount} new
              </span>
            )}
            <a href="/settings" style={{ padding: '9px 16px', background: '#f3f4f6', color: '#374151', borderRadius: '8px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', border: '1px solid #e5e7eb' }}>
              SMS Settings
            </a>
          </div>
        </div>

        <div className="leads-split" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Lead list panel */}
          <div className="leads-list-panel" style={{ width: '360px', minWidth: '360px', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', background: 'white', overflow: 'hidden' }}>

            {/* Stats + filter */}
            <div style={{ padding: '16px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                {[
                  { label: 'All', value: '' },
                  { label: 'Active', value: 'active' },
                  { label: 'Qualified', value: 'qualified' },
                  { label: 'Dismissed', value: 'dismissed' },
                ].map(f => (
                  <button
                    key={f.value}
                    onClick={() => setFilterStatus(f.value)}
                    style={{ padding: '5px 10px', background: filterStatus === f.value ? '#111' : '#f3f4f6', color: filterStatus === f.value ? 'white' : '#374151', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    {f.label}
                    {f.label === 'Qualified' && qualifiedCount > 0 && (
                      <span style={{ marginLeft: '5px', background: '#16a34a', color: 'white', borderRadius: '100px', padding: '1px 6px', fontSize: '11px' }}>{qualifiedCount}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Lead cards */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Loading...</div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center', color: '#9ca3af' }}>
                  <div style={{ width: '40px', height: '40px', margin: '0 auto 12px', background: '#f3f4f6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 15 15" fill="none"><path d="M13 2H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h3v2l3-2h5a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" stroke="#9ca3af" strokeWidth="1.4" strokeLinejoin="round"/></svg>
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', margin: '0 0 6px' }}>
                    {filterStatus ? 'No leads in this category' : 'No leads yet'}
                  </p>
                  <p style={{ fontSize: '12px', margin: 0 }}>
                    {filterStatus ? 'Try a different filter' : 'Leads appear when someone calls and you\'re on the job'}
                  </p>
                </div>
              ) : (
                filtered.map(lead => {
                  const statusStyle = STATUS_STYLES[lead.status] || STATUS_STYLES.new;
                  const isSelected = selectedLead?.id === lead.id;
                  const lastMsg = lead.messages?.[lead.messages.length - 1];
                  return (
                    <button
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      style={{ display: 'block', width: '100%', padding: '14px 16px', background: isSelected ? '#f5f5f4' : 'transparent', border: 'none', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#111' }}>{formatPhone(lead.caller_phone)}</span>
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>{timeAgo(lead.updated_at || lead.created_at)}</span>
                      </div>
                      {lead.job_summary && (
                        <p style={{ fontSize: '12px', color: '#374151', margin: '0 0 6px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {lead.job_summary}
                        </p>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`, borderRadius: '100px', padding: '2px 8px', fontSize: '11px', fontWeight: '600' }}>
                          {statusStyle.label}
                        </span>
                        <span style={{ fontSize: '11px', color: '#d1d5db' }}>{lead.messages?.length || 0} msg{(lead.messages?.length || 0) !== 1 ? 's' : ''}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Conversation panel */}
          <div className="leads-convo-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {!selectedLead ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '48px', height: '48px', margin: '0 auto 12px', background: '#f3f4f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="22" height="22" viewBox="0 0 15 15" fill="none"><path d="M13 2H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h3v2l3-2h5a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" stroke="#d1d5db" strokeWidth="1.4" strokeLinejoin="round"/></svg>
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: '0 0 4px' }}>Select a lead</p>
                  <p style={{ fontSize: '13px', margin: 0 }}>View the full SMS conversation</p>
                </div>
              </div>
            ) : (
              <>
                {/* Conversation header */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb', background: 'white', flexShrink: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111', margin: '0 0 2px' }}>{formatPhone(selectedLead.caller_phone)}</h2>
                      {selectedLead.job_summary && (
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{selectedLead.job_summary.slice(0, 80)}{selectedLead.job_summary.length > 80 ? '...' : ''}</p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {selectedLead.status !== 'qualified' && selectedLead.status !== 'booked' && (
                        <button
                          onClick={() => updateLeadStatus(selectedLead.id, 'qualified')}
                          disabled={updatingStatus}
                          style={{ padding: '7px 14px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', opacity: updatingStatus ? 0.6 : 1 }}>
                          Mark Qualified
                        </button>
                      )}
                      {selectedLead.status !== 'booked' && (
                        <button
                          onClick={() => updateLeadStatus(selectedLead.id, 'booked')}
                          disabled={updatingStatus}
                          style={{ padding: '7px 14px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', opacity: updatingStatus ? 0.6 : 1 }}>
                          Mark Booked
                        </button>
                      )}
                      {selectedLead.status !== 'dismissed' && (
                        <button
                          onClick={() => dismissLead(selectedLead.id)}
                          style={{ padding: '7px 14px', background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                          Dismiss
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(selectedLead.messages || []).map((msg, i) => {
                    const isAI = msg.role === 'assistant';
                    return (
                      <div key={i} style={{ display: 'flex', flexDirection: isAI ? 'row' : 'row-reverse', gap: '10px', alignItems: 'flex-end' }}>
                        {isAI && (
                          <div style={{ width: '28px', height: '28px', background: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                              <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.38-1 1.72V7h3a3 3 0 0 1 3 3v1h1a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-1v1a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-1H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h1v-1a3 3 0 0 1 3-3h3V5.72A2 2 0 0 1 10 4a2 2 0 0 1 2-2zm-2 10a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm4 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" fill="white"/>
                            </svg>
                          </div>
                        )}
                        <div style={{ maxWidth: '72%' }}>
                          <div style={{
                            background: isAI ? '#f3f4f6' : '#16a34a',
                            color: isAI ? '#111' : 'white',
                            padding: '10px 14px',
                            borderRadius: isAI ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                            fontSize: '14px',
                            lineHeight: '1.5',
                          }}>
                            {msg.content}
                          </div>
                          <p style={{ fontSize: '11px', color: '#9ca3af', margin: '3px 4px 0', textAlign: isAI ? 'left' : 'right' }}>
                            {isAI ? 'AI Assistant' : 'Caller'} · {msg.ts ? new Date(msg.ts).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' }) : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Status bar */}
                <div style={{ padding: '12px 24px', borderTop: '1px solid #e5e7eb', background: '#fafafa', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                    AI is handling this conversation automatically.
                  </span>
                  {(() => {
                    const s = STATUS_STYLES[selectedLead.status] || STATUS_STYLES.new;
                    return (
                      <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: '100px', padding: '3px 10px', fontSize: '12px', fontWeight: '600' }}>
                        {s.label}
                      </span>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
