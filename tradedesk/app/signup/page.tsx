"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { supabase } from "../../lib/supabase";

const tradeOptions = ["Electrician", "Plumber", "HVAC", "General Contractor", "Roofer", "Other"];

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tradeType, setTradeType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    if (!tradeType) { setErrorMessage("Please select a trade type."); return; }
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setErrorMessage(error.message); setIsLoading(false); return; }
    if (!data.user) { setErrorMessage("Unable to create account. Please try again."); setIsLoading(false); return; }
    const { error: profileError } = await supabase.from("profiles").insert({ id: data.user.id, full_name: fullName, trade_type: tradeType, email });
    if (profileError) { setErrorMessage(profileError.message); setIsLoading(false); return; }
    setSuccessMessage("Account created! Redirecting...");
    setIsLoading(false);
    setTimeout(() => router.push("/dashboard"), 900);
  };

  const inputStyle = {
    width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb',
    borderRadius: '8px', fontSize: '14px', color: '#111',
    background: '#f9fafb', boxSizing: 'border-box' as const, outline: 'none',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Navbar */}
      <nav style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 48px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ width: '32px', height: '32px', background: '#16a34a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '13px' }}>TD</div>
          <span style={{ fontWeight: '700', fontSize: '18px', color: '#111' }}>TradeDesk</span>
        </Link>
        <Link href="/login" style={{ padding: '8px 18px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#374151', textDecoration: 'none' }}>
          Sign In
        </Link>
      </nav>

      {/* Main */}
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '48px 24px', minHeight: 'calc(100vh - 64px)' }}>
        <div style={{ width: '100%', maxWidth: '480px' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ width: '48px', height: '48px', background: '#16a34a', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '18px', margin: '0 auto 16px' }}>TD</div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#111', margin: '0 0 8px', letterSpacing: '-0.5px' }}>Create your account</h1>
            <p style={{ color: '#6b7280', fontSize: '15px', margin: 0 }}>Start your 14-day free trial. No credit card required.</p>
          </div>

          {/* Card */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>

            {errorMessage && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#991b1b', fontSize: '14px' }}>
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#15803d', fontSize: '14px' }}>
                ✓ {successMessage}
              </div>
            )}

            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Full Name</label>
                  <input type="text" placeholder="John Smith" value={fullName} onChange={e => setFullName(e.target.value)} required style={inputStyle} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Email Address</label>
                  <input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Password</label>
                  <input type="password" placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} style={inputStyle} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Trade Type</label>
                  <select value={tradeType} onChange={e => setTradeType(e.target.value)} required style={inputStyle}>
                    <option value="" disabled>Select your trade</option>
                    {tradeOptions.map(trade => <option key={trade} value={trade}>{trade}</option>)}
                  </select>
                </div>
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
                {isLoading ? 'Creating Account...' : 'Create Free Account'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280', marginTop: '20px', marginBottom: 0 }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#16a34a', fontWeight: '600', textDecoration: 'none' }}>Sign in</Link>
            </p>
          </div>

          {/* Features */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '24px' }}>
            {[
              { icon: '✨', text: 'AI Quote Generator' },
              { icon: '🛡️', text: 'WSIB Tracking' },
              { icon: '💳', text: 'Online Payments' },
            ].map(f => (
              <div key={f.text} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{f.icon}</div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#374151' }}>{f.text}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px' }}>
            {['🔒 Secure', '🇨🇦 Canadian Data', 'No credit card'].map(item => (
              <span key={item} style={{ color: '#9ca3af', fontSize: '12px', fontWeight: '500' }}>{item}</span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}