'use client';

import { useState } from 'react';

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

export default function ContactForm({
  contractorId,
  contractorName,
}: {
  contractorId: string;
  contractorName: string;
}) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.description) {
      setError('Name and description are required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/contractor-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, contractorId, contractorName }),
      });
      const data = await res.json();
      if (data.success) {
        setSent(true);
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setSubmitting(false);
  }

  if (sent) {
    return (
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '24px', textAlign: 'center' }}>
        <p style={{ color: '#15803d', fontWeight: '700', fontSize: '16px', margin: '0 0 4px' }}>Request sent!</p>
        <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>{contractorName} will be in touch within 24 hours.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', color: '#991b1b', fontSize: '14px' }}>
          {error}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Your Name</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Smith" style={inputStyle} required />
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@email.com" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Phone</label>
          <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="519-555-0000" style={inputStyle} />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Describe the work needed</label>
        <textarea
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          placeholder="e.g. Need to replace electrical panel in basement, approximately 200 amp service..."
          rows={4}
          style={{ ...inputStyle, resize: 'none' }}
          required
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        style={{ padding: '12px 24px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '15px', cursor: 'pointer', opacity: submitting ? 0.7 : 1, boxShadow: '0 2px 8px rgba(22,163,74,0.3)' }}
      >
        {submitting ? 'Sending...' : 'Send Quote Request'}
      </button>
    </form>
  );
}
