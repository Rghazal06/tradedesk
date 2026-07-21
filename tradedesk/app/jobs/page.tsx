'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Sidebar from '../../components/Sidebar';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  scheduled:    { bg: '#fefce8', color: '#854d0e', border: '#fde047' },
  'in progress':{ bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  completed:    { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  cancelled:    { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
};

interface Job {
  id: string; title: string; customer_name: string; customer_phone: string;
  scheduled_date: string; scheduled_time?: string; estimated_hours?: number;
  status: string; notes: string; photos?: string[]; share_token?: string | null;
}
interface JobReceipt { id: string; merchant: string; amount: number; date: string; category: string; }
interface Quote { subtotal: number; total: number; status: string; }

export default function JobsPage() {
  const router = useRouter();
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const imgRef     = useRef<HTMLImageElement>(null);
  const mediaRef   = useRef<MediaRecorder | null>(null);
  const chunksRef  = useRef<Blob[]>([]);
  const drawingRef = useRef(false);

  // Core state
  const [jobs, setJobs]           = useState<Job[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [message, setMessage]     = useState('');
  const [userId, setUserId]       = useState('');
  const [contractorName, setContractorName] = useState('');
  const [googleReviewLink, setGoogleReviewLink] = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [costingJobId, setCostingJobId]   = useState<string | null>(null);
  const [jobReceipts, setJobReceipts] = useState<Record<string, JobReceipt[]>>({});
  const [jobQuotes, setJobQuotes]     = useState<Record<string, Quote | null>>({});
  const [uploadingJobId, setUploadingJobId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', customer_name: '', customer_phone: '', scheduled_date: '', scheduled_time: '', estimated_hours: '', notes: '' });

  // Lightbox state
  const [lightbox, setLightbox]     = useState<{ jobId: string; idx: number } | null>(null);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [drawColor, setDrawColor]   = useState('#ef4444');
  const [annotSaved, setAnnotSaved] = useState(false);

  // Voice note state
  const [voiceJobId, setVoiceJobId]     = useState<string | null>(null);
  const [isRecording, setIsRecording]   = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [pendingNote, setPendingNote]   = useState('');
  const [savingNote, setSavingNote]     = useState(false);

  // Share state
  const [shareJobId, setShareJobId]       = useState<string | null>(null);
  const [shareLink, setShareLink]         = useState('');
  const [generatingShare, setGeneratingShare] = useState(false);
  const [copied, setCopied]               = useState(false);

  // Report state
  const [generatingReportId, setGeneratingReportId] = useState<string | null>(null);

  useEffect(() => { loadJobs(); }, []);

  async function loadJobs() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUserId(user.id);
    const { data: profile } = await supabase.from('profiles').select('google_review_link, company_name, full_name').eq('id', user.id).single();
    if (profile) {
      setGoogleReviewLink(profile.google_review_link || '');
      setContractorName(profile.company_name || profile.full_name || 'Your Contractor');
    }
    const { data } = await supabase.from('jobs').select('*').eq('user_id', user.id).order('scheduled_date', { ascending: true });
    setJobs(data || []);
    setLoading(false);
  }

  function flash(msg: string) { setMessage(msg); setTimeout(() => setMessage(''), 4000); }

  async function saveJob() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('jobs').insert({
      user_id: user.id,
      title: form.title, customer_name: form.customer_name, customer_phone: form.customer_phone,
      scheduled_date: form.scheduled_date || null,
      scheduled_time: form.scheduled_time || null,
      estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : null,
      notes: form.notes,
      status: 'scheduled',
    });
    if (error) flash('Error creating job.');
    else { flash('Job created!'); setForm({ title: '', customer_name: '', customer_phone: '', scheduled_date: '', scheduled_time: '', estimated_hours: '', notes: '' }); setShowForm(false); loadJobs(); }
    setSaving(false);
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('jobs').update({ status }).eq('id', id);
    loadJobs();
  }

  async function completeAndRequestReview(job: Job) {
    await updateStatus(job.id, 'completed');
    if (job.customer_phone) {
      const res = await fetch('/api/send-review-request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerPhone: job.customer_phone, customerName: job.customer_name, contractorName, googleReviewLink: googleReviewLink || 'https://g.page/r/review' }),
      });
      const d = await res.json();
      flash(d.success ? 'Job completed! Review request sent.' : 'Job completed. Could not send SMS.');
    } else { flash('Job completed!'); }
  }

  async function uploadPhoto(jobId: string, file: File) {
    setUploadingJobId(jobId);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('jobId', jobId);
    const res = await fetch('/api/upload-job-photo', { method: 'POST', body: fd });
    const d = await res.json();
    if (d.success) loadJobs();
    else flash('Upload failed.');
    setUploadingJobId(null);
  }

  async function deleteJob(id: string) {
    if (!confirm('Delete this job? This cannot be undone.')) return;
    await supabase.from('jobs').delete().eq('id', id);
    loadJobs();
  }

  async function deletePhoto(jobId: string, url: string) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    await supabase.from('jobs').update({ photos: (job.photos || []).filter(p => p !== url) }).eq('id', jobId);
    loadJobs();
  }

  async function toggleCosting(jobId: string) {
    if (costingJobId === jobId) { setCostingJobId(null); return; }
    setCostingJobId(jobId);
    if (!jobReceipts[jobId]) {
      const { data: r } = await supabase.from('receipts').select('id, merchant, amount, date, category').eq('job_id', jobId).order('date', { ascending: false });
      setJobReceipts(prev => ({ ...prev, [jobId]: r || [] }));
    }
    if (!(jobId in jobQuotes)) {
      const job = jobs.find(j => j.id === jobId);
      if (job) {
        const { data: q } = await supabase.from('quotes').select('subtotal, total, status').eq('user_id', userId).eq('customer_name', job.customer_name).order('created_at', { ascending: false }).limit(1);
        setJobQuotes(prev => ({ ...prev, [jobId]: q?.[0] || null }));
      }
    }
  }

  // ─── Lightbox ────────────────────────────────────────────
  const lbJob   = lightbox ? jobs.find(j => j.id === lightbox.jobId) : null;
  const lbPhoto = lbJob?.photos?.[lightbox?.idx ?? 0] ?? '';

  function openLightbox(jobId: string, idx: number) {
    setLightbox({ jobId, idx });
    setIsAnnotating(false);
    setAnnotSaved(false);
  }
  function closeLightbox() {
    setLightbox(null);
    setIsAnnotating(false);
    clearCanvas();
  }
  function lightboxNav(dir: number) {
    if (!lightbox || !lbJob?.photos?.length) return;
    const next = (lightbox.idx + dir + lbJob.photos.length) % lbJob.photos.length;
    setLightbox({ ...lightbox, idx: next });
    setIsAnnotating(false);
    clearCanvas();
  }

  // ─── Annotation canvas ─────────────────────────────────
  function clearCanvas() {
    const c = canvasRef.current;
    if (c) c.getContext('2d')?.clearRect(0, 0, c.width, c.height);
  }
  function syncCanvas() {
    const img = imgRef.current;
    const c   = canvasRef.current;
    if (img && c) {
      const r = img.getBoundingClientRect();
      c.width  = r.width;
      c.height = r.height;
    }
  }
  function getPos(e: React.MouseEvent<HTMLCanvasElement>) {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isAnnotating) return;
    drawingRef.current = true;
    const p = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) { ctx.beginPath(); ctx.moveTo(p.x, p.y); }
  }
  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isAnnotating || !drawingRef.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const p = getPos(e);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth   = 3.5;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }
  function onMouseUp() { drawingRef.current = false; }

  async function saveAnnotation() {
    if (!lightbox || !canvasRef.current || !imgRef.current) return;
    const img = imgRef.current;
    const out = document.createElement('canvas');
    out.width  = img.naturalWidth;
    out.height = img.naturalHeight;
    const ctx  = out.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, out.width, out.height);
    ctx.drawImage(canvasRef.current, 0, 0, out.width, out.height);
    out.toBlob(async blob => {
      if (!blob) return;
      const file = new File([blob], `annotated-${Date.now()}.jpg`, { type: 'image/jpeg' });
      await uploadPhoto(lightbox.jobId, file);
      setAnnotSaved(true);
      setIsAnnotating(false);
      closeLightbox();
      flash('Annotated photo saved!');
    }, 'image/jpeg', 0.92);
  }

  // ─── Voice Notes ───────────────────────────────────────
  async function startVoiceNote(jobId: string) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = e => chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setTranscribing(true);
        const fd = new FormData();
        fd.append('audio', blob, 'note.webm');
        fd.append('jobId', jobId);
        const res = await fetch('/api/transcribe-voice', { method: 'POST', body: fd });
        const d = await res.json();
        setTranscribing(false);
        if (d.text) { setPendingNote(d.text); }
        else { flash('Could not transcribe audio.'); setVoiceJobId(null); }
      };
      rec.start();
      mediaRef.current = rec;
      setVoiceJobId(jobId);
      setIsRecording(true);
    } catch {
      flash('Microphone access denied.');
    }
  }
  function stopVoiceNote() { mediaRef.current?.stop(); setIsRecording(false); }
  async function saveVoiceNote(jobId: string) {
    setSavingNote(true);
    const job = jobs.find(j => j.id === jobId);
    const dateStr = new Date().toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
    const appended = `[${dateStr}] ${pendingNote}`;
    const combined = job?.notes ? `${job.notes}\n${appended}` : appended;
    await supabase.from('jobs').update({ notes: combined }).eq('id', jobId);
    setSavingNote(false); setPendingNote(''); setVoiceJobId(null);
    loadJobs(); flash('Voice note saved!');
  }
  function discardVoiceNote() { setPendingNote(''); setVoiceJobId(null); }

  // ─── Share Link ────────────────────────────────────────
  async function openShare(job: Job) {
    setShareJobId(job.id); setGeneratingShare(true); setCopied(false); setShareLink('');
    if (job.share_token) {
      setShareLink(`${window.location.origin}/share/${job.share_token}`);
      setGeneratingShare(false); return;
    }
    const res  = await fetch(`/api/jobs/${job.id}/share-token`, { method: 'POST' });
    const data = await res.json();
    if (data.token) { setShareLink(`${window.location.origin}/share/${data.token}`); loadJobs(); }
    else { flash('Could not generate share link.'); setShareJobId(null); }
    setGeneratingShare(false);
  }
  function copyLink() { navigator.clipboard.writeText(shareLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }

  // ─── Report ────────────────────────────────────────────
  async function generateReport(job: Job) {
    // Open the window synchronously (within the user gesture) so browsers don't block it
    const w = window.open('', '_blank');
    if (!w) { flash('Allow pop-ups for this site to view reports.'); return; }
    w.document.write('<html><head><title>Generating report...</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;color:#6b7280;">Generating report, please wait...</body></html>');
    setGeneratingReportId(job.id);
    try {
      const res  = await fetch('/api/generate-job-report', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      });
      const data = await res.json();
      if (data.html) {
        w.document.open();
        w.document.write(data.html);
        w.document.close();
      } else {
        w.close();
        flash('Could not generate report.');
      }
    } catch {
      w.close();
      flash('Could not generate report.');
    } finally {
      setGeneratingReportId(null);
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f4', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <style>{`
        @media (max-width: 768px) {
          .jobs-topbar { padding: 14px 16px !important; }
          .jobs-body { padding: 16px !important; }
          .jobs-form-grid { grid-template-columns: 1fr !important; }
          .jobs-form-grid > [style*="span 2"] { grid-column: span 1 !important; }
          .jobs-table-wrap { overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; }
          .jobs-expanded { padding: 16px !important; }
          .jobs-expanded-grid { grid-template-columns: 1fr !important; }
          .jobs-photos-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>
      <Sidebar activePath="/jobs" />

      {/* ── Lightbox ── */}
      {lightbox && lbPhoto && (
        <div
          onClick={e => { if (e.target === e.currentTarget) closeLightbox(); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.93)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
        >
          {/* Top bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)', zIndex: 10 }}>
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', fontWeight: '600' }}>
              {lbJob?.title} &mdash; Photo {(lightbox.idx) + 1} of {lbJob?.photos?.length}
            </span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {isAnnotating ? (
                <>
                  {['#ef4444','#f59e0b','#22c55e','#ffffff','#3b82f6'].map(c => (
                    <button key={c} onClick={() => setDrawColor(c)} style={{ width: '20px', height: '20px', borderRadius: '50%', background: c, border: drawColor === c ? '2px solid white' : '2px solid rgba(255,255,255,0.3)', cursor: 'pointer', flexShrink: 0 }} />
                  ))}
                  <button onClick={clearCanvas} style={{ padding: '5px 10px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '6px', color: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Clear</button>
                  <button onClick={saveAnnotation} style={{ padding: '5px 12px', background: '#16a34a', border: 'none', borderRadius: '6px', color: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Save Annotation</button>
                  <button onClick={() => { setIsAnnotating(false); clearCanvas(); }} style={{ padding: '5px 10px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: 'white', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                </>
              ) : (
                <>
                  <button onClick={() => { setIsAnnotating(true); syncCanvas(); }} style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', color: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                    Annotate
                  </button>
                  <a href={lbPhoto} download={`photo-${Date.now()}.jpg`} target="_blank" rel="noreferrer" style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', color: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}>
                    Download
                  </a>
                  <button onClick={() => deletePhoto(lightbox.jobId, lbPhoto).then(closeLightbox)} style={{ padding: '5px 10px', background: 'rgba(220,38,38,0.3)', border: '1px solid rgba(220,38,38,0.5)', borderRadius: '6px', color: '#fca5a5', fontSize: '12px', cursor: 'pointer' }}>Delete</button>
                </>
              )}
              <button onClick={closeLightbox} style={{ width: '30px', height: '30px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', color: 'white', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>×</button>
            </div>
          </div>

          {/* Nav arrows */}
          {(lbJob?.photos?.length ?? 0) > 1 && (
            <>
              <button onClick={() => lightboxNav(-1)} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '42px', height: '42px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', color: 'white', fontSize: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>‹</button>
              <button onClick={() => lightboxNav(1)}  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', width: '42px', height: '42px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', color: 'white', fontSize: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>›</button>
            </>
          )}

          {/* Image + canvas */}
          <div style={{ position: 'relative', display: 'inline-block', maxWidth: '88vw', maxHeight: '78vh' }}>
            <img
              ref={imgRef}
              src={lbPhoto}
              alt="Job photo"
              onLoad={syncCanvas}
              draggable={false}
              style={{ maxWidth: '88vw', maxHeight: '78vh', objectFit: 'contain', borderRadius: '4px', display: 'block', userSelect: 'none' }}
            />
            <canvas
              ref={canvasRef}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: isAnnotating ? 'crosshair' : 'default', pointerEvents: isAnnotating ? 'auto' : 'none', borderRadius: '4px' }}
            />
            {isAnnotating && (
              <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.65)', color: 'white', fontSize: '11px', padding: '4px 10px', borderRadius: '20px', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                Draw on the photo — then click Save Annotation
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {(lbJob?.photos?.length ?? 0) > 1 && (
            <div style={{ position: 'absolute', bottom: '14px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '6px', padding: '0 60px', overflowX: 'auto' }}>
              {lbJob!.photos!.map((url, i) => (
                <button key={i} onClick={() => { setLightbox({ ...lightbox!, idx: i }); setIsAnnotating(false); clearCanvas(); }} style={{ width: '48px', height: '48px', flexShrink: 0, padding: 0, border: `2px solid ${i === lightbox.idx ? '#16a34a' : 'rgba(255,255,255,0.2)'}`, borderRadius: '6px', cursor: 'pointer', overflow: 'hidden', background: 'none' }}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Share Modal ── */}
      {shareJobId && (
        <div onClick={e => { if (e.target === e.currentTarget) { setShareJobId(null); setShareLink(''); } }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', width: '460px', maxWidth: '90vw', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '700', color: '#111' }}>Share Job Progress</h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#6b7280', lineHeight: 1.6 }}>Send this link to your customer — they can view job photos and progress without logging in.</p>
            {generatingShare ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '14px' }}>Generating link...</div>
            ) : shareLink ? (
              <>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input readOnly value={shareLink} onClick={e => (e.target as HTMLInputElement).select()}
                    style={{ flex: 1, padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', color: '#374151', background: '#f9fafb', boxSizing: 'border-box', minWidth: 0 }} />
                  <button onClick={copyLink} style={{ padding: '10px 16px', background: copied ? '#16a34a' : '#111', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#9ca3af', lineHeight: 1.5 }}>Anyone with this link can view photos. The link is permanent and does not expire.</p>
              </>
            ) : null}
            <button onClick={() => { setShareJobId(null); setShareLink(''); }} style={{ width: '100%', padding: '10px', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontSize: '14px', color: '#374151', fontWeight: '600', cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}

      {/* ── Voice Note Modal ── */}
      {voiceJobId && pendingNote && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', width: '460px', maxWidth: '90vw', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '700', color: '#111' }}>Voice Note Transcribed</h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6b7280' }}>Review and edit before saving to the job.</p>
            <textarea
              value={pendingNote}
              onChange={e => setPendingNote(e.target.value)}
              style={{ width: '100%', minHeight: '100px', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: 1.6 }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button onClick={() => saveVoiceNote(voiceJobId)} disabled={savingNote} style={{ flex: 1, padding: '10px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', opacity: savingNote ? 0.7 : 1 }}>
                {savingNote ? 'Saving...' : 'Save Note'}
              </button>
              <button onClick={discardVoiceNote} style={{ flex: 1, padding: '10px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Discard</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div className="jobs-topbar" style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: 0 }}>Jobs</h1>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '2px 0 0' }}>Manage and document all your jobs</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: '#16a34a', color: 'white', borderRadius: '8px', fontWeight: '600', fontSize: '14px', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(22,163,74,0.3)' }}>
            + Create Job
          </button>
        </div>

        <div className="jobs-body" style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
          {message && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#15803d', fontSize: '14px' }}>{message}</div>
          )}

          {/* Create Form */}
          {showForm && (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111', margin: '0 0 20px' }}>Create New Job</h2>
              <div className="jobs-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {[
                  { label: 'Job Title', key: 'title', placeholder: 'Kitchen rewire' },
                  { label: 'Customer Name', key: 'customer_name', placeholder: 'John Smith' },
                  { label: 'Customer Phone', key: 'customer_phone', placeholder: '519-555-0000' },
                  { label: 'Scheduled Date', key: 'scheduled_date', placeholder: '', type: 'date' },
                  { label: 'Start Time', key: 'scheduled_time', placeholder: '', type: 'time' },
                  { label: 'Estimated Hours', key: 'estimated_hours', placeholder: '2.5', type: 'number' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.label}</label>
                    <input type={f.type || 'text'} value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111', background: '#f9fafb', boxSizing: 'border-box' }} />
                  </div>
                ))}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notes</label>
                  <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any initial notes..."
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111', background: '#f9fafb', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button onClick={saveJob} disabled={saving} style={{ padding: '10px 24px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Creating...' : 'Create Job'}
                </button>
                <button onClick={() => setShowForm(false)} style={{ padding: '10px 24px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Jobs table */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
              <h2 style={{ color: '#111', fontSize: '15px', fontWeight: '700', margin: 0 }}>All Jobs</h2>
            </div>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
            ) : jobs.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
                <p style={{ margin: '0 0 6px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>No jobs yet</p>
                <p style={{ margin: '0 0 20px', fontSize: '13px' }}>Track your jobs and document them with photos</p>
                <button onClick={() => setShowForm(true)} style={{ background: '#16a34a', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>Create your first job</button>
              </div>
            ) : (
              <div className="jobs-table-wrap" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      {['Job', 'Customer', 'Date', 'Status', 'Photos', 'Costing', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#6b7280', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map(job => {
                      const ss = STATUS_STYLES[job.status] || { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' };
                      const pc = job.photos?.length || 0;
                      const isExp  = expandedJobId === job.id;
                      const isCost = costingJobId  === job.id;
                      return (
                        <React.Fragment key={job.id}>
                          <tr style={{ borderBottom: (isExp || isCost) ? 'none' : '1px solid #f9fafb', background: (isExp || isCost) ? '#fafafa' : 'white' }}>
                            <td style={{ padding: '13px 16px', maxWidth: '180px' }}>
                              <div style={{ fontWeight: '600', fontSize: '14px', color: '#111' }}>{job.title}</div>
                              {job.notes && <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.notes.split('\n')[0]}</div>}
                            </td>
                            <td style={{ padding: '13px 16px' }}>
                              <div style={{ fontSize: '14px', color: '#374151' }}>{job.customer_name}</div>
                              {job.customer_phone && <div style={{ fontSize: '11px', color: '#9ca3af' }}>{job.customer_phone}</div>}
                            </td>
                            <td style={{ padding: '13px 16px', color: '#374151', fontSize: '13px', whiteSpace: 'nowrap' }}>
                              {job.scheduled_date ? new Date(job.scheduled_date + 'T00:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                            </td>
                            <td style={{ padding: '13px 16px' }}>
                              <span style={{ background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, borderRadius: '100px', padding: '3px 10px', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                                {job.status}
                              </span>
                            </td>
                            {/* Photos cell with mini previews */}
                            <td style={{ padding: '13px 16px' }}>
                              <button onClick={() => setExpandedJobId(isExp ? null : job.id)}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', background: isExp ? '#f0fdf4' : '#f3f4f6', border: `1px solid ${isExp ? '#bbf7d0' : '#e5e7eb'}`, borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', color: isExp ? '#16a34a' : '#374151' }}>
                                {pc > 0 ? (
                                  <div style={{ display: 'flex', gap: '2px' }}>
                                    {job.photos!.slice(0, 3).map((u, i) => (
                                      <img key={i} src={u} alt="" style={{ width: '20px', height: '20px', objectFit: 'cover', borderRadius: '3px' }} />
                                    ))}
                                  </div>
                                ) : (
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="2" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/><circle cx="4" cy="5.5" r="1" fill="currentColor"/><path d="M1 9 3.5 7l2 1.5L8 6l4 3.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
                                )}
                                {pc}
                              </button>
                            </td>
                            <td style={{ padding: '13px 16px' }}>
                              <button onClick={() => toggleCosting(job.id)}
                                style={{ padding: '5px 10px', background: isCost ? '#f0fdf4' : '#f3f4f6', border: `1px solid ${isCost ? '#bbf7d0' : '#e5e7eb'}`, borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', color: isCost ? '#16a34a' : '#374151' }}>
                                Costing
                              </button>
                            </td>
                            <td style={{ padding: '13px 16px' }}>
                              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                {job.status === 'scheduled' && (
                                  <button onClick={() => updateStatus(job.id, 'in progress')} style={{ padding: '5px 9px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>Start</button>
                                )}
                                {job.status === 'in progress' && (
                                  <button onClick={() => completeAndRequestReview(job)} style={{ padding: '5px 9px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>Complete</button>
                                )}
                                <button onClick={() => generateReport(job)} disabled={generatingReportId === job.id} style={{ padding: '5px 9px', background: '#faf5ff', color: '#7c3aed', border: '1px solid #ddd6fe', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', opacity: generatingReportId === job.id ? 0.6 : 1 }}>
                                  {generatingReportId === job.id ? '...' : 'Report'}
                                </button>
                                <button onClick={() => openShare(job)} style={{ padding: '5px 9px', background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>Share</button>
                                <button onClick={() => deleteJob(job.id)} style={{ padding: '5px 9px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Delete</button>
                              </div>
                            </td>
                          </tr>

                          {/* Photo Gallery Row */}
                          {isExp && (
                            <tr style={{ borderBottom: '1px solid #f9fafb' }}>
                              <td colSpan={7} style={{ padding: '0 16px 16px', background: '#fafafa' }}>
                                <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>Job Photos & Notes</span>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                      {transcribing && voiceJobId === job.id ? (
                                        <span style={{ fontSize: '12px', color: '#6b7280', padding: '6px 12px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>Transcribing...</span>
                                      ) : isRecording && voiceJobId === job.id ? (
                                        <button onClick={stopVoiceNote} style={{ padding: '6px 12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
                                          Stop Recording
                                        </button>
                                      ) : (
                                        <button onClick={() => startVoiceNote(job.id)} style={{ padding: '6px 12px', background: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="4" y="1" width="4" height="6" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M2 6.5a4 4 0 0 0 8 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="6" y1="10.5" x2="6" y2="11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                                          Voice Note
                                        </button>
                                      )}
                                      <label style={{ padding: '6px 12px', background: '#16a34a', color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                        {uploadingJobId === job.id ? 'Uploading...' : '+ Add Photo'}
                                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(job.id, f); e.target.value = ''; }} />
                                      </label>
                                    </div>
                                  </div>

                                  {/* Notes */}
                                  {job.notes && (
                                    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px' }}>
                                      <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Notes</p>
                                      <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{job.notes}</p>
                                    </div>
                                  )}

                                  {/* Photo grid */}
                                  {pc === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '28px 0', color: '#9ca3af' }}>
                                      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ margin: '0 auto 10px', display: 'block' }}><rect x="2" y="5" width="32" height="26" rx="3" stroke="#d1d5db" strokeWidth="1.5"/><circle cx="11" cy="15" r="4" stroke="#d1d5db" strokeWidth="1.5"/><path d="M2 27 10 19l5 5 7-8 12 11" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round"/></svg>
                                      <p style={{ margin: '0 0 3px', fontSize: '14px', fontWeight: '600', color: '#6b7280' }}>No photos yet</p>
                                      <p style={{ margin: 0, fontSize: '12px' }}>Add before/after shots to document this job</p>
                                    </div>
                                  ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' }}>
                                      {job.photos!.map((url, i) => (
                                        <div key={i} onClick={() => openLightbox(job.id, i)} style={{ position: 'relative', paddingBottom: '100%', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', border: '2px solid transparent', transition: 'border-color 0.15s' }}
                                          onMouseEnter={e => (e.currentTarget.style.borderColor = '#16a34a')}
                                          onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}>
                                          <img src={url} alt={`Photo ${i + 1}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                                          {i === 0 && pc > 1 && <span style={{ position: 'absolute', top: '5px', left: '5px', background: '#15803d', color: 'white', fontSize: '9px', fontWeight: '700', padding: '2px 5px', borderRadius: '3px' }}>BEFORE</span>}
                                          {i === pc - 1 && pc > 1 && <span style={{ position: 'absolute', top: '5px', left: '5px', background: '#1d4ed8', color: 'white', fontSize: '9px', fontWeight: '700', padding: '2px 5px', borderRadius: '3px' }}>AFTER</span>}
                                          <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '9px', padding: '2px 5px', borderRadius: '3px' }}>{i + 1}</div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}

                          {/* Costing Row */}
                          {isCost && (() => {
                            const receipts = jobReceipts[job.id] || [];
                            const quote    = jobQuotes[job.id];
                            const spend    = receipts.reduce((s, r) => s + (r.amount || 0), 0);
                            const quoted   = quote?.subtotal ?? null;
                            const diff     = quoted != null ? spend - quoted : null;
                            return (
                              <tr style={{ borderBottom: '1px solid #f9fafb' }}>
                                <td colSpan={7} style={{ padding: '0 16px 16px', background: '#fafafa' }}>
                                  <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>Job Costing</span>
                                      <a href="/receipts" style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600', textDecoration: 'none' }}>+ Link receipts in Receipts page</a>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
                                      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 14px' }}>
                                        <p style={{ color: '#9ca3af', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>Material Spend</p>
                                        <p style={{ color: '#111', fontSize: '18px', fontWeight: '800', margin: 0 }}>${spend.toFixed(2)}</p>
                                        <p style={{ color: '#9ca3af', fontSize: '11px', margin: '2px 0 0' }}>{receipts.length} receipt{receipts.length !== 1 ? 's' : ''}</p>
                                      </div>
                                      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 14px' }}>
                                        <p style={{ color: '#9ca3af', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>Quoted (subtotal)</p>
                                        <p style={{ color: '#111', fontSize: '18px', fontWeight: '800', margin: 0 }}>{quoted != null ? `$${quoted.toFixed(2)}` : '—'}</p>
                                        <p style={{ color: '#9ca3af', fontSize: '11px', margin: '2px 0 0' }}>{quote ? `Status: ${quote.status}` : 'No quote found'}</p>
                                      </div>
                                      <div style={{ background: diff != null && diff > 0 ? '#fef2f2' : diff != null && diff < 0 ? '#f0fdf4' : '#f9fafb', border: `1px solid ${diff != null && diff > 0 ? '#fecaca' : diff != null && diff < 0 ? '#bbf7d0' : '#e5e7eb'}`, borderRadius: '8px', padding: '12px 14px' }}>
                                        <p style={{ color: '#9ca3af', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>Over / Under</p>
                                        <p style={{ color: diff != null && diff > 0 ? '#dc2626' : diff != null && diff < 0 ? '#16a34a' : '#111', fontSize: '18px', fontWeight: '800', margin: 0 }}>
                                          {diff != null ? `${diff > 0 ? '+' : ''}$${diff.toFixed(2)}` : '—'}
                                        </p>
                                        <p style={{ color: '#9ca3af', fontSize: '11px', margin: '2px 0 0' }}>
                                          {diff != null && diff > 0 ? 'Over budget' : diff != null && diff < 0 ? 'Under budget' : 'Link quote to compare'}
                                        </p>
                                      </div>
                                    </div>
                                    {receipts.length > 0 ? (
                                      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                          <thead>
                                            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                              {['Merchant', 'Date', 'Category', 'Amount'].map(h => (
                                                <th key={h} style={{ padding: '8px 14px', textAlign: 'left', color: '#6b7280', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</th>
                                              ))}
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {receipts.map((r, i) => (
                                              <tr key={r.id} style={{ borderBottom: i < receipts.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                                                <td style={{ padding: '9px 14px', color: '#111', fontWeight: '500' }}>{r.merchant || 'Unknown'}</td>
                                                <td style={{ padding: '9px 14px', color: '#6b7280' }}>{r.date ? new Date(r.date + 'T12:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : '—'}</td>
                                                <td style={{ padding: '9px 14px', color: '#6b7280' }}>{r.category || '—'}</td>
                                                <td style={{ padding: '9px 14px', color: '#111', fontWeight: '700' }}>${r.amount?.toFixed(2)}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    ) : (
                                      <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>No receipts linked. Scan receipts and assign them to this job.</p>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })()}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
