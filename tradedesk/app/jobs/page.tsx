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
  scheduled: { bg: '#fefce8', color: '#854d0e', border: '#fde047' },
  'in progress': { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  completed: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  cancelled: { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
};

interface Job {
  id: string;
  title: string;
  customer_name: string;
  customer_phone: string;
  scheduled_date: string;
  status: string;
  notes: string;
  photos?: string[];
}

export default function JobsPage() {
  const router = useRouter();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [googleReviewLink, setGoogleReviewLink] = useState('');
  const [contractorName, setContractorName] = useState('');
  const [userId, setUserId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [uploadingJobId, setUploadingJobId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', customer_name: '', customer_phone: '', scheduled_date: '', notes: '' });

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

  async function saveJob() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('jobs').insert({ user_id: user.id, ...form, status: 'scheduled' });
    if (error) { setMessage('Error: ' + error.message); }
    else { setMessage('Job created!'); setForm({ title: '', customer_name: '', customer_phone: '', scheduled_date: '', notes: '' }); setShowForm(false); loadJobs(); }
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerPhone: job.customer_phone, customerName: job.customer_name, contractorName, googleReviewLink: googleReviewLink || 'https://g.page/r/review' })
      });
      const data = await res.json();
      if (data.success) setMessage('Job completed! Review request SMS sent ⭐');
      else setMessage('Job completed! SMS failed: ' + data.error);
    } else {
      setMessage('Job completed! Add customer phone next time to send review request.');
    }
  }

  async function uploadPhoto(jobId: string, file: File) {
    setUploadingJobId(jobId);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('jobId', jobId);
    formData.append('userId', userId);
    const res = await fetch('/api/upload-job-photo', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.success) {
      setMessage('Photo uploaded!');
      loadJobs();
    } else {
      setMessage('Upload failed: ' + data.error);
    }
    setUploadingJobId(null);
    setTimeout(() => setMessage(''), 3000);
  }

  async function deletePhoto(jobId: string, photoUrl: string) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    const photos = (job.photos || []).filter(p => p !== photoUrl);
    await supabase.from('jobs').update({ photos }).eq('id', jobId);
    loadJobs();
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f4', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Sidebar activePath="/jobs" />

      

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Top bar */}
        <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: 0 }}>Jobs</h1>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '2px 0 0' }}>Manage and track all your jobs</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{
            padding: '10px 20px', background: '#16a34a', color: 'white',
            borderRadius: '8px', fontWeight: '600', fontSize: '14px',
            border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
          }}>+ Create Job</button>
        </div>

        <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>

          {message && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#15803d', fontSize: '14px' }}>
              {message}
            </div>
          )}

          {/* Create Job Form */}
          {showForm && (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111', margin: '0 0 20px' }}>Create New Job</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {[
                  { label: 'Job Title', key: 'title', placeholder: 'Kitchen rewire' },
                  { label: 'Customer Name', key: 'customer_name', placeholder: 'John Smith' },
                  { label: 'Customer Phone', key: 'customer_phone', placeholder: '519-555-0000' },
                  { label: 'Scheduled Date', key: 'scheduled_date', placeholder: '', type: 'date' },
                ].map(field => (
                  <div key={field.key}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{field.label}</label>
                    <input
                      type={field.type || 'text'}
                      value={(form as any)[field.key]}
                      onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111', background: '#f9fafb', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notes</label>
                  <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any notes..."
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111', background: '#f9fafb', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button onClick={saveJob} disabled={saving} style={{ padding: '10px 24px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Creating...' : 'Create Job'}
                </button>
                <button onClick={() => setShowForm(false)} style={{ padding: '10px 24px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Jobs Table */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
              <h2 style={{ color: '#111', fontSize: '15px', fontWeight: '700', margin: 0 }}>All Jobs</h2>
            </div>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
            ) : jobs.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔧</div>
                <p style={{ margin: '0 0 16px', fontWeight: '500', color: '#374151' }}>No jobs yet</p>
                <button onClick={() => setShowForm(true)} style={{ background: '#16a34a', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                  Create your first job
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      {['Job Title', 'Customer', 'Phone', 'Scheduled Date', 'Status', 'Photos', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '12px 24px', textAlign: 'left', color: '#6b7280', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map(job => {
                      const statusStyle = STATUS_STYLES[job.status] || { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' };
                      return (
                        <React.Fragment key={job.id}>
                        <tr style={{ borderBottom: expandedJobId === job.id ? 'none' : '1px solid #f9fafb' }}>
                          <td style={{ padding: '14px 24px', color: '#111', fontSize: '14px', fontWeight: '500' }}>{job.title}</td>
                          <td style={{ padding: '14px 24px', color: '#374151', fontSize: '14px' }}>{job.customer_name}</td>
                          <td style={{ padding: '14px 24px', color: '#6b7280', fontSize: '13px' }}>{job.customer_phone || '—'}</td>
                          <td style={{ padding: '14px 24px', color: '#374151', fontSize: '13px' }}>{job.scheduled_date ? new Date(job.scheduled_date + 'T00:00:00').toLocaleDateString('en-CA') : '—'}</td>
                          <td style={{ padding: '14px 24px' }}>
                            <span style={{ background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`, borderRadius: '100px', padding: '3px 10px', fontSize: '12px', fontWeight: '600' }}>
                              {job.status}
                            </span>
                          </td>
                          <td style={{ padding: '14px 24px' }}>
                            <button
                              onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
                              style={{ padding: '5px 10px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', color: '#374151' }}
                            >
                              {(job.photos?.length || 0)} photo{(job.photos?.length || 0) !== 1 ? 's' : ''}
                            </button>
                          </td>
                          <td style={{ padding: '14px 24px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {job.status === 'scheduled' && (
                                <button onClick={() => updateStatus(job.id, 'in progress')}
                                  style={{ padding: '6px 12px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                  Start
                                </button>
                              )}
                              {job.status === 'in progress' && (
                                <button onClick={() => completeAndRequestReview(job)}
                                  style={{ padding: '6px 12px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                  Complete & Review ⭐
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {expandedJobId === job.id && (
                          <tr style={{ borderBottom: '1px solid #f9fafb' }}>
                            <td colSpan={7} style={{ padding: '0 24px 16px' }}>
                              <div style={{ background: '#f5f5f4', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>Job Photos</span>
                                  <label style={{ padding: '6px 12px', background: '#16a34a', color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                    {uploadingJobId === job.id ? 'Uploading...' : '+ Add Photo'}
                                    <input
                                      type="file"
                                      accept="image/*"
                                      style={{ display: 'none' }}
                                      onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) uploadPhoto(job.id, file);
                                        e.target.value = '';
                                      }}
                                    />
                                  </label>
                                </div>
                                {(!job.photos || job.photos.length === 0) ? (
                                  <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>No photos yet. Add before/after shots for this job.</p>
                                ) : (
                                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    {job.photos.map((url, i) => (
                                      <div key={i} style={{ position: 'relative' }}>
                                        <img src={url} alt={`Job photo ${i + 1}`} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                                        <button
                                          onClick={() => deletePhoto(job.id, url)}
                                          style={{ position: 'absolute', top: '4px', right: '4px', width: '18px', height: '18px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', color: 'white', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
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