"use client";

import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { useEffect, useMemo, useState } from "react";

type LineItem = {
  id: number;
  description: string;
  quantity: string;
  unitPrice: string;
};

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: '⚡' },
  { label: 'Appointments', href: '/appointments', icon: '📅' },
  { label: 'Quotes', href: '/quotes', icon: '📋' },
  { label: 'Invoices', href: '/invoices', icon: '🧾' },
  { label: 'Jobs', href: '/jobs', icon: '🔧' },
  { label: 'WSIB Tracking', href: '/wsib', icon: '🛡️' },
  { label: 'Clients', href: '/clients', icon: '👥' },
  { label: 'AI Assistant', href: '/assistant', icon: '🤖' },
  { label: 'AI Profit Analyzer', href: '/profit', icon: '📈' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
];

const createEmptyLineItem = (id: number): LineItem => ({ id, description: "", quantity: "1", unitPrice: "" });
const toNumber = (value: string) => { const parsed = Number.parseFloat(value); return Number.isNaN(parsed) ? 0 : parsed; };
const lineItemTotal = (item: LineItem) => toNumber(item.quantity) * toNumber(item.unitPrice);
const formatCurrency = (value: number) => value.toLocaleString("en-CA", { style: "currency", currency: "CAD" });

const inputStyle = {
  width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb',
  borderRadius: '8px', fontSize: '14px', color: '#111',
  background: '#f9fafb', boxSizing: 'border-box' as const, outline: 'none',
};

export default function NewQuotePage() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([createEmptyLineItem(1)]);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [tradeType, setTradeType] = useState('');
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [userName, setUserName] = useState('Contractor');

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
      if (profile?.full_name) setUserName(profile.full_name.split(' ')[0]);
    }
    checkAuth();
  }, []);

  const subtotal = useMemo(() => lineItems.reduce((sum, item) => sum + lineItemTotal(item), 0), [lineItems]);
  const hst = subtotal * 0.13;
  const total = subtotal + hst;

  const updateLineItem = (itemId: number, field: "description" | "quantity" | "unitPrice", value: string) => {
    setLineItems(current => current.map(item => item.id === itemId ? { ...item, [field]: value } : item));
  };

  const addLineItem = () => setLineItems(current => [...current, createEmptyLineItem(Date.now())]);
  const removeLineItem = (itemId: number) => {
    setLineItems(current => { const filtered = current.filter(item => item.id !== itemId); return filtered.length > 0 ? filtered : [createEmptyLineItem(Date.now())]; });
  };

  const handleAIGenerate = async () => {
    if (!jobDescription) { setErrorMessage('Please enter a job description first.'); return; }
    setIsGenerating(true); setErrorMessage('');
    try {
      const res = await fetch('/api/ai-quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobDescription, tradeType }) });
      const data = await res.json();
      if (data.error) { setErrorMessage(data.error); return; }
      if (data.line_items) {
        setLineItems(data.line_items.map((item: any, index: number) => ({ id: Date.now() + index, description: item.description, quantity: String(item.quantity), unitPrice: String(item.unit_price) })));
      }
      if (data.notes) setQuoteNotes(data.notes);
      setSuccessMessage('AI generated your quote! Review and adjust before sending.');
    } catch { setErrorMessage('AI generation failed. Please try again.'); }
    finally { setIsGenerating(false); }
  };

  const handleSaveQuote = async () => {
    setErrorMessage(""); setSuccessMessage(""); setIsSaving(true);
    const { data: authData, error: authError } = await supabase.auth.getUser();
    const user = authData.user;
    if (authError || !user) { setIsSaving(false); router.push("/login"); return; }
    const normalizedLineItems = lineItems.map(item => ({ description: item.description, quantity: toNumber(item.quantity), unit_price: toNumber(item.unitPrice), total: lineItemTotal(item) }));
    const { error } = await supabase.from("quotes").insert({ user_id: user.id, customer_name: customerName, customer_email: customerEmail, customer_phone: customerPhone, job_description: jobDescription, line_items: normalizedLineItems, subtotal, hst, total, notes: quoteNotes, status: "Draft" });
    if (error) { setErrorMessage(error.message); setIsSaving(false); return; }
    setSuccessMessage("Quote saved! Redirecting...");
    setIsSaving(false);
    setTimeout(() => router.push("/quotes"), 800);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Sidebar */}
      <div style={{ width: '240px', minWidth: '240px', background: 'white', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0 }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', background: '#16a34a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '13px' }}>TD</div>
            <span style={{ fontWeight: '700', fontSize: '16px', color: '#111' }}>TradeDesk</span>
          </div>
        </div>
        <nav style={{ padding: '12px', flex: 1 }}>
          {NAV_ITEMS.map(item => {
            const isActive = item.href === '/quotes';
            return (
              <a key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px', borderRadius: '8px', marginBottom: '2px',
                textDecoration: 'none', fontSize: '13.5px',
                fontWeight: isActive ? '600' : '400',
                color: isActive ? '#16a34a' : '#6b7280',
                background: isActive ? '#f0fdf4' : 'transparent',
                border: isActive ? '1px solid #bbf7d0' : '1px solid transparent',
              }}>
                <span>{item.icon}</span>{item.label}
              </a>
            );
          })}
        </nav>
        <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb' }}>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
            style={{ width: '100%', padding: '8px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#6b7280', fontSize: '13px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Top bar */}
        <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: 0 }}>Create New Quote</h1>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '2px 0 0' }}>Welcome back, {userName}</p>
          </div>
          <a href="/quotes" style={{ padding: '8px 16px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#374151', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
            ← Back to Quotes
          </a>
        </div>

        <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>

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

          {/* Customer Info */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111', margin: '0 0 20px' }}>Customer Information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer Name</label>
                <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="John Smith" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</label>
                <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="customer@email.com" style={inputStyle} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone Number</label>
                <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="519-555-0000" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Job Description + AI */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111', margin: '0 0 20px' }}>Job Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'end', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trade Type (for AI)</label>
                <select value={tradeType} onChange={e => setTradeType(e.target.value)} style={inputStyle}>
                  <option value="">Select your trade</option>
                  {['Electrician', 'Plumber', 'HVAC', 'General Contractor', 'Roofer', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <button
                type="button"
                onClick={handleAIGenerate}
                disabled={isGenerating}
                style={{
                  padding: '10px 20px', background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700',
                  fontSize: '14px', cursor: 'pointer', opacity: isGenerating ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
                }}>
                {isGenerating ? (
                  <>
                    <svg style={{ animation: 'spin 1s linear infinite', width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none">
                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Generating...
                  </>
                ) : '✨ Generate with AI'}
              </button>
            </div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Job Description</label>
              <textarea value={jobDescription} onChange={e => setJobDescription(e.target.value)} rows={4} placeholder="Describe the scope of work..."
                style={{ ...inputStyle, resize: 'none' }} />
            </div>
          </div>

          {/* Line Items */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111', margin: 0 }}>Line Items</h2>
              <button onClick={addLineItem} style={{ padding: '8px 16px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#374151', cursor: 'pointer' }}>
                + Add Item
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    {['Description', 'Quantity', 'Unit Price', 'Total', ''].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#6b7280', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td style={{ padding: '10px 12px', width: '40%' }}>
                        <input value={item.description} onChange={e => updateLineItem(item.id, "description", e.target.value)} placeholder="Service description"
                          style={{ ...inputStyle, padding: '8px 10px' }} />
                      </td>
                      <td style={{ padding: '10px 12px', width: '15%' }}>
                        <input value={item.quantity} onChange={e => updateLineItem(item.id, "quantity", e.target.value)} type="number" min="0"
                          style={{ ...inputStyle, padding: '8px 10px' }} />
                      </td>
                      <td style={{ padding: '10px 12px', width: '20%' }}>
                        <input value={item.unitPrice} onChange={e => updateLineItem(item.id, "unitPrice", e.target.value)} type="number" min="0" step="0.01" placeholder="0.00"
                          style={{ ...inputStyle, padding: '8px 10px' }} />
                      </td>
                      <td style={{ padding: '10px 12px', color: '#16a34a', fontWeight: '700', fontSize: '14px' }}>
                        {formatCurrency(lineItemTotal(item))}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <button onClick={() => removeLineItem(item.id)}
                          style={{ padding: '6px 10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div style={{ marginTop: '16px', marginLeft: 'auto', maxWidth: '300px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px' }}>
              {[
                { label: 'Subtotal', value: formatCurrency(subtotal), bold: false },
                { label: 'HST (13%)', value: formatCurrency(hst), bold: false },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#6b7280' }}>
                  <span>{row.label}</span><span>{row.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: '10px', fontSize: '16px', fontWeight: '800', color: '#111' }}>
                <span>Total (CAD)</span><span style={{ color: '#16a34a' }}>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quote Notes / Terms</label>
            <textarea value={quoteNotes} onChange={e => setQuoteNotes(e.target.value)} rows={3} placeholder="Payment terms, warranty details, and other notes..."
              style={{ ...inputStyle, resize: 'none' }} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleSaveQuote} disabled={isSaving} style={{
              padding: '12px 28px', background: '#16a34a', color: 'white',
              border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '700',
              cursor: 'pointer', opacity: isSaving ? 0.7 : 1,
              boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
            }}>
              {isSaving ? 'Saving...' : 'Save Quote'}
            </button>
            <button onClick={() => router.push('/quotes')} style={{
              padding: '12px 28px', background: 'white', color: '#374151',
              border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '15px',
              fontWeight: '600', cursor: 'pointer',
            }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}