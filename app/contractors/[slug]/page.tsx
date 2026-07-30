import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import ContactForm from './ContactForm';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function ContractorProfilePage({
  params,
}: {
  params: { slug: string };
}) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, company_name, trade_type, bio, services, google_review_link, is_public')
    .eq('public_slug', params.slug)
    .eq('is_public', true)
    .single();

  if (!profile) notFound();

  const services: string[] = profile.services || [];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Navbar */}
      <nav style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 48px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ width: '32px', height: '32px', background: '#16a34a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '13px' }}>TD</div>
          <span style={{ fontWeight: '700', fontSize: '18px', color: '#111' }}>TradeDesk</span>
        </a>
        <a href="/signup" style={{ padding: '8px 18px', background: '#16a34a', color: 'white', borderRadius: '8px', fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}>
          Get TradeDesk Free
        </a>
      </nav>

      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px' }}>

        {/* Profile header */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '32px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
            <div style={{ width: '72px', height: '72px', background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '28px', fontWeight: '800', color: '#16a34a' }}>
                {(profile.company_name || profile.full_name || '?').charAt(0).toUpperCase()}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#111', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
                {profile.company_name || profile.full_name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {profile.trade_type && (
                  <span style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '100px', padding: '4px 12px', fontSize: '13px', fontWeight: '600' }}>
                    {profile.trade_type}
                  </span>
                )}
                <span style={{ color: '#6b7280', fontSize: '13px' }}>Ontario, Canada</span>
              </div>
              {profile.bio && (
                <p style={{ color: '#374151', fontSize: '15px', lineHeight: '1.6', margin: '12px 0 0' }}>
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          {profile.google_review_link && (
            <a
              href={profile.google_review_link}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '20px', padding: '10px 18px', background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: '8px', textDecoration: 'none', color: '#374151', fontSize: '14px', fontWeight: '600' }}
            >
              View Google Reviews
            </a>
          )}
        </div>

        {/* Services */}
        {services.length > 0 && (
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111', margin: '0 0 16px' }}>Services</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {services.map((s: string, i: number) => (
                <span key={i} style={{ background: '#f3f4f6', color: '#374151', borderRadius: '8px', padding: '6px 14px', fontSize: '14px', fontWeight: '500' }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Contact form */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111', margin: '0 0 4px' }}>Request a Quote</h2>
          <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 20px' }}>Send a message and get a quote within 24 hours.</p>
          <ContactForm contractorId={profile.id} contractorName={profile.company_name || profile.full_name} />
        </div>

      </main>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', fontSize: '13px' }}>
        Powered by <a href="/" style={{ color: '#16a34a', textDecoration: 'none', fontWeight: '600' }}>TradeDesk</a> — Ontario Contractor Software
      </div>
    </div>
  );
}
