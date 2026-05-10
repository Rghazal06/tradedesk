import { jsPDF } from "jspdf";

export type QuoteLineItemPdf = {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
};

export type QuotePdfData = {
  id?: string;
  customer_name: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  job_description?: string | null;
  line_items: QuoteLineItemPdf[];
  subtotal: number;
  hst: number;
  total: number;
  notes?: string | null;
  created_at?: string;
  status?: string;
};

/** Shape returned from Supabase `quotes` table (subset used for PDF). */
export type QuoteDbRow = {
  id?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  job_description?: string | null;
  line_items?: unknown;
  subtotal?: number | null;
  hst?: number | null;
  total?: number | null;
  notes?: string | null;
  created_at?: string | null;
  status?: string | null;
};

const money = (value: number) =>
  (Number(value) || 0).toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
  });

/** Normalize line_items from Supabase JSON (snake_case or camelCase). */
export function parseLineItemsFromDb(raw: unknown): QuoteLineItemPdf[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => {
    const r = row as Record<string, unknown>;
    const qty = Number(r.quantity) || 0;
    const unit = Number(r.unit_price ?? r.unitPrice) || 0;
    const lineTotal = Number(r.total);
    return {
      description: String(r.description ?? ""),
      quantity: qty,
      unit_price: unit,
      total: Number.isFinite(lineTotal) ? lineTotal : qty * unit,
    };
  });
}

/** Map a full quotes row from Supabase into QuotePdfData. */
export function quoteRowToPdfData(row: QuoteDbRow): QuotePdfData {
  return {
    id: typeof row.id === "string" ? row.id : undefined,
    customer_name: String(row.customer_name ?? ""),
    customer_email: row.customer_email != null ? String(row.customer_email) : null,
    customer_phone: row.customer_phone != null ? String(row.customer_phone) : null,
    job_description: row.job_description != null ? String(row.job_description) : null,
    line_items: parseLineItemsFromDb(row.line_items),
    subtotal: Number(row.subtotal) || 0,
    hst: Number(row.hst) || 0,
    total: Number(row.total) || 0,
    notes: row.notes != null ? String(row.notes) : null,
    created_at: typeof row.created_at === "string" ? row.created_at : undefined,
    status: row.status != null ? String(row.status) : undefined,
  };
}

/**
 * Builds a professional TradeDesk quote PDF and triggers download in the browser.
 */
export function generateQuotePDF(quote: QuotePdfData, filename?: string): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const navy: [number, number, number] = [15, 42, 68];
  const accent: [number, number, number] = [37, 99, 235];

  doc.setFillColor(...navy);
  doc.rect(0, 0, pageW, 26, "F");
  doc.setFillColor(...accent);
  doc.rect(0, 26, pageW, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("TradeDesk", margin, 11);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Business software for Ontario contractors", margin, 17);

  doc.setFontSize(8);
  doc.text("QUOTE", pageW - margin, 10, { align: "right" });
  if (quote.created_at) {
    doc.text(
      `Date: ${new Date(quote.created_at).toLocaleDateString("en-CA", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })}`,
      pageW - margin,
      15,
      { align: "right" }
    );
  }
  if (quote.id) {
    doc.text(`Reference: ${quote.id.slice(0, 8)}…`, pageW - margin, 20, { align: "right" });
  }

  let y = 36;
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Customer", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const customerBlock = [
    quote.customer_name || "—",
    quote.customer_email,
    quote.customer_phone,
  ].filter((v) => v && String(v).trim() !== "");
  customerBlock.forEach((line) => {
    doc.text(String(line), margin, y);
    y += 5.2;
  });

  if (quote.job_description?.trim()) {
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Job description", margin, y);
    y += 4.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const scopeLines = doc.splitTextToSize(quote.job_description, pageW - 2 * margin);
    doc.text(scopeLines, margin, y);
    y += scopeLines.length * 4.2 + 4;
  } else {
    y += 4;
  }

  const colDesc = margin;
  const colDescW = 82;
  const colQty = colDesc + colDescW;
  const colQtyW = 14;
  const colUnit = colQty + colQtyW;
  const colUnitW = 32;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - 42) {
      doc.addPage();
      y = margin + 8;
    }
  };

  ensureSpace(14);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y - 1, pageW - 2 * margin, 9, "F");
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.15);
  doc.line(margin, y + 8, pageW - margin, y + 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text("Description", colDesc + 1.5, y + 5.5);
  doc.text("Qty", colQty + colQtyW - 1, y + 5.5, { align: "right" });
  doc.text("Unit price", colUnit + colUnitW - 1, y + 5.5, { align: "right" });
  doc.text("Total", pageW - margin - 1, y + 5.5, { align: "right" });
  y += 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const items =
    quote.line_items.length > 0
      ? quote.line_items
      : [{ description: "—", quantity: 0, unit_price: 0, total: 0 }];

  for (const item of items) {
    const desc = item.description?.trim() || "—";
    const qty = item.quantity;
    const unit = item.unit_price;
    const lineTotal = item.total;

    const descLines = doc.splitTextToSize(desc, colDescW - 3);
    const rowH = Math.max(7, descLines.length * 4.2);

    ensureSpace(rowH + 2);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + rowH, pageW - margin, y + rowH);

    doc.setTextColor(30, 41, 59);
    doc.text(descLines, colDesc + 1.5, y + 4.5);
    doc.text(String(qty), colQty + colQtyW - 1, y + 4.5, { align: "right" });
    doc.text(money(unit), colUnit + colUnitW - 1, y + 4.5, { align: "right" });
    doc.text(money(lineTotal), pageW - margin - 1, y + 4.5, { align: "right" });

    y += rowH;
  }

  y += 6;
  ensureSpace(36);
  const totW = 72;
  const totX = pageW - margin - totW;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.rect(totX, y, totW, 30, "S");

  let ty = y + 7;
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("Subtotal", totX + 4, ty);
  doc.text(money(quote.subtotal), totX + totW - 4, ty, { align: "right" });
  ty += 7;
  doc.text("HST (13%)", totX + 4, ty);
  doc.text(money(quote.hst), totX + totW - 4, ty, { align: "right" });
  ty += 7;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.text("Total (CAD)", totX + 4, ty);
  doc.text(money(quote.total), totX + totW - 4, ty, { align: "right" });

  y += 36;
  if (quote.notes?.trim()) {
    ensureSpace(24);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text("Notes & terms", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const noteLines = doc.splitTextToSize(quote.notes, pageW - 2 * margin);
    doc.text(noteLines, margin, y);
  }

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  const footerY = pageH - 8;
  doc.text(
    "TradeDesk — Quoting built for Ontario trades. This document is an estimate unless otherwise agreed in writing.",
    pageW / 2,
    footerY,
    { align: "center" }
  );

  const baseName =
    filename ??
    `TradeDesk-Quote-${quote.id ? quote.id.slice(0, 8) : "draft"}.pdf`;
  doc.save(baseName.toLowerCase().endsWith(".pdf") ? baseName : `${baseName}.pdf`);
}
