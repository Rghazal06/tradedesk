import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { getAuthUser } from '../../../lib/apiAuth';
import { rateLimit } from '../../../lib/rateLimit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!rateLimit(`report-${user.id}`, 10, 60000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const { jobId } = await req.json();
    if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 });

    // Fetch job (verify ownership)
    const { data: job } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    // Fetch contractor profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_name, full_name, phone, email')
      .eq('id', user.id)
      .single();

    const contractorName = profile?.company_name || profile?.full_name || 'Your Contractor';
    const photos: string[] = job.photos || [];

    // Fetch linked receipts
    const { data: receipts } = await supabase
      .from('receipts')
      .select('merchant, amount, date, category')
      .eq('job_id', jobId)
      .order('date', { ascending: true });

    const totalMaterials = (receipts || []).reduce((s: number, r: any) => s + (r.amount || 0), 0);

    // Generate AI photo descriptions (up to 6 photos, low-detail for speed)
    let photoDescriptions: string[] = photos.map((_, i) => `Photo ${i + 1}`);
    if (photos.length > 0) {
      try {
        const content: OpenAI.Chat.ChatCompletionContentPart[] = [
          { type: 'text', text: `These are job site photos for the job titled "${job.title}" for customer ${job.customer_name}. For each photo in order, write ONE professional sentence describing what work or condition is shown. Respond with only a JSON array of strings, one per photo, like ["Description 1", "Description 2"].` },
          ...photos.slice(0, 6).map(url => ({
            type: 'image_url' as const,
            image_url: { url, detail: 'low' as const },
          })),
        ];
        const aiRes = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content }],
          max_tokens: 600,
          temperature: 0.3,
        });
        const raw = aiRes.choices[0].message.content || '[]';
        const match = raw.match(/\[[\s\S]*\]/);
        if (match) photoDescriptions = JSON.parse(match[0]);
      } catch {
        // Fall back to generic descriptions
      }
    }

    const reportDate = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
    const jobDate    = job.scheduled_date ? new Date(job.scheduled_date + 'T00:00:00').toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set';
    const statusMap: Record<string, string> = { scheduled: '#854d0e', 'in progress': '#1d4ed8', completed: '#15803d', cancelled: '#991b1b' };
    const statusColor = statusMap[job.status] || '#374151';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Job Report — ${job.title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #111; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { max-width: 820px; margin: 0 auto; padding: 52px 44px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 28px; border-bottom: 3px solid #16a34a; }
  .brand { font-size: 22px; font-weight: 900; letter-spacing: -0.8px; color: #111; }
  .brand span { color: #16a34a; }
  .contractor-sub { font-size: 13px; color: #6b7280; margin-top: 5px; line-height: 1.5; }
  .report-meta { text-align: right; }
  .report-meta p { font-size: 13px; color: #6b7280; margin-bottom: 3px; }
  .status-pill { display: inline-block; padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 700; text-transform: capitalize; color: ${statusColor}; background: ${statusColor}18; border: 1px solid ${statusColor}44; }
  h1 { font-size: 30px; font-weight: 800; letter-spacing: -0.5px; color: #111; margin-bottom: 6px; }
  .subtitle { font-size: 15px; color: #6b7280; margin-bottom: 36px; }
  .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 40px; }
  .info-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px 18px; }
  .info-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #9ca3af; margin-bottom: 5px; }
  .info-value { font-size: 15px; font-weight: 700; color: #111; line-height: 1.3; }
  .info-sub { font-size: 12px; color: #6b7280; margin-top: 3px; }
  .section-title { font-size: 14px; font-weight: 700; color: #374151; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb; text-transform: uppercase; letter-spacing: 0.5px; }
  .section { margin-bottom: 40px; }
  .photo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .photo-wrap { position: relative; }
  .photo-wrap img { width: 100%; height: 220px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb; display: block; }
  .photo-badge { display: inline-block; font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: 4px; margin-bottom: 7px; letter-spacing: 0.5px; }
  .badge-before { background: #dcfce7; color: #15803d; }
  .badge-after  { background: #dbeafe; color: #1d4ed8; }
  .photo-caption { font-size: 12px; color: #6b7280; margin-top: 7px; line-height: 1.5; }
  .notes-box { background: #f9fafb; border: 1px solid #e5e7eb; border-left: 3px solid #16a34a; border-radius: 0 8px 8px 0; padding: 18px 20px; font-size: 14px; color: #374151; line-height: 1.8; white-space: pre-line; }
  .checklist { list-style: none; }
  .checklist li { display: flex; align-items: center; gap: 10px; padding: 8px 0; font-size: 14px; color: #374151; border-bottom: 1px solid #f3f4f6; }
  .checklist li:last-child { border-bottom: none; }
  .check-icon { width: 16px; height: 16px; border-radius: 4px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; }
  .check-done { background: #16a34a; color: white; }
  .check-pending { background: white; border: 1.5px solid #d1d5db; }
  .checklist li.done span.item-text { color: #9ca3af; text-decoration: line-through; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f9fafb; padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
  td { padding: 10px 14px; font-size: 13px; color: #374151; border-bottom: 1px solid #f3f4f6; }
  .total-row td { font-weight: 700; color: #111; border-top: 2px solid #e5e7eb; border-bottom: none; background: #f9fafb; }
  .footer { margin-top: 52px; padding-top: 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
  .footer p { font-size: 11px; color: #9ca3af; }
  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .page { padding: 32px 28px; }
  }
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <div>
      <div class="brand">Trade<span>Desk</span></div>
      <div class="contractor-sub">
        <strong>${contractorName}</strong>
        ${profile?.phone ? `<br>${profile.phone}` : ''}
        ${profile?.email ? `<br>${profile.email}` : ''}
      </div>
    </div>
    <div class="report-meta">
      <p><strong>Job Completion Report</strong></p>
      <p>${reportDate}</p>
      <p style="margin-top: 8px;"><span class="status-pill">${job.status}</span></p>
    </div>
  </div>

  <h1>${job.title}</h1>
  <p class="subtitle">Prepared for <strong>${job.customer_name}</strong></p>

  <div class="info-grid">
    <div class="info-card">
      <div class="info-label">Customer</div>
      <div class="info-value">${job.customer_name}</div>
      ${job.customer_phone ? `<div class="info-sub">${job.customer_phone}</div>` : ''}
    </div>
    <div class="info-card">
      <div class="info-label">Job Date</div>
      <div class="info-value">${jobDate}</div>
    </div>
    <div class="info-card">
      <div class="info-label">Materials Total</div>
      <div class="info-value">$${totalMaterials.toFixed(2)}</div>
      <div class="info-sub">${(receipts || []).length} receipt${(receipts || []).length !== 1 ? 's' : ''} linked</div>
    </div>
  </div>

  ${photos.length > 0 ? `
  <div class="section">
    <div class="section-title">Job Site Photos</div>
    <div class="photo-grid">
      ${photos.map((url, i) => `
      <div class="photo-wrap">
        ${i === 0 && photos.length > 1 ? '<span class="photo-badge badge-before">BEFORE</span>' : i === photos.length - 1 && photos.length > 1 ? '<span class="photo-badge badge-after">AFTER</span>' : ''}
        <img src="${url}" alt="Job photo ${i + 1}" />
        <p class="photo-caption">${photoDescriptions[i] || `Photo ${i + 1}`}</p>
      </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  ${job.notes ? `
  <div class="section">
    <div class="section-title">Job Notes</div>
    <div class="notes-box">${job.notes}</div>
  </div>
  ` : ''}

  ${job.checklist && job.checklist.length > 0 ? `
  <div class="section">
    <div class="section-title">Job Checklist</div>
    <ul class="checklist">
      ${(job.checklist as { id: string; text: string; done: boolean }[]).map(item => `
      <li class="${item.done ? 'done' : ''}">
        <span class="check-icon ${item.done ? 'check-done' : 'check-pending'}">${item.done ? '✓' : ''}</span>
        <span class="item-text">${item.text}</span>
      </li>
      `).join('')}
    </ul>
  </div>
  ` : ''}

  ${receipts && receipts.length > 0 ? `
  <div class="section">
    <div class="section-title">Materials &amp; Expenses</div>
    <table>
      <thead>
        <tr>
          <th>Vendor</th>
          <th>Date</th>
          <th>Category</th>
          <th style="text-align:right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${(receipts as any[]).map((r: any) => `
        <tr>
          <td>${r.merchant || 'Unknown'}</td>
          <td>${r.date ? new Date(r.date + 'T12:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
          <td>${r.category || '—'}</td>
          <td style="text-align:right;font-weight:600">$${(r.amount || 0).toFixed(2)}</td>
        </tr>
        `).join('')}
        <tr class="total-row">
          <td colspan="3">Total Materials</td>
          <td style="text-align:right">$${totalMaterials.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  </div>
  ` : ''}

  <div class="footer">
    <p>Generated by TradeDesk &mdash; Business software for Ontario contractors</p>
    <p>${reportDate}</p>
  </div>
</div>
<script>
  window.addEventListener('load', function() {
    setTimeout(function() { window.print(); }, 400);
  });
</script>
</body>
</html>`;

    return NextResponse.json({ html });
  } catch (error) {
    console.error('generate-job-report error:', error);
    return NextResponse.json({ error: 'Report generation failed. Please try again.' }, { status: 500 });
  }
}
