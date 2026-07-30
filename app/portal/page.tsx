'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function PortalContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => { if (token) loadQuote(); else setNotFound(true); }, [token]);

  async function loadQuote() {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('portal_token', token)
      .single();

    if (error || !data) { setNotFound(true); setLoading(false); return; }
    setQuote(data);
    setApproved(data.approved || false);
    setLoading(false);
  }

  async function approveQuote() {
    if (!quote || !token) return;
    setApproving(true);
    const res = await fetch('/api/quotes/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (res.ok) {
      setApproved(true);
    }
    setApproving(false);
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-500 text-lg">Loading your quote...</div>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Quote Not Found</h1>
        <p className="text-gray-500">This link may have expired or is invalid.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-2xl p-8 mb-6 text-white">
          <div className="flex items-center justify-between mb-6">
            <div className="bg-white/20 rounded-xl px-4 py-2">
              <span className="font-bold text-lg">TradeDesk</span>
            </div>
            <span className="text-blue-200 text-sm">Customer Quote Portal</span>
          </div>
          <h1 className="text-3xl font-bold mb-1">Hi, {quote?.customer_name}!</h1>
          <p className="text-blue-200">Here's your quote. Review it and approve when ready.</p>
        </div>

        {approved && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6 text-center">
            <div className="text-green-600 mb-2">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{display:'inline-block'}}><circle cx="12" cy="12" r="10" fill="#dcfce7" stroke="#86efac" strokeWidth="1.5"/><path d="M8 12l3 3 5-5" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h2 className="text-green-800 font-bold text-xl">Quote Approved!</h2>
            <p className="text-green-600 mt-1">Thank you! The contractor will be in touch shortly.</p>
          </div>
        )}

        {quote?.job_description && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-800 text-lg mb-2">Job Description</h2>
            <p className="text-gray-600">{quote.job_description}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 text-lg mb-4">Quote Details</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-gray-500 font-medium">Description</th>
                <th className="text-center py-2 text-gray-500 font-medium">Qty</th>
                <th className="text-right py-2 text-gray-500 font-medium">Unit Price</th>
                <th className="text-right py-2 text-gray-500 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {quote?.line_items?.map((item: any, i: number) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-3 text-gray-800">{item.description}</td>
                  <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-600">${Number(item.unit_price).toFixed(2)}</td>
                  <td className="py-3 text-right text-gray-800 font-medium">${Number(item.total || item.quantity * item.unit_price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            <div className="flex justify-between text-gray-600 text-sm">
              <span>Subtotal</span><span>${Number(quote?.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600 text-sm">
              <span>HST (13%)</span><span>${Number(quote?.hst).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-800 font-bold text-xl pt-2 border-t border-gray-200">
              <span>Total (CAD)</span><span>${Number(quote?.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {quote?.notes && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-800 text-lg mb-2">Notes & Terms</h2>
            <p className="text-gray-600 text-sm">{quote.notes}</p>
          </div>
        )}

        {!approved && (
          <button
            onClick={approveQuote}
            disabled={approving}
            className="w-full py-4 bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-600 hover:to-blue-400 text-white rounded-2xl font-bold text-lg shadow-lg disabled:opacity-50 transition-all">
            {approving ? 'Approving...' : 'Approve This Quote'}
          </button>
        )}

        <p className="text-center text-gray-400 text-xs mt-6">
          Powered by TradeDesk — Business software for Ontario contractors
        </p>
      </div>
    </div>
  );
}

export default function PortalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-500">Loading...</div></div>}>
      <PortalContent />
    </Suspense>
  );
}