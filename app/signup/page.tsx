"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState, Suspense } from "react";
import { supabase } from "../../lib/supabase";

const tradeOptions = ["Electrician", "Plumber", "HVAC", "General Contractor", "Roofer", "Other"];

const inputStyle = {
  width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb',
  borderRadius: '8px', fontSize: '14px', color: '#111',
  background: '#f9fafb', boxSizing: 'border-box' as const, outline: 'none',
};

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tradeType, setTradeType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const refCode = searchParams.get('ref') || '';

  function getPasswordStrength(pw: string): { level: number; label: string; color: string } {
    if (!pw) return { level: 0, label: '', color: '#e5e7eb' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { level: 1, label: 'Weak', color: '#ef4444' };
    if (score <= 2) return { level: 2, label: 'Fair', color: '#f59e0b' };
    if (score <= 3) return { level: 3, label: 'Good', color: '#3b82f6' };
    return { level: 4, label: 'Strong', color: '#16a34a' };
  }

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    if (!tradeType) { setErrorMessage("Please select a trade type."); return; }
    setIsLoading(true);

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already been registered')) {
        setErrorMessage("An account with this email already exists. Try signing in instead.");
      } else {
        setErrorMessage("Something went wrong. Please try again.");
      }
      setIsLoading(false);
      return;
    }

    if (!data.user) { setErrorMessage("Unable to create account. Please try again."); setIsLoading(false); return; }

    // Generate unique referral code from name + year
    const nameSlug = fullName.replace(/\s+/g, '').toUpperCase().slice(0, 8);
    const referralCode = `${nameSlug}${new Date().getFullYear()}`;

    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id, full_name: fullName, trade_type: tradeType, email,
      referral_code: referralCode,
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    });
    if (profileError) { setErrorMessage('Something went wrong creating your account. Please try again.'); setIsLoading(false); return; }

    // Apply referral code if present
    if (refCode) {
      await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.user.id, referralCode: refCode }),
      });
    }

    // Trigger onboarding email sequence
    await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: data.user.id, email, fullName }),
    }).catch(() => {});

    setIsLoading(false);

    // If email confirmation is enabled, data.session will be null
    if (!data.session) {
      setEmailSent(true);
    } else {
      router.push("/onboarding");
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Navbar */}
      <nav style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 48px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="4" height="16" fill="#0a0a0a"/><rect x="2" y="18" width="20" height="4" fill="#0a0a0a"/><rect x="6" y="18" width="4" height="4" fill="#16a34a"/></svg>
          <span style={{ fontWeight: '700', fontSize: '18px', color: '#111' }}>TradeDesk</span>
        </Link>
        <Link href="/login" style={{ padding: '8px 18px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#374151', textDecoration: 'none' }}>
          Sign In
        </Link>
      </nav>

      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '48px 24px', minHeight: 'calc(100vh - 64px)' }}>
        <div style={{ width: '100%', maxWidth: '480px' }}>

          {emailSent ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <div style={{ margin: '0 auto 16px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="4" height="16" fill="#0a0a0a"/><rect x="2" y="18" width="20" height="4" fill="#0a0a0a"/><rect x="6" y="18" width="4" height="4" fill="#16a34a"/></svg>
                </div>
                <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#111', margin: '0 0 8px', letterSpacing: '-0.5px' }}>Check your inbox</h1>
                <p style={{ color: '#6b7280', fontSize: '15px', margin: 0 }}>One more step to get started</p>
              </div>
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', textAlign: 'center' }}>
                <div style={{ width: '56px', height: '56px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" stroke="#16a34a" strokeWidth="1.5"/><path d="M2 6l10 7 10-7" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111', margin: '0 0 10px' }}>Confirm your email</h2>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 6px' }}>
                  We sent a confirmation link to <strong style={{ color: '#111' }}>{email}</strong>
                </p>
                <p style={{ color: '#9ca3af', fontSize: '13px', margin: '0 0 24px' }}>
                  Click the link in the email to activate your account. Check your spam folder if you don't see it within a minute.
                </p>
                <Link href="/login" style={{ color: '#16a34a', fontWeight: '600', fontSize: '14px', textDecoration: 'none' }}>
                  Back to sign in
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <div style={{ margin: '0 auto 16px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="4" height="16" fill="#0a0a0a"/><rect x="2" y="18" width="20" height="4" fill="#0a0a0a"/><rect x="6" y="18" width="4" height="4" fill="#16a34a"/></svg>
                </div>
                <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#111', margin: '0 0 8px', letterSpacing: '-0.5px' }}>Create your account</h1>
                <p style={{ color: '#6b7280', fontSize: '15px', margin: 0 }}>Start your 14-day free trial. No credit card required.</p>
              </div>

              {/* Card */}
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>

                {errorMessage && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#991b1b', fontSize: '14px' }}>
                    {errorMessage}
                    {errorMessage.includes('already exists') && (
                      <span> <Link href="/login" style={{ color: '#dc2626', fontWeight: '600' }}>Sign in instead</Link></span>
                    )}
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
                      {password && (() => {
                        const { level, label, color } = getPasswordStrength(password);
                        return (
                          <div style={{ marginTop: '8px' }}>
                            <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                              {[1,2,3,4].map(i => (
                                <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= level ? color : '#e5e7eb', transition: 'background 0.2s' }} />
                              ))}
                            </div>
                            <span style={{ fontSize: '12px', color, fontWeight: '600' }}>{label}</span>
                            {level < 3 && <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '6px' }}>— try adding uppercase, numbers, or symbols</span>}
                          </div>
                        );
                      })()}
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
                  { label: 'AI Quotes', desc: 'Generate quotes fast' },
                  { label: 'WSIB Tracking', desc: 'Stay compliant' },
                  { label: 'Payments', desc: 'Get paid online' },
                ].map(f => (
                  <div key={f.label} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#111', marginBottom: '2px' }}>{f.label}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>{f.desc}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px' }}>
                {['Secure & encrypted', 'Canadian data', 'No credit card'].map(item => (
                  <span key={item} style={{ color: '#9ca3af', fontSize: '12px', fontWeight: '500' }}>{item}</span>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, sans-serif', color: '#6b7280' }}>Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
