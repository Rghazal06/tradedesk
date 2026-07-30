'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { supabase } from '../../lib/supabase';

const inputStyle = {
  width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb',
  borderRadius: '8px', fontSize: '14px', color: '#111',
  background: '#f9fafb', boxSizing: 'border-box' as const, outline: 'none',
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });
    if (error) { setError('Something went wrong. Please try again.'); setLoading(false); return; }
    setSent(true);
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Navbar */}
      <nav style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 48px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="4" height="16" fill="#0a0a0a"/><rect x="2" y="18" width="20" height="4" fill="#0a0a0a"/><rect x="6" y="18" width="4" height="4" fill="#16a34a"/></svg>
          <span style={{ fontWeight: '700', fontSize: '18px', color: '#111' }}>TradeDesk</span>
        </Link>
        <Link href="/login" style={{ padding: '8px 18px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#374151', textDecoration: 'none' }}>
          Sign In
        </Link>
      </nav>

      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 24px', minHeight: 'calc(100vh - 64px)' }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>

          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ margin: '0 auto 16px', display: 'flex', justifyContent: 'center' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="4" height="16" fill="#0a0a0a"/><rect x="2" y="18" width="20" height="4" fill="#0a0a0a"/><rect x="6" y="18" width="4" height="4" fill="#16a34a"/></svg>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#111', margin: '0 0 8px', letterSpacing: '-0.5px' }}>Reset your password</h1>
            <p style={{ color: '#6b7280', fontSize: '15px', margin: 0 }}>Enter your email and we'll send a reset link</p>
          </div>

          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>

            {sent ? (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ width: '52px', height: '52px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" stroke="#16a34a" strokeWidth="1.5"/><path d="M2 6l10 7 10-7" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111', margin: '0 0 8px' }}>Check your inbox</h2>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 4px' }}>
                  We sent a reset link to <strong style={{ color: '#111' }}>{email}</strong>
                </p>
                <p style={{ color: '#9ca3af', fontSize: '13px', margin: '0 0 24px' }}>
                  Click the link in the email to set a new password. Check your spam folder if you don't see it.
                </p>
                <Link href="/login" style={{ color: '#16a34a', fontWeight: '600', fontSize: '14px', textDecoration: 'none' }}>
                  Back to sign in
                </Link>
              </div>
            ) : (
              <>
                {error && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#991b1b', fontSize: '14px' }}>
                    {error}
                  </div>
                )}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Email Address</label>
                    <input
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      style={inputStyle}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{ width: '100%', padding: '13px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 12px rgba(22,163,74,0.3)' }}>
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
                <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280', marginTop: '20px', marginBottom: 0 }}>
                  Remembered it?{' '}
                  <Link href="/login" style={{ color: '#16a34a', fontWeight: '600', textDecoration: 'none' }}>Sign in</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
