'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Sidebar from '../../components/Sidebar';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const FF = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

// ─── Types ───────────────────────────────────────────────────────────────────

type DataType = 'receipts' | 'quotes' | 'invoices' | 'jobs';
type Step = 'choose' | 'upload' | 'map' | 'preview' | 'importing' | 'done';

interface FieldConfig {
  key: string;
  label: string;
  required: boolean;
  aliases: string[];
}

interface DataTypeConfig {
  label: string;
  description: string;
  color: string;
  bg: string;
  border: string;
  fields: FieldConfig[];
  template: { headers: string[]; example: string[] };
  apiEndpoint: string;
  href: string;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

// ─── Data type configs ────────────────────────────────────────────────────────

const DATA_TYPES: Record<DataType, DataTypeConfig> = {
  receipts: {
    label: 'Receipts & Expenses',
    description: 'Import expense history from spreadsheets, QuickBooks, or accounting software',
    color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0',
    fields: [
      { key: 'merchant', label: 'Merchant / Vendor', required: true, aliases: ['merchant', 'vendor', 'store', 'supplier', 'payee', 'from', 'paid to'] },
      { key: 'amount', label: 'Total Amount ($)', required: true, aliases: ['amount', 'total', 'paid', 'cost', 'price', 'total amount', 'total paid', 'grand total'] },
      { key: 'date', label: 'Date', required: false, aliases: ['date', 'receipt date', 'transaction date', 'purchase date', 'trans date'] },
      { key: 'subtotal', label: 'Subtotal ($)', required: false, aliases: ['subtotal', 'sub total', 'before tax'] },
      { key: 'tax', label: 'Tax / HST ($)', required: false, aliases: ['tax', 'hst', 'gst', 'pst', 'taxes', 'tax amount'] },
      { key: 'category', label: 'Category', required: false, aliases: ['category', 'type', 'expense type', 'class', 'account'] },
      { key: 'notes', label: 'Notes', required: false, aliases: ['notes', 'description', 'memo', 'comments', 'details'] },
    ],
    template: { headers: ['Merchant', 'Amount', 'Date', 'Subtotal', 'Tax', 'Category', 'Notes'], example: ['Home Depot', '112.99', '2024-01-15', '99.99', '13.00', 'Materials', 'Parts for Smith job'] },
    apiEndpoint: '/api/import/receipts', href: '/receipts',
  },
  quotes: {
    label: 'Quotes',
    description: 'Import past quotes sent to customers',
    color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0',
    fields: [
      { key: 'customer_name', label: 'Customer Name', required: true, aliases: ['customer', 'client', 'name', 'customer name', 'client name', 'contact'] },
      { key: 'total', label: 'Total Amount ($)', required: true, aliases: ['total', 'amount', 'quote total', 'price', 'total amount', 'grand total'] },
      { key: 'date', label: 'Date', required: false, aliases: ['date', 'quote date', 'created', 'sent date'] },
      { key: 'job_description', label: 'Job Description', required: false, aliases: ['description', 'job', 'scope', 'work', 'details', 'service', 'job description'] },
      { key: 'status', label: 'Status', required: false, aliases: ['status', 'state', 'quote status'] },
      { key: 'customer_email', label: 'Customer Email', required: false, aliases: ['email', 'customer email', 'email address'] },
      { key: 'customer_phone', label: 'Customer Phone', required: false, aliases: ['phone', 'customer phone', 'phone number', 'mobile', 'cell'] },
      { key: 'notes', label: 'Notes', required: false, aliases: ['notes', 'memo', 'comments'] },
    ],
    template: { headers: ['Customer Name', 'Total', 'Date', 'Job Description', 'Status', 'Email', 'Phone'], example: ['John Smith', '2850.00', '2024-01-10', '200A panel upgrade', 'Approved', 'john@email.com', '519-555-0001'] },
    apiEndpoint: '/api/import/quotes', href: '/quotes',
  },
  invoices: {
    label: 'Invoices',
    description: 'Import billing history and past invoices',
    color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe',
    fields: [
      { key: 'customer_name', label: 'Customer Name', required: true, aliases: ['customer', 'client', 'name', 'customer name', 'bill to', 'billed to'] },
      { key: 'total', label: 'Total Amount ($)', required: true, aliases: ['total', 'amount', 'invoice total', 'price', 'total amount', 'grand total', 'amount due'] },
      { key: 'date', label: 'Date', required: false, aliases: ['date', 'invoice date', 'created', 'issued', 'billing date'] },
      { key: 'job_description', label: 'Description / Work', required: false, aliases: ['description', 'job', 'scope', 'work', 'details', 'service', 'item'] },
      { key: 'status', label: 'Status (paid/unpaid)', required: false, aliases: ['status', 'state', 'payment status', 'paid'] },
      { key: 'subtotal', label: 'Subtotal ($)', required: false, aliases: ['subtotal', 'sub total', 'before tax'] },
      { key: 'hst', label: 'HST / Tax ($)', required: false, aliases: ['hst', 'tax', 'gst', 'taxes', 'tax amount'] },
      { key: 'customer_email', label: 'Customer Email', required: false, aliases: ['email'] },
      { key: 'customer_phone', label: 'Customer Phone', required: false, aliases: ['phone'] },
      { key: 'notes', label: 'Notes', required: false, aliases: ['notes', 'memo', 'comments'] },
    ],
    template: { headers: ['Customer Name', 'Total', 'Date', 'Description', 'Status'], example: ['Sarah Johnson', '1950.00', '2024-02-01', 'Basement rewire', 'paid'] },
    apiEndpoint: '/api/import/invoices', href: '/invoices',
  },
  jobs: {
    label: 'Jobs',
    description: 'Import past job records and history',
    color: '#b45309', bg: '#fefce8', border: '#fde68a',
    fields: [
      { key: 'title', label: 'Job Title', required: true, aliases: ['title', 'job', 'job title', 'name', 'work', 'job name'] },
      { key: 'customer_name', label: 'Customer Name', required: false, aliases: ['customer', 'client', 'customer name', 'homeowner', 'name'] },
      { key: 'customer_phone', label: 'Customer Phone', required: false, aliases: ['phone', 'customer phone', 'phone number', 'mobile'] },
      { key: 'scheduled_date', label: 'Date', required: false, aliases: ['date', 'scheduled date', 'job date', 'start date', 'scheduled'] },
      { key: 'status', label: 'Status', required: false, aliases: ['status', 'state', 'job status'] },
      { key: 'notes', label: 'Notes / Details', required: false, aliases: ['notes', 'details', 'description', 'memo', 'comments'] },
    ],
    template: { headers: ['Job Title', 'Customer Name', 'Customer Phone', 'Date', 'Status', 'Notes'], example: ['Panel Upgrade - 200A', 'Mike Brown', '519-555-0002', '2024-01-20', 'completed', 'Upgraded from 100A to 200A'] },
    apiEndpoint: '/api/import/jobs', href: '/jobs',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return { headers: [], rows: [] };
  function parseLine(line: string): string[] {
    const result: string[] = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
      else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    result.push(cur.trim());
    return result.map(v => v.replace(/^"|"$/g, '').trim());
  }
  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).filter(l => l.trim()).map(l => parseLine(l));
  return { headers, rows };
}

function autoMap(headers: string[], fields: FieldConfig[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const field of fields) {
    let bestMatch: string | null = null;
    let bestScore = 0;
    for (const header of headers) {
      const h = header.toLowerCase().trim();
      for (const alias of field.aliases) {
        const a = alias.toLowerCase();
        let score = 0;
        if (h === a) score = 3;
        else if (h.includes(a)) score = 2;
        else if (a.includes(h) && h.length > 2) score = 1;
        if (score > bestScore) { bestScore = score; bestMatch = header; }
      }
    }
    if (bestMatch && bestScore > 0) mapping[field.key] = bestMatch;
  }
  return mapping;
}

function getCellValue(row: string[], headers: string[], colName: string): string {
  const idx = headers.indexOf(colName);
  return idx >= 0 ? (row[idx] || '') : '';
}

function getMappedRow(row: string[], headers: string[], mapping: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [field, col] of Object.entries(mapping)) {
    result[field] = getCellValue(row, headers, col);
  }
  return result;
}

function downloadTemplate(config: DataTypeConfig, label: string) {
  const csv = [config.template.headers.join(','), config.template.example.map(v => `"${v}"`).join(',')].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `tradedesk-${label.toLowerCase().replace(/\s+/g, '-')}-template.csv`;
  a.click();
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const ICONS: Record<DataType, React.JSX.Element> = {
  receipts: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="4" y="2" width="14" height="20" rx="1.5" stroke="#15803d" strokeWidth="2"/><path d="M7 7h8M7 11h8M7 15h5" stroke="#15803d" strokeWidth="1.6" strokeLinecap="round"/><circle cx="20" cy="20" r="6" fill="white" stroke="#15803d" strokeWidth="1.8"/><path d="M20 17.5v2.5l1.5 1.5" stroke="#15803d" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  quotes: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="3" y="2" width="16" height="22" rx="2" stroke="#16a34a" strokeWidth="2"/><path d="M7 8h10M7 12h10M7 16h6" stroke="#16a34a" strokeWidth="1.6" strokeLinecap="round"/><circle cx="22" cy="22" r="5" fill="#16a34a"/><path d="M22 19.5v2.5H24.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  invoices: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M5 3h18v22l-3-2-3 2-3-2-3 2-3-2V3z" stroke="#7c3aed" strokeWidth="2" strokeLinejoin="round"/><path d="M9 10h10M9 14h10M9 18h6" stroke="#7c3aed" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  jobs: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M20 4c2 0 4 2.5 4 4.5 0 1.5-1 2.8-2.2 3.7L8 24l-5-5 11.5-12C15.5 5.5 18.5 4 20 4z" stroke="#b45309" strokeWidth="2" strokeLinejoin="round"/><path d="M17 7l4 4" stroke="#b45309" strokeWidth="1.6" strokeLinecap="round"/></svg>,
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function ImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('choose');
  const [dataType, setDataType] = useState<DataType | null>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [fileRows, setFileRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login');
    });
  }, [router]);

  // ── File processing ──────────────────────────────────────────────────────

  async function processFile(file: File) {
    setError('');
    const ext = file.name.split('.').pop()?.toLowerCase();
    try {
      if (ext === 'csv' || ext === 'txt') {
        const text = await file.text();
        const { headers, rows } = parseCSV(text);
        finishParse(file.name, headers, rows);
      } else if (ext === 'xlsx' || ext === 'xls') {
        const XLSX = await import('xlsx');
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_csv(ws);
        const { headers, rows } = parseCSV(raw);
        finishParse(file.name, headers, rows);
      } else {
        setError('Please upload a CSV or Excel (.xlsx) file.');
      }
    } catch {
      setError('Could not read the file. Make sure it is a valid CSV or Excel file.');
    }
  }

  function finishParse(name: string, headers: string[], rows: string[][]) {
    if (!headers.length || !rows.length) { setError('File is empty or has no data rows.'); return; }
    const config = DATA_TYPES[dataType!];
    setFileName(name);
    setFileHeaders(headers);
    setFileRows(rows);
    setMapping(autoMap(headers, config.fields));
    setStep('map');
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void processFile(file);
  }, [dataType]);

  // ── Import ───────────────────────────────────────────────────────────────

  async function runImport() {
    if (!dataType) return;
    setStep('importing');
    setProgress(0);

    const config = DATA_TYPES[dataType];
    const rows = fileRows.map(row => getMappedRow(row, fileHeaders, mapping));

    // Chunk into batches of 50
    const BATCH = 50;
    let imported = 0, skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(config.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({ rows: batch }),
        });
        const json = await res.json();
        imported += json.imported || 0;
        skipped += json.skipped || 0;
        if (json.errors?.length) errors.push(...json.errors.slice(0, 3));
      } catch {
        errors.push(`Batch ${Math.floor(i / BATCH) + 1} failed`);
      }
      setProgress(Math.round(((i + batch.length) / fileRows.length) * 100));
    }

    setResult({ imported, skipped, errors });
    setStep('done');
  }

  // ── Validation ───────────────────────────────────────────────────────────

  function getMappingIssues() {
    if (!dataType) return [];
    return DATA_TYPES[dataType].fields.filter(f => f.required && !mapping[f.key]);
  }

  const mappingIssues = dataType ? getMappingIssues() : [];
  const config = dataType ? DATA_TYPES[dataType] : null;
  const previewRows = fileRows.slice(0, 8);

  // ─────────────────────────────────────────────────────────────────────────

  const STEPS: { key: Step; label: string }[] = [
    { key: 'choose', label: 'Choose type' },
    { key: 'upload', label: 'Upload file' },
    { key: 'map', label: 'Map columns' },
    { key: 'preview', label: 'Preview' },
    { key: 'importing', label: 'Import' },
    { key: 'done', label: 'Done' },
  ];
  const currentStepIdx = STEPS.findIndex(s => s.key === step);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f4', fontFamily: FF }}>
      <Sidebar activePath="/import" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Top bar */}
        <div className="td-topbar" style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 32px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: 0 }}>Import Data</h1>
          <p style={{ color: '#6b7280', fontSize: '13px', margin: '2px 0 0' }}>Bring your existing data into TradeDesk from any spreadsheet or software</p>
        </div>

        <div className="td-body" style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          <div style={{ maxWidth: '740px', margin: '0 auto' }}>

            {/* Step indicator */}
            {step !== 'done' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '32px' }}>
                {STEPS.filter(s => s.key !== 'importing').map((s, i, arr) => {
                  const sIdx = STEPS.findIndex(x => x.key === s.key);
                  const done = sIdx < currentStepIdx;
                  const active = sIdx === currentStepIdx;
                  return (
                    <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i < arr.length - 1 ? '1' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: done ? '#16a34a' : active ? '#111' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {done ? (
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          ) : (
                            <span style={{ fontSize: '10px', color: active ? 'white' : '#9ca3af', fontWeight: '700' }}>{i + 1}</span>
                          )}
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: active ? '700' : '500', color: active ? '#111' : done ? '#16a34a' : '#9ca3af', whiteSpace: 'nowrap' as const }}>{s.label}</span>
                      </div>
                      {i < arr.length - 1 && <div style={{ flex: 1, height: '1px', background: done ? '#bbf7d0' : '#e5e7eb', margin: '0 8px' }} />}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── STEP 1: CHOOSE TYPE ── */}
            {step === 'choose' && (
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#111', margin: '0 0 6px', letterSpacing: '-0.5px' }}>What do you want to import?</h2>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 24px' }}>Choose the type of data you're bringing in. Your client list is automatically built from quotes, invoices, and jobs.</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
                  {(Object.entries(DATA_TYPES) as [DataType, DataTypeConfig][]).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => { setDataType(key); setStep('upload'); }}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '20px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s', fontFamily: FF }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = cfg.color)}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
                    >
                      <div style={{ width: '46px', height: '46px', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {ICONS[key]}
                      </div>
                      <div>
                        <p style={{ fontWeight: '700', color: '#111', fontSize: '14px', margin: '0 0 4px' }}>{cfg.label}</p>
                        <p style={{ color: '#6b7280', fontSize: '12px', margin: 0, lineHeight: '1.5' }}>{cfg.description}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '14px 16px', display: 'flex', gap: '12px' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: '1px' }}><circle cx="8" cy="8" r="7" stroke="#0369a1" strokeWidth="1.5"/><path d="M8 7v5M8 5h.01" stroke="#0369a1" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  <p style={{ color: '#0369a1', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>
                    <strong>Clients are automatic.</strong> Every customer name from your imported quotes, invoices, and jobs will appear in your Clients section — no separate import needed.
                  </p>
                </div>
              </div>
            )}

            {/* ── STEP 2: UPLOAD ── */}
            {step === 'upload' && config && (
              <div>
                <button onClick={() => setStep('choose')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#6b7280', fontSize: '13px', cursor: 'pointer', padding: 0, marginBottom: '20px', fontFamily: FF }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  Back
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <div style={{ width: '32px', height: '32px', background: config.bg, border: `1px solid ${config.border}`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {ICONS[dataType!]}
                  </div>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#111', margin: 0 }}>Upload your {config.label} file</h2>
                </div>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 24px' }}>Upload a CSV or Excel file. The columns don't need to be in any specific order — you'll map them in the next step.</p>

                {error && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#991b1b', fontSize: '13px' }}>{error}</div>
                )}

                {/* Drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ border: `2px dashed ${dragging ? config.color : '#d1d5db'}`, borderRadius: '14px', padding: '48px 24px', textAlign: 'center', cursor: 'pointer', background: dragging ? config.bg : 'white', transition: 'all 0.15s' }}
                >
                  <div style={{ width: '52px', height: '52px', background: config.bg, border: `1px solid ${config.border}`, borderRadius: '14px', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 16V8M12 8l-3 3M12 8l3 3" stroke={config.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke={config.color} strokeWidth="1.8" strokeLinecap="round"/></svg>
                  </div>
                  <p style={{ fontWeight: '700', color: '#111', fontSize: '15px', margin: '0 0 6px' }}>Drop your file here or click to browse</p>
                  <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>Supports CSV and Excel (.xlsx)</p>
                </div>
                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls,.txt" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) void processFile(f); e.target.value = ''; }} />

                {/* Template download */}
                <div style={{ marginTop: '20px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <p style={{ fontWeight: '600', color: '#111', fontSize: '14px', margin: '0 0 2px' }}>Not sure about the format?</p>
                    <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>Download a template CSV with the exact headers TradeDesk expects</p>
                  </div>
                  <button onClick={() => downloadTemplate(config, config.label)} style={{ flexShrink: 0, padding: '9px 18px', background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', fontFamily: FF }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v8M7 10l-2.5-2.5M7 10l2.5-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    Template CSV
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: MAP COLUMNS ── */}
            {step === 'map' && config && (
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#111', margin: '0 0 4px' }}>Map your columns</h2>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 6px' }}>
                  File: <strong style={{ color: '#111' }}>{fileName}</strong> — {fileRows.length.toLocaleString()} rows detected
                </p>
                {mappingIssues.length > 0 && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#991b1b' }}>
                    Required fields not yet mapped: <strong>{mappingIssues.map(f => f.label).join(', ')}</strong>
                  </div>
                )}
                <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 16px' }}>We auto-matched what we could. Use the dropdowns to fix any mismatches.</p>

                <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
                  <div style={{ padding: '12px 20px', borderBottom: '1px solid #f3f4f6', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>TradeDesk Field</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Your File Column</span>
                  </div>
                  {config.fields.map((field, i) => {
                    const matched = !!mapping[field.key];
                    return (
                      <div key={field.key} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '12px 20px', alignItems: 'center', borderBottom: i < config.fields.length - 1 ? '1px solid #f9fafb' : 'none', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {field.required && (
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: matched ? '#16a34a' : '#dc2626', flexShrink: 0, display: 'inline-block' }} />
                          )}
                          <span style={{ fontSize: '13px', fontWeight: field.required ? '700' : '500', color: '#111' }}>
                            {field.label}
                            {field.required && <span style={{ color: '#dc2626', marginLeft: '2px' }}>*</span>}
                          </span>
                        </div>
                        <select
                          value={mapping[field.key] || ''}
                          onChange={e => setMapping(m => ({ ...m, [field.key]: e.target.value }))}
                          style={{ padding: '7px 10px', border: `1px solid ${matched ? '#bbf7d0' : field.required ? '#fecaca' : '#e5e7eb'}`, borderRadius: '7px', fontSize: '13px', color: '#111', background: matched ? '#f0fdf4' : field.required && !matched ? '#fef2f2' : '#f9fafb', cursor: 'pointer' }}
                        >
                          <option value="">— Skip this field —</option>
                          {fileHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setStep('preview')}
                    disabled={mappingIssues.length > 0}
                    style={{ padding: '11px 28px', background: mappingIssues.length > 0 ? '#d1d5db' : '#111', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: mappingIssues.length > 0 ? 'not-allowed' : 'pointer', fontFamily: FF }}
                  >
                    Preview import
                  </button>
                  <button onClick={() => setStep('upload')} style={{ padding: '11px 20px', background: 'white', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', fontFamily: FF }}>
                    Back
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 4: PREVIEW ── */}
            {step === 'preview' && config && (
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#111', margin: '0 0 4px' }}>Preview your import</h2>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 20px' }}>
                  Showing first {previewRows.length} of <strong>{fileRows.length.toLocaleString()}</strong> rows. Review before confirming.
                </p>

                <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                          {config.fields.filter(f => mapping[f.key]).map(f => (
                            <th key={f.key} style={{ padding: '9px 14px', textAlign: 'left', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' as const, letterSpacing: '0.4px', whiteSpace: 'nowrap' as const }}>
                              {f.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row, i) => {
                          const mapped = getMappedRow(row, fileHeaders, mapping);
                          return (
                            <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                              {config.fields.filter(f => mapping[f.key]).map(f => (
                                <td key={f.key} style={{ padding: '9px 14px', color: mapped[f.key] ? '#111' : '#d1d5db', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                                  {mapped[f.key] || '—'}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {fileRows.length > 8 && (
                    <div style={{ padding: '10px 16px', borderTop: '1px solid #f3f4f6', color: '#9ca3af', fontSize: '12px', textAlign: 'center' }}>
                      +{fileRows.length - 8} more rows not shown
                    </div>
                  )}
                </div>

                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8l4 4 8-8" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <p style={{ color: '#15803d', fontSize: '14px', margin: 0, fontWeight: '600' }}>{fileRows.length.toLocaleString()} rows ready to import into {config.label}</p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={runImport} style={{ padding: '11px 28px', background: config.color, color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', boxShadow: `0 4px 14px ${config.color}33`, fontFamily: FF }}>
                    Import {fileRows.length.toLocaleString()} rows
                  </button>
                  <button onClick={() => setStep('map')} style={{ padding: '11px 20px', background: 'white', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', fontFamily: FF }}>
                    Back
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 5: IMPORTING ── */}
            {step === 'importing' && (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ width: '64px', height: '64px', border: '3px solid #f3f4f6', borderTop: '3px solid #16a34a', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 24px' }} />
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#111', margin: '0 0 10px' }}>Importing your data...</h2>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 28px' }}>Please don't close this page</p>
                <div style={{ maxWidth: '320px', margin: '0 auto' }}>
                  <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: '#16a34a', borderRadius: '3px', transition: 'width 0.3s ease' }} />
                  </div>
                  <p style={{ color: '#9ca3af', fontSize: '13px', margin: '8px 0 0' }}>{progress}% complete</p>
                </div>
              </div>
            )}

            {/* ── STEP 6: DONE ── */}
            {step === 'done' && result && config && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ width: '72px', height: '72px', background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <svg width="32" height="26" viewBox="0 0 32 26" fill="none"><path d="M2 13l9 9L30 2" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#111', letterSpacing: '-1px', margin: '0 0 10px' }}>Import complete</h2>
                <p style={{ color: '#6b7280', fontSize: '15px', margin: '0 0 32px' }}>
                  <strong style={{ color: '#16a34a' }}>{result.imported.toLocaleString()}</strong> records imported
                  {result.skipped > 0 && <>, <strong style={{ color: '#9ca3af' }}>{result.skipped}</strong> skipped (missing required fields)</>}
                </p>

                {result.errors.length > 0 && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '14px 18px', marginBottom: '24px', textAlign: 'left', maxWidth: '480px', margin: '0 auto 24px' }}>
                    <p style={{ color: '#991b1b', fontSize: '13px', fontWeight: '700', margin: '0 0 6px' }}>Some rows had issues:</p>
                    {result.errors.slice(0, 5).map((e, i) => <p key={i} style={{ color: '#991b1b', fontSize: '12px', margin: '0 0 2px' }}>{e}</p>)}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' as const }}>
                  <a href={config.href} style={{ padding: '12px 28px', background: config.color, color: 'white', borderRadius: '8px', fontWeight: '700', fontSize: '15px', textDecoration: 'none', boxShadow: `0 4px 14px ${config.color}33` }}>
                    View {config.label}
                  </a>
                  <button
                    onClick={() => { setStep('choose'); setDataType(null); setFileHeaders([]); setFileRows([]); setMapping({}); setFileName(''); setResult(null); setError(''); }}
                    style={{ padding: '12px 24px', background: 'white', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', fontWeight: '600', fontSize: '15px', cursor: 'pointer', fontFamily: FF }}
                  >
                    Import more data
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
