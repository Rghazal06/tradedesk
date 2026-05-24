"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { useEffect, useMemo, useState } from "react";

type LineItem = {
  id: number;
  description: string;
  quantity: string;
  unitPrice: string;
};

const navLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Quotes", href: "/quotes" },
  { label: "Invoices", href: "/invoices" },
  { label: "Jobs", href: "/jobs" },
  { label: "WSIB Tracking", href: "/wsib" },
  { label: "AI Profit Analyzer", href: "/profit" },
  { label: "Settings", href: "/settings" },
];

const createEmptyLineItem = (id: number): LineItem => ({
  id,
  description: "",
  quantity: "1",
  unitPrice: "",
});

const toNumber = (value: string) => {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const lineItemTotal = (item: LineItem) => toNumber(item.quantity) * toNumber(item.unitPrice);

const formatCurrency = (value: number) =>
  value.toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
  });

export default function NewQuotePage() {
  const router = useRouter();
  useEffect(() => {
  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
    if (profile?.full_name) setUserName(profile.full_name.split(' ')[0]);
  }
  checkAuth();
}, []);
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

  const subtotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + lineItemTotal(item), 0),
    [lineItems]
  );
  const hst = subtotal * 0.13;
  const total = subtotal + hst;

  const updateLineItem = (
    itemId: number,
    field: "description" | "quantity" | "unitPrice",
    value: string
  ) => {
    setLineItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, [field]: value } : item))
    );
  };

  const addLineItem = () => {
    setLineItems((current) => [...current, createEmptyLineItem(Date.now())]);
  };

  const removeLineItem = (itemId: number) => {
    setLineItems((current) => {
      const filtered = current.filter((item) => item.id !== itemId);
      return filtered.length > 0 ? filtered : [createEmptyLineItem(Date.now())];
    });
  };

  const handleAIGenerate = async () => {
  if (!jobDescription) {
    setErrorMessage('Please enter a job description first so AI knows what to quote.');
    return;
  }
  setIsGenerating(true);
  setErrorMessage('');
  try {
    const res = await fetch('/api/ai-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobDescription, tradeType }),
    });
    const data = await res.json();
    if (data.error) { setErrorMessage(data.error); return; }
    if (data.line_items) {
      setLineItems(data.line_items.map((item: any, index: number) => ({
        id: Date.now() + index,
        description: item.description,
        quantity: String(item.quantity),
        unitPrice: String(item.unit_price),
      })));
    }
    if (data.notes) setQuoteNotes(data.notes);
    setSuccessMessage('AI generated your quote! Review and adjust before sending.');
  } catch (error) {
    setErrorMessage('AI generation failed. Please try again.');
  } finally {
    setIsGenerating(false);
  }
};

  const handleSaveQuote = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    setIsSaving(true);

    const { data: authData, error: authError } = await supabase.auth.getUser();
    const user = authData.user;

    if (authError || !user) {
      setIsSaving(false);
      router.push("/login");
      return;
    }

    const normalizedLineItems = lineItems.map((item) => ({
      description: item.description,
      quantity: toNumber(item.quantity),
      unit_price: toNumber(item.unitPrice),
      total: lineItemTotal(item),
    }));

    const { error } = await supabase.from("quotes").insert({
      user_id: user.id,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      job_description: jobDescription,
      line_items: normalizedLineItems,
      subtotal,
      hst,
      total,
      notes: quoteNotes,
      status: "Draft",
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSaving(false);
      return;
    }

    setSuccessMessage("Quote saved successfully. Redirecting...");
    setIsSaving(false);
    setTimeout(() => {
      router.push("/quotes");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col lg:flex-row">
        <aside className="w-full border-b border-slate-800 lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3 px-6 py-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold">
              TD
            </div>
            <span className="text-xl font-semibold tracking-tight">TradeDesk</span>
          </div>

          <nav className="grid grid-cols-2 gap-2 px-4 pb-5 lg:grid-cols-1 lg:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  link.label === "Quotes"
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex-1">
          <header className="border-b border-slate-800">
            <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-2xl font-semibold tracking-tight">
                Welcome back, {userName}
              </h1>
              <button className="w-full rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-slate-500 sm:w-auto">
                Logout
              </button>
            </div>
          </header>

          <main className="px-6 py-6">
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold tracking-tight">Create New Quote</h2>
                <button className="w-full rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 sm:w-auto">
                  New Quote
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Customer Name
                  </label>
                  <input
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    placeholder="Customer full name"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Email
                  </label>
                  <input
                    value={customerEmail}
                    onChange={(event) => setCustomerEmail(event.target.value)}
                    placeholder="customer@email.com"
                    type="email"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Phone Number
                  </label>
                  <input
                    value={customerPhone}
                    onChange={(event) => setCustomerPhone(event.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Job Description

                    <div className="md:col-span-2 flex gap-3 items-end">
  <div className="flex-1">
    <label className="mb-2 block text-sm font-medium text-slate-300">
      Trade Type (for AI)
    </label>
    <select
      value={tradeType}
      onChange={e => setTradeType(e.target.value)}
      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white">
      <option value="">Select your trade</option>
      {['Electrician', 'Plumber', 'HVAC', 'General Contractor', 'Roofer', 'Other'].map(t => (
        <option key={t} value={t}>{t}</option>
      ))}
    </select>
  </div>
  <button
    type="button"
    onClick={handleAIGenerate}
    disabled={isGenerating}
    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg font-semibold text-sm disabled:opacity-50 flex items-center gap-2 whitespace-nowrap">
    {isGenerating ? (
      <>
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        AI Generating...
      </>
    ) : (
      <>✨ Generate with AI</>
    )}
  </button>
</div>

                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(event) => setJobDescription(event.target.value)}
                    rows={4}
                    placeholder="Describe the scope of work..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-8">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Line Items</h3>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:border-slate-500"
                  >
                    Add Line Item
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-300">
                        <th className="px-3 py-3 font-medium">Description</th>
                        <th className="px-3 py-3 font-medium">Quantity</th>
                        <th className="px-3 py-3 font-medium">Unit Price</th>
                        <th className="px-3 py-3 font-medium">Total</th>
                        <th className="px-3 py-3 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item) => (
                        <tr key={item.id} className="border-b border-slate-800/80 last:border-0">
                          <td className="px-3 py-3">
                            <input
                              value={item.description}
                              onChange={(event) =>
                                updateLineItem(item.id, "description", event.target.value)
                              }
                              placeholder="Service description"
                              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-3">
                            <input
                              value={item.quantity}
                              onChange={(event) =>
                                updateLineItem(item.id, "quantity", event.target.value)
                              }
                              type="number"
                              min="0"
                              step="1"
                              className="w-24 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-3">
                            <input
                              value={item.unitPrice}
                              onChange={(event) =>
                                updateLineItem(item.id, "unitPrice", event.target.value)
                              }
                              type="number"
                              min="0"
                              step="0.01"
                              className="w-32 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-3 font-semibold text-slate-100">
                            {formatCurrency(lineItemTotal(item))}
                          </td>
                          <td className="px-3 py-3">
                            <button
                              type="button"
                              onClick={() => removeLineItem(item.id)}
                              className="rounded-full border border-red-400/50 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:border-red-300 hover:text-red-200"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-6 ml-auto w-full max-w-sm space-y-2 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>HST (13%)</span>
                  <span>{formatCurrency(hst)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-800 pt-2 text-lg font-semibold text-white">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="mt-6">
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Quote Notes / Terms
                </label>
                <textarea
                  value={quoteNotes}
                  onChange={(event) => setQuoteNotes(event.target.value)}
                  rows={4}
                  placeholder="Payment terms, warranty details, and other notes..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleSaveQuote}
                  disabled={isSaving}
                  className="w-full rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-white transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                >
                  {isSaving ? "Saving..." : "Save Quote"}
                </button>
                <button className="w-full rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 sm:w-auto">
                  Send to Customer
                </button>
              </div>

              {errorMessage ? (
                <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {errorMessage}
                </p>
              ) : null}

              {successMessage ? (
                <p className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  {successMessage}
                </p>
              ) : null}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
