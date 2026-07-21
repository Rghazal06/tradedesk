'use client';

import Link from 'next/link';
import { FormEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

const inputStyle = {
  width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb',
  borderRadius: '8px', fontSize: '14px', color: '#111',
  background: '#f9fafb', boxSizing: 'border-box' as const, outline: 'none',
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase puts the session in place before rendering this page via the callback route.
  // We just need to verify it exists.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSessionReady(true);
      } else {
        // No active session — link was invalid or expired
        setError('This reset link has expired or is invalid. Please request a new one.');
      }
    });
  }, []);

  async function handleReset(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setError('Something went wrong. Please try again.'); setLoading(false); return; }
    setDone(true);
    setTimeout(() => router.push('/dashboard'), 2000);
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
      </nav>

      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 24px', minHeight: 'calc(100vh - 64px)' }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>

          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ margin: '0 auto 16px', display: 'flex', justifyContent: 'center' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="4" height="16" fill="#0a0a0a"/><rect x="2" y="18" width="20" height="4" fill="#0a0a0a"/><rect x="6" y="18" width="4" height="4" fill="#16a34a"/></svg>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#111', margin: '0 0 8px', letterSpacing: '-0.5px' }}>Set new password</h1>
            <p style={{ color: '#6b7280', fontSize: '15px', margin: 0 }}>Choose a strong password for your account</p>
          </div>

          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>

            {done ? (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ width: '52px', height: '52px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111', margin: '0 0 8px' }}>Password updated</h2>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Redirecting you to your dashboard...</p>
              </div>
            ) : (
              <>
                {error && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#991b1b', fontSize: '14px' }}>
                    {error}
                    {!sessionReady && (
                      <div style={{ marginTop: '10px' }}>
                        <Link href="/forgot-password" style={{ color: '#dc2626', fontWeight: '600', textDecoration: 'underline' }}>
                          Request a new reset link
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {sessionReady && (
                  <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>New Password</label>
                      <input
                        type="password"
                        placeholder="Min. 6 characters"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        minLength={6}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Confirm Password</label>
                      <input
                        type="password"
                        placeholder="Same as above"
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        required
                        style={inputStyle}
                      />
                      {confirm && password !== confirm && (
                        <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '6px', marginBottom: 0 }}>Passwords do not match</p>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={loading || !sessionReady}
                      style={{ width: '100%', padding: '13px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 12px rgba(22,163,74,0.3)' }}>
                      {loading ? 'Updating...' : 'Set New Password'}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
