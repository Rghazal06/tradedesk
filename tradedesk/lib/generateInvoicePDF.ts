import { jsPDF } from "jspdf";
import { parseLineItemsFromDb, type QuoteLineItemPdf } from "./generatePDF";

export type InvoicePdfData = {
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

export type InvoiceDbRow = {
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
  payment_link?: string | null;
};

const money = (value: number) =>
  (Number(value) || 0).toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
  });

export function invoiceRowToPdfData(row: InvoiceDbRow): InvoicePdfData {
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

function invoiceNumber(id?: string): string {
  if (!id) return "INV-DRAFT";
  const short = id.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `INV-${short}`;
}

const DEFAULT_PAYMENT_INSTRUCTIONS =
  "Payment by e-transfer is preferred. Please include the invoice number in the memo field. " +
  "Cheques payable to your business name are also accepted. Payment is due within 15 days of the invoice date unless otherwise agreed in writing.";

/**
 * Professional TradeDesk invoice PDF (matches quote PDF styling).
 */
export function generateInvoicePDF(invoice: InvoicePdfData, filename?: string): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const navy: [number, number, number] = [15, 42, 68];
  const accent: [number, number, number] = [37, 99, 235];

  const statusLower = (invoice.status ?? "").toLowerCase();
  const isPaid = statusLower === "paid";
  const amountDue = isPaid ? 0 : invoice.total;

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
  doc.text("INVOICE", pageW - margin, 10, { align: "right" });
  const invNo = invoiceNumber(invoice.id);
  doc.text(`Invoice #: ${invNo}`, pageW - margin, 15, { align: "right" });
  if (invoice.created_at) {
    doc.text(
      `Date: ${new Date(invoice.created_at).toLocaleDateString("en-CA", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })}`,
      pageW - margin,
      20,
      { align: "right" }
    );
  }

  let y = 36;
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Bill to", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const customerBlock = [
    invoice.customer_name || "—",
    invoice.customer_email,
    invoice.customer_phone,
  ].filter((v) => v && String(v).trim() !== "");
  customerBlock.forEach((line) => {
    doc.text(String(line), margin, y);
    y += 5.2;
  });

  if (invoice.job_description?.trim()) {
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Description of work", margin, y);
    y += 4.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const scopeLines = doc.splitTextToSize(invoice.job_description, pageW - 2 * margin);
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
    if (y + needed > pageH - 52) {
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
    invoice.line_items.length > 0
      ? invoice.line_items
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
  ensureSpace(52);
  const totW = 78;
  const totX = pageW - margin - totW;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.rect(totX, y, totW, 30, "S");

  let ty = y + 7;
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("Subtotal (CAD)", totX + 4, ty);
  doc.text(money(invoice.subtotal), totX + totW - 4, ty, { align: "right" });
  ty += 7;
  doc.text("HST (13%)", totX + 4, ty);
  doc.text(money(invoice.hst), totX + totW - 4, ty, { align: "right" });
  ty += 7;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.text("Total (CAD)", totX + 4, ty);
  doc.text(money(invoice.total), totX + totW - 4, ty, { align: "right" });

  y += 36;

  ensureSpace(22);
  if (isPaid) {
    doc.setFillColor(220, 252, 231);
    doc.setDrawColor(34, 197, 94);
  } else {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(248, 113, 113);
  }
  doc.setLineWidth(0.25);
  doc.roundedRect(margin, y, pageW - 2 * margin, 18, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(isPaid ? 20 : 127, isPaid ? 83 : 29, isPaid ? 45 : 29);
  doc.text(isPaid ? "Amount due (paid in full)" : "Amount due", margin + 4, y + 8);
  doc.setFontSize(14);
  doc.text(money(amountDue), pageW - margin - 4, y + 10, { align: "right" });
  if (isPaid) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(22, 101, 52);
    doc.text("Thank you — this invoice is settled.", margin + 4, y + 14);
  }
  y += 24;

  ensureSpace(28);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text("Payment instructions", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const payLines = doc.splitTextToSize(DEFAULT_PAYMENT_INSTRUCTIONS, pageW - 2 * margin);
  doc.text(payLines, margin, y);
  y += payLines.length * 4.2 + 4;

  if (invoice.notes?.trim()) {
    ensureSpace(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text("Additional notes", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const noteLines = doc.splitTextToSize(invoice.notes, pageW - 2 * margin);
    doc.text(noteLines, margin, y);
  }

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  const footerY = pageH - 8;
  doc.text(
    "TradeDesk — Ontario contractor invoicing. Thank you for your business.",
    pageW / 2,
    footerY,
    { align: "center" }
  );

  const baseName =
    filename ??
    `TradeDesk-Invoice-${invoice.id ? invoice.id.slice(0, 8) : "draft"}.pdf`;
  doc.save(baseName.toLowerCase().endsWith(".pdf") ? baseName : `${baseName}.pdf`);
}
