"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setErrorMessage(error.message); setIsLoading(false); return; }
    setIsLoading(false);
    router.push("/dashboard");
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Navbar */}
      <nav style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 48px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="4" height="16" fill="#0a0a0a"/><rect x="2" y="18" width="20" height="4" fill="#0a0a0a"/><rect x="6" y="18" width="4" height="4" fill="#16a34a"/></svg>
          <span style={{ fontWeight: '700', fontSize: '18px', color: '#111' }}>TradeDesk</span>
        </Link>
        <Link href="/signup" style={{ padding: '8px 18px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#374151', textDecoration: 'none' }}>
          Create Account
        </Link>
      </nav>

      {/* Main */}
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 24px', minHeight: 'calc(100vh - 64px)' }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ margin: '0 auto 16px', display: 'flex', justifyContent: 'center' }}><svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="4" height="16" fill="#0a0a0a"/><rect x="2" y="18" width="20" height="4" fill="#0a0a0a"/><rect x="6" y="18" width="4" height="4" fill="#16a34a"/></svg></div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#111', margin: '0 0 8px', letterSpacing: '-0.5px' }}>Welcome back</h1>
            <p style={{ color: '#6b7280', fontSize: '15px', margin: 0 }}>Sign in to your TradeDesk account</p>
          </div>

          {/* Card */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>

            {errorMessage && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#991b1b', fontSize: '14px' }}>
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Email Address</label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111', background: '#f9fafb', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111', background: '#f9fafb', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%', padding: '13px', background: '#16a34a', color: 'white',
                  border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '700',
                  cursor: 'pointer', opacity: isLoading ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
                }}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280', marginTop: '20px', marginBottom: 0 }}>
              Don't have an account?{' '}
              <Link href="/signup" style={{ color: '#16a34a', fontWeight: '600', textDecoration: 'none' }}>
                Create one free
              </Link>
            </p>
          </div>

          {/* Trust signals */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '24px' }}>
            {['🔒 Secure', '🇨🇦 Canadian Data', '14-day free trial'].map(item => (
              <span key={item} style={{ color: '#9ca3af', fontSize: '12px', fontWeight: '500' }}>{item}</span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}