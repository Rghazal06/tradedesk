"use client";

import { loadStripe } from "@stripe/stripe-js";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { generateInvoicePDF, invoiceRowToPdfData, type InvoiceDbRow } from "../../lib/generateInvoicePDF";
import { supabase } from "../../lib/supabase";

type InvoiceRow = InvoiceDbRow & {
  id: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
  payment_link?: string | null;
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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [paymentLinkLoadingId, setPaymentLinkLoadingId] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);

  const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  useEffect(() => {
    if (stripePublishableKey) {
      void loadStripe(stripePublishableKey);
    }
  }, [stripePublishableKey]);

  const fetchInvoices = useCallback(async () => {
    setErrorMessage("");

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setErrorMessage("Please sign in to view your invoices.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("invoices")
      .select(
        "id, customer_name, customer_email, customer_phone, job_description, line_items, subtotal, hst, total, notes, status, created_at, payment_link"
      )
      .eq("user_id", authData.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setInvoices((data ?? []) as InvoiceRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchInvoices();
    });
  }, [fetchInvoices]);

  const handleMarkPaid = async (invoiceId: string) => {
    setErrorMessage("");
    setMarkingPaidId(invoiceId);

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setMarkingPaidId(null);
      return;
    }

    const { error } = await supabase
      .from("invoices")
      .update({ status: "paid" })
      .eq("id", invoiceId)
      .eq("user_id", authData.user.id);

    setMarkingPaidId(null);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setInvoices((current) =>
      current.map((inv) => (inv.id === invoiceId ? { ...inv, status: "paid" } : inv))
    );
  };

  const handleSendPaymentLink = async (invoice: InvoiceRow) => {
    setErrorMessage("");
    setCopyToast(null);
    setPaymentLinkLoadingId(invoice.id);

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      setErrorMessage("Please sign in to create a payment link.");
      setPaymentLinkLoadingId(null);
      return;
    }

    try {
      const response = await fetch("/api/create-payment-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount: invoice.total,
          customerEmail: invoice.customer_email ?? "",
        }),
      });

      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !payload.url) {
        setErrorMessage(payload.error ?? "Could not create payment link.");
        setPaymentLinkLoadingId(null);
        return;
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        setErrorMessage("Session expired. Please sign in again.");
        setPaymentLinkLoadingId(null);
        return;
      }

      const { error: updateError } = await supabase
        .from("invoices")
        .update({ payment_link: payload.url })
        .eq("id", invoice.id)
        .eq("user_id", userData.user.id);

      if (updateError) {
        setErrorMessage(updateError.message);
        setPaymentLinkLoadingId(null);
        return;
      }

      setInvoices((current) =>
        current.map((inv) =>
          inv.id === invoice.id ? { ...inv, payment_link: payload.url } : inv
        )
      );
    } catch {
      setErrorMessage("Network error while creating payment link.");
    }

    setPaymentLinkLoadingId(null);
  };

  const handleCopyPaymentLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyToast("Link copied to clipboard.");
      setTimeout(() => setCopyToast(null), 2500);
    } catch {
      setErrorMessage("Could not copy to clipboard.");
    }
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
                  link.label === "Invoices"
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
                <h2 className="text-xl font-semibold tracking-tight">Invoices</h2>
                <Link
                  href="/quotes"
                  className="w-full rounded-full border border-slate-600 px-5 py-3 text-center text-sm font-semibold text-white transition hover:border-slate-400 sm:w-auto"
                >
                  From quotes
                </Link>
              </div>

              {copyToast ? (
                <p className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {copyToast}
                </p>
              ) : null}

              {stripePublishableKey ? (
                <p className="mb-4 text-xs text-slate-500">
                  Online payments use Stripe (publishable key loaded for checkout compatibility).
                </p>
              ) : null}

              {errorMessage ? (
                <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {errorMessage}
                </p>
              ) : null}

              {loading ? (
                <p className="text-slate-300">Loading invoices...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[960px] text-left text-sm">
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
                      {invoices.length > 0 ? (
                        invoices.map((invoice) => {
                          const statusKey = (invoice.status || "unpaid").toLowerCase();
                          const isPaid = statusKey === "paid";
                          return (
                            <tr
                              key={invoice.id}
                              className="border-b border-slate-800/80 text-slate-100 last:border-0"
                            >
                              <td className="px-3 py-3">{invoice.customer_name || "-"}</td>
                              <td className="px-3 py-3">{formatCurrency(invoice.total)}</td>
                              <td className="px-3 py-3">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                    isPaid
                                      ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40"
                                      : "bg-red-500/20 text-red-300 ring-1 ring-red-500/40"
                                  }`}
                                >
                                  {isPaid ? "paid" : "unpaid"}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-slate-300">
                                {formatDate(invoice.created_at)}
                              </td>
                              <td className="px-3 py-3 align-top">
                                <div className="flex max-w-md flex-col gap-2">
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        generateInvoicePDF(invoiceRowToPdfData(invoice))
                                      }
                                      className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500"
                                    >
                                      Download PDF
                                    </button>
                                    {!isPaid ? (
                                      <>
                                        <button
                                          type="button"
                                          disabled={paymentLinkLoadingId === invoice.id}
                                          onClick={() => void handleSendPaymentLink(invoice)}
                                          className="rounded-full border border-violet-500/60 bg-violet-500/15 px-3 py-1.5 text-xs font-semibold text-violet-200 transition hover:bg-violet-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                          {paymentLinkLoadingId === invoice.id
                                            ? "Creating link..."
                                            : "Send Payment Link"}
                                        </button>
                                        <button
                                          type="button"
                                          disabled={markingPaidId === invoice.id}
                                          onClick={() => void handleMarkPaid(invoice.id)}
                                          className="rounded-full border border-emerald-600/60 bg-emerald-600/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-600/25 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                          {markingPaidId === invoice.id
                                            ? "Updating..."
                                            : "Mark as Paid"}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            const res = await fetch('/api/send-invoice-reminder', {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                customerEmail: invoice.customer_email,
                                                customerName: invoice.customer_name,
                                                invoiceTotal: invoice.total?.toFixed(2),
                                                invoiceId: invoice.id,
                                                contractorName: 'TradeDesk Contractor',
                                                contractorPhone: '',
                                                paymentLink: invoice.payment_link || '',
                                              })
                                            });
                                            const data = await res.json();
                                            if (data.success) alert('Reminder sent!');
                                            else alert('Error: ' + data.error);
                                          }}
                                          className="rounded-full border border-yellow-600/60 bg-yellow-600/15 px-3 py-1.5 text-xs font-semibold text-yellow-300 transition hover:bg-yellow-600/25"
                                        >
                                          Send Reminder
                                        </button>
                                      </>
                                    ) : null}
                                  </div>
                                  {!isPaid && invoice.payment_link ? (
                                    <div className="rounded-lg border border-slate-700 bg-slate-950/80 p-2">
                                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                        Payment link — copy and send to customer
                                      </p>
                                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                        <input
                                          readOnly
                                          value={invoice.payment_link}
                                          className="min-w-0 flex-1 rounded-md border border-slate-600 bg-slate-900 px-2 py-1.5 text-xs text-slate-200"
                                        />
                                        <button
                                          type="button"
                                          onClick={() =>
                                            void handleCopyPaymentLink(invoice.payment_link!)
                                          }
                                          className="shrink-0 rounded-full border border-slate-500 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-slate-400"
                                        >
                                          Copy link
                                        </button>
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td className="px-3 py-6 text-slate-300" colSpan={5}>
                            No invoices yet. Convert a quote to create one.
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
