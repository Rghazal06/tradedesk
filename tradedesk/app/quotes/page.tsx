"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { generateQuotePDF, quoteRowToPdfData, type QuoteDbRow } from "../../lib/generatePDF";
import { supabase } from "../../lib/supabase";

type QuoteRow = QuoteDbRow & {
  id: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
};

const navLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Quotes", href: "/quotes" },
  { label: "Invoices", href: "/invoices" },
  { label: "Jobs", href: "#" },
  { label: "WSIB Tracking", href: "#" },
  { label: "Settings", href: "#" },
];

const formatCurrency = (value: number) =>
  (value ?? 0).toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
  });

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default function QuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [convertingId, setConvertingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuotes = async () => {
      setLoading(true);
      setErrorMessage("");

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        setErrorMessage("Please sign in to view your quotes.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("quotes")
        .select(
          "id, customer_name, customer_email, customer_phone, job_description, line_items, subtotal, hst, total, notes, status, created_at, portal_token"
        )
        .eq("user_id", authData.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      setQuotes(data ?? []);
      setLoading(false);
    };

    void fetchQuotes();
  }, []);

  const handleConvertToInvoice = async (quote: QuoteRow) => {
    setErrorMessage("");
    setConvertingId(quote.id);

    const { data: authData, error: authError } = await supabase.auth.getUser();
    const user = authData.user;

    if (authError || !user) {
      setConvertingId(null);
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("invoices").insert({
      user_id: user.id,
      customer_name: quote.customer_name ?? "",
      customer_email: quote.customer_email,
      customer_phone: quote.customer_phone,
      job_description: quote.job_description,
      line_items: quote.line_items,
      subtotal: quote.subtotal ?? 0,
      hst: quote.hst ?? 0,
      total: quote.total ?? 0,
      notes: quote.notes,
      status: "unpaid",
    });

    setConvertingId(null);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.push("/invoices");
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
                Welcome back, Contractor
              </h1>
              <button className="w-full rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-slate-500 sm:w-auto">
                Logout
              </button>
            </div>
          </header>

          <main className="px-6 py-6">
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold tracking-tight">Quotes</h2>
                <Link
                  href="/quotes/new"
                  className="w-full rounded-full bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-500 sm:w-auto"
                >
                  New Quote
                </Link>
              </div>

              {errorMessage ? (
                <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {errorMessage}
                </p>
              ) : null}

              {loading ? (
                <p className="text-slate-300">Loading quotes...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[880px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-300">
                        <th className="px-3 py-3 font-medium">Customer Name</th>
                        <th className="px-3 py-3 font-medium">Total</th>
                        <th className="px-3 py-3 font-medium">Status</th>
                        <th className="px-3 py-3 font-medium">Date</th>
                        <th className="px-3 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotes.length > 0 ? (
                        quotes.map((quote) => (
                          <tr
                            key={quote.id}
                            className="border-b border-slate-800/80 text-slate-100 last:border-0"
                          >
                            <td className="px-3 py-3">{quote.customer_name || "-"}</td>
                            <td className="px-3 py-3">{formatCurrency(quote.total)}</td>
                            <td className="px-3 py-3">
                              <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-200">
                                {quote.status || "Draft"}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-slate-300">
                              {formatDate(quote.created_at)}
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-slate-500"
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    generateQuotePDF(quoteRowToPdfData(quote))
                                  }
                                  className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500"
                                >
                                  Download PDF
                                </button>
                                <button
                                  type="button"
                                  disabled={convertingId === quote.id}
                                  onClick={() => void handleConvertToInvoice(quote)}
                                  className="rounded-full border border-amber-600/60 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {convertingId === quote.id ? "Converting..." : "Convert to Invoice"}
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const anyQuote = quote as any;
                                    if (!anyQuote.portal_token) {
                                      const token = crypto.randomUUID();
                                      await supabase.from('quotes').update({ portal_token: token }).eq('id', quote.id);
                                      const link = `${window.location.origin}/portal?token=${token}`;
                                      navigator.clipboard.writeText(link);
                                      alert('Portal link copied! Send this to your customer: ' + link);
                                    } else {
                                      const link = `${window.location.origin}/portal/${anyQuote.portal_token}`;
                                      navigator.clipboard.writeText(link);
                                      alert('Portal link copied! Send this to your customer: ' + link);
                                    }
                                  }}
                                  className="rounded-full border border-purple-600/60 bg-purple-500/15 px-3 py-1.5 text-xs font-semibold text-purple-200 transition hover:bg-purple-500/25"
                                >
                                  Share Portal 🔗
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-3 py-6 text-slate-300" colSpan={5}>
                            No quotes yet. Create your first quote.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
