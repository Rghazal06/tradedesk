import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  scheduled:    { bg: '#fefce8', color: '#854d0e' },
  'in progress':{ bg: '#eff6ff', color: '#1d4ed8' },
  completed:    { bg: '#dcfce7', color: '#15803d' },
  cancelled:    { bg: '#fef2f2', color: '#991b1b' },
};

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const { data: job } = await supabase
    .from('jobs')
    .select('id, title, customer_name, scheduled_date, status, notes, photos, user_id')
    .eq('share_token', token)
    .single();

  if (!job) return notFound();

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_name, full_name, phone')
    .eq('id', job.user_id)
    .single();

  const contractorName = profile?.company_name || profile?.full_name || 'Your Contractor';
  const photos: string[] = job.photos || [];
  const sc = STATUS_COLORS[job.status] || { bg: '#f3f4f6', color: '#374151' };
  const jobDate = job.scheduled_date
    ? new Date(job.scheduled_date + 'T00:00:00').toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f4', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#0f0f0f', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="2" width="4" height="16" fill="#ffffff" />
          <rect x="2" y="18" width="20" height="4" fill="#ffffff" />
          <rect x="6" y="18" width="4" height="4" fill="#16a34a" />
        </svg>
        <span style={{ color: '#ffffff', fontWeight: '700', fontSize: '15px', letterSpacing: '-0.3px' }}>TradeDesk</span>
      </div>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Job header card */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '28px 32px', marginBottom: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#111', margin: '0 0 6px', letterSpacing: '-0.3px' }}>{job.title}</h1>
              <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#6b7280' }}>Shared by <strong style={{ color: '#374151' }}>{contractorName}</strong></p>
              <span style={{ display: 'inline-block', background: sc.bg, color: sc.color, padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: '700', textTransform: 'capitalize' }}>
                {job.status}
              </span>
            </div>
            {jobDate && (
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ margin: '0 0 3px', fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Job Date</p>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#374151' }}>{jobDate}</p>
              </div>
            )}
          </div>

          {profile?.phone && (
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2h3l1 3-1.5 1.5a9 9 0 0 0 3 3L9 8l3 1v3a1 1 0 0 1-1 1A11 11 0 0 1 1 3a1 1 0 0 1 1-1z" stroke="#6b7280" strokeWidth="1.3" strokeLinejoin="round"/></svg>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>{profile.phone}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {job.notes && (
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderLeft: '3px solid #16a34a', borderRadius: '0 12px 12px 0', padding: '20px 24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Job Notes</p>
            <p style={{ margin: 0, fontSize: '14px', color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{job.notes}</p>
          </div>
        )}

        {/* Photo gallery */}
        {photos.length > 0 ? (
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <p style={{ margin: '0 0 18px', fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Job Photos ({photos.length})</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {photos.map((url, i) => (
                <div key={i} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e5e7eb', aspectRatio: '1' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Job photo ${i + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  {i === 0 && photos.length > 1 && (
                    <span style={{ position: 'absolute', top: '8px', left: '8px', background: '#15803d', color: 'white', fontSize: '9px', fontWeight: '800', padding: '3px 7px', borderRadius: '4px', letterSpacing: '0.4px' }}>BEFORE</span>
                  )}
                  {i === photos.length - 1 && photos.length > 1 && (
                    <span style={{ position: 'absolute', top: '8px', left: '8px', background: '#1d4ed8', color: 'white', fontSize: '9px', fontWeight: '800', padding: '3px 7px', borderRadius: '4px', letterSpacing: '0.4px' }}>AFTER</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '40px 24px', textAlign: 'center', marginBottom: '24px' }}>
            <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>No photos have been added to this job yet.</p>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
            Shared via TradeDesk — Business software for Ontario contractors
          </p>
        </div>
      </div>
    </div>
  );
}
