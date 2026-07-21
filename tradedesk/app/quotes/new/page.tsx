"use client";

import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { useEffect, useMemo, useState } from "react";
import Sidebar from '../../../components/Sidebar';

type LineItem = {
  id: number;
  description: string;
  quantity: string;
  unitPrice: string;
};

interface PricebookItem {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  unit_price: number;
}

const PRICEBOOK_CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  'Labor':            { bg: '#f0fdf4', color: '#166534' },
  'Parts & Materials':{ bg: '#eff6ff', color: '#1d4ed8' },
  'Electrical':       { bg: '#fefce8', color: '#854d0e' },
  'Plumbing':         { bg: '#f0f9ff', color: '#075985' },
  'HVAC':             { bg: '#fef3c7', color: '#92400e' },
  'Roofing':          { bg: '#fef2f2', color: '#991b1b' },
  'General':          { bg: '#f5f3ff', color: '#5b21b6' },
  'Other':            { bg: '#f3f4f6', color: '#374151' },
};


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

  // Pricebook modal
  const [showPricebook, setShowPricebook] = useState(false);
  const [pricebookItems, setPricebookItems] = useState<PricebookItem[]>([]);
  const [pricebookSearch, setPricebookSearch] = useState('');
  const [pricebookFilter, setPricebookFilter] = useState('');

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
      if (profile?.full_name) setUserName(profile.full_name.split(' ')[0]);
      // Preload pricebook
      const { data: pb } = await supabase.from('pricebook_items').select('*').eq('user_id', user.id).order('category');
      setPricebookItems(pb || []);
    }
    checkAuth();
  }, []);

  function openPricebook() {
    setPricebookSearch('');
    setPricebookFilter('');
    setShowPricebook(true);
  }

  function addFromPricebook(item: PricebookItem) {
    setLineItems(prev => [...prev, {
      id: Date.now(),
      description: item.name + (item.description ? ` — ${item.description}` : ''),
      quantity: '1',
      unitPrice: item.unit_price.toString(),
    }]);
    setShowPricebook(false);
  }

  const filteredPricebook = pricebookItems.filter(item => {
    if (pricebookFilter && item.category !== pricebookFilter) return false;
    if (pricebookSearch && !item.name.toLowerCase().includes(pricebookSearch.toLowerCase())) return false;
    return true;
  });

  const pricebookCategories = [...new Set(pricebookItems.map(i => i.category))].sort();

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
      let data: any = {};
      try { data = await res.json(); } catch { setErrorMessage(`Server error (${res.status}). Ensure OPENAI_API_KEY is set in Vercel environment variables.`); return; }
      if (!res.ok || data.error) { setErrorMessage(data.error || `Error ${res.status}`); return; }
      if (data.line_items) {
        setLineItems(data.line_items.map((item: any, index: number) => ({ id: Date.now() + index, description: item.description, quantity: String(item.quantity), unitPrice: String(item.unit_price) })));
      }
      if (data.notes) setQuoteNotes(data.notes);
      setSuccessMessage('AI generated your quote! Review and adjust before sending.');
    } catch { setErrorMessage('Network error. Could not reach the server.'); }
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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f4', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .qn-topbar { padding: 14px 16px !important; flex-wrap: wrap !important; gap: 10px !important; }
          .qn-topbar a { font-size: 12px !important; }
          .qn-body { padding: 16px !important; }
          .qn-grid-2 { grid-template-columns: 1fr !important; }
          .qn-grid-2 > [style*="span 2"] { grid-column: span 1 !important; }
          .qn-ai-row { grid-template-columns: 1fr !important; }
          .qn-ai-row button { width: 100% !important; justify-content: center !important; }
          .qn-totals { max-width: 100% !important; margin-left: 0 !important; }
          .qn-actions { flex-wrap: wrap !important; }
          .qn-actions button, .qn-actions a { flex: 1 !important; text-align: center !important; justify-content: center !important; }
        }
      `}</style>
      <Sidebar activePath="/quotes" />

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Top bar */}
        <div className="qn-topbar" style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: 0 }}>Create New Quote</h1>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '2px 0 0' }}>Welcome back, {userName}</p>
          </div>
          <a href="/quotes" style={{ padding: '8px 16px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#374151', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
            ← Back to Quotes
          </a>
        </div>

        <div className="qn-body" style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>

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
            <div className="qn-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
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
            <div className="qn-ai-row" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'end', marginBottom: '16px' }}>
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
                ) : 'Generate with AI'}
              </button>
            </div>
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
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={openPricebook} style={{ padding: '8px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#1d4ed8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="13" height="13" viewBox="0 0 15 15" fill="none"><rect x="2" y="2" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><line x1="5" y1="5.5" x2="10" y2="5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="5" y1="7.5" x2="8" y2="7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                  Pricebook
                </button>
                <button onClick={addLineItem} style={{ padding: '8px 16px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#374151', cursor: 'pointer' }}>
                  + Add Item
                </button>
              </div>
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
            <div className="qn-totals" style={{ marginTop: '16px', marginLeft: 'auto', maxWidth: '300px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px' }}>
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
          <div className="qn-actions" style={{ display: 'flex', gap: '12px' }}>
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

      {/* Pricebook Modal */}
      {showPricebook && (
        <div
          onClick={() => setShowPricebook(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '640px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
          >
            {/* Modal header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111', margin: '0 0 2px' }}>Browse Pricebook</h2>
                <p style={{ color: '#9ca3af', fontSize: '12px', margin: 0 }}>Click any item to add it as a line item</p>
              </div>
              <button onClick={() => setShowPricebook(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '18px', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>

            {/* Search + filter */}
            <div style={{ padding: '14px 24px', borderBottom: '1px solid #f3f4f6', flexShrink: 0, display: 'flex', gap: '8px' }}>
              <input
                value={pricebookSearch}
                onChange={e => setPricebookSearch(e.target.value)}
                placeholder="Search items..."
                autoFocus
                style={{ flex: 1, padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', color: '#111', background: '#f9fafb' }}
              />
              {pricebookCategories.length > 1 && (
                <select value={pricebookFilter} onChange={e => setPricebookFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', color: '#374151', background: 'white', cursor: 'pointer' }}>
                  <option value="">All Categories</option>
                  {pricebookCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
            </div>

            {/* Items */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {pricebookItems.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center', color: '#9ca3af' }}>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: '0 0 8px' }}>No pricebook items yet</p>
                  <p style={{ fontSize: '13px', margin: '0 0 16px' }}>Add your standard services in the Pricebook section</p>
                  <a href="/pricebook" style={{ background: '#16a34a', color: 'white', padding: '8px 18px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '13px' }}>Go to Pricebook</a>
                </div>
              ) : filteredPricebook.length === 0 ? (
                <div style={{ padding: '40px 24px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>No items match your search</div>
              ) : (
                filteredPricebook.map(item => {
                  const catStyle = PRICEBOOK_CATEGORY_COLORS[item.category] || PRICEBOOK_CATEGORY_COLORS['Other'];
                  return (
                    <button
                      key={item.id}
                      onClick={() => addFromPricebook(item)}
                      style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '14px 24px', background: 'transparent', border: 'none', borderBottom: '1px solid #f9fafb', cursor: 'pointer', textAlign: 'left', gap: '14px' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f9fafb'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                    >
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#111', margin: '0 0 3px' }}>{item.name}</p>
                        {item.description && <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>{item.description}</p>}
                      </div>
                      <span style={{ background: catStyle.bg, color: catStyle.color, borderRadius: '100px', padding: '3px 10px', fontSize: '11px', fontWeight: '600', flexShrink: 0 }}>
                        {item.category}
                      </span>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: '15px', fontWeight: '800', color: '#16a34a', margin: '0 0 1px' }}>${item.unit_price?.toFixed(2)}</p>
                        <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>per {item.unit}</p>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#d1d5db', flexShrink: 0 }}><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}