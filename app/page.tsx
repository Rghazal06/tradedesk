import Link from 'next/link';

const FF = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export default function LandingPage() {
  return (
    <div style={{ fontFamily: FF, background: '#ffffff', color: '#111' }}>
      <style>{`
        @media (max-width: 920px) {
          .td-lp-nav { padding: 0 24px !important; }
          .td-nav-links { display: none !important; }
        }
        @media (max-width: 768px) {
          .td-lp-announce { padding: 8px 16px !important; font-size: 12px !important; flex-direction: column !important; gap: 2px !important; }
          .td-lp-nav { padding: 0 16px !important; height: 60px !important; }
          .td-hero { grid-template-columns: 1fr !important; padding: 48px 20px 40px !important; gap: 0 !important; }
          .td-h1 { font-size: 34px !important; letter-spacing: -1.5px !important; }
          .td-hero-visual { display: none !important; }
          .td-trust-bar { padding: 14px 20px !important; }
          .td-section { padding: 56px 20px !important; }
          .td-comparison-table { overflow-x: auto !important; border-radius: 12px !important; }
          .td-comparison-table > * { min-width: 560px; }
          .td-3col { grid-template-columns: 1fr !important; }
          .td-2col { grid-template-columns: 1fr !important; max-width: 100% !important; }
          .td-pricing-grid { grid-template-columns: 1fr !important; max-width: 100% !important; }
          .td-h2 { font-size: 26px !important; letter-spacing: -0.5px !important; }
          .td-cta-h2 { font-size: 30px !important; letter-spacing: -1px !important; line-height: 1.15 !important; }
          .td-footer-grid { grid-template-columns: 1fr 1fr !important; padding: 0 20px !important; }
          .td-footer-inner { padding: 24px 20px !important; flex-direction: column !important; text-align: center !important; }
        }
      `}</style>

      {/* Announcement bar */}
      <div className="td-lp-announce" style={{ background: '#0a0a0a', color: 'white', padding: '9px 48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', fontWeight: '500' }}>
        <span>🎉 New: two-way client texting, job checklists, deposits &amp; tips are live.</span>
        <a href="#features" style={{ color: '#4ade80', fontWeight: '700', textDecoration: 'none' }}>See what's new →</a>
      </div>

      {/* Navbar */}
      <nav className="td-lp-nav" style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #e5e7eb', padding: '0 64px', height: '76px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="4" height="16" fill="#0a0a0a"/><rect x="2" y="18" width="20" height="4" fill="#0a0a0a"/><rect x="6" y="18" width="4" height="4" fill="#16a34a"/></svg>
          <span style={{ fontWeight: '800', fontSize: '18px', letterSpacing: '-0.3px' }}>TradeDesk</span>
        </div>
        <div style={{ display: 'flex', gap: '44px', alignItems: 'center' }}>
          <div className="td-nav-links" style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
            <a href="#why-ontario" style={{ color: '#374151', fontSize: '14px', textDecoration: 'none', fontWeight: '600' }}>Why Ontario</a>
            <a href="#features" style={{ color: '#374151', fontSize: '14px', textDecoration: 'none', fontWeight: '600' }}>Features</a>
            <a href="#pricing" style={{ color: '#374151', fontSize: '14px', textDecoration: 'none', fontWeight: '600' }}>Pricing</a>
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <Link href="/login" style={{ color: '#374151', fontSize: '14px', textDecoration: 'none', fontWeight: '600' }}>Sign in</Link>
            <Link href="/signup" style={{ padding: '11px 24px', background: '#16a34a', color: 'white', borderRadius: '8px', fontSize: '14px', fontWeight: '700', textDecoration: 'none', boxShadow: '0 2px 10px rgba(22,163,74,0.35)' }}>
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="td-hero" style={{ maxWidth: '1200px', margin: '0 auto', padding: '88px 48px 72px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '72px', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '100px', padding: '5px 14px', fontSize: '12px', fontWeight: '700', color: '#15803d', marginBottom: '28px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="5" fill="#16a34a"/></svg>
            Made in Ontario, for Ontario
          </div>
          <h1 className="td-h1" style={{ fontSize: '54px', fontWeight: '900', lineHeight: '1.05', letterSpacing: '-2.5px', color: '#0a0a0a', margin: '0 0 22px' }}>
            The only platform<br />
            built for<br />
            <span style={{ color: '#16a34a' }}>Ontario trades law.</span>
          </h1>
          <p style={{ fontSize: '18px', color: '#4b5563', lineHeight: '1.75', margin: '0 0 16px', maxWidth: '440px' }}>
            WSIB tracking, HST auto-calculation, and Canadian compliance built in — not bolted on. For electricians, plumbers, HVAC techs, roofers, and contractors across Ontario.
          </p>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: '0 0 36px', maxWidth: '420px' }}>
            Jobber doesn't know what WSIB is. We do.
          </p>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' as const }}>
            <Link href="/signup" style={{ padding: '14px 30px', background: '#16a34a', color: 'white', borderRadius: '8px', fontWeight: '800', fontSize: '16px', textDecoration: 'none', boxShadow: '0 4px 20px rgba(22,163,74,0.35)', letterSpacing: '-0.2px' }}>
              Start 14-day free trial
            </Link>
            <span style={{ color: '#9ca3af', fontSize: '13px' }}>No credit card. Priced in CAD.</span>
          </div>
          <div style={{ display: 'flex', gap: '36px', marginTop: '44px' }}>
            {[
              { value: 'WSIB', label: 'Built-in tracking' },
              { value: '13% HST', label: 'Auto-calculated' },
              { value: 'CAD', label: 'No USD conversion' },
            ].map(stat => (
              <div key={stat.label}>
                <p style={{ fontSize: '20px', fontWeight: '900', color: '#16a34a', margin: '0 0 2px', letterSpacing: '-0.5px' }}>{stat.value}</p>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, fontWeight: '500' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hero visual */}
        <div className="td-hero-visual" style={{ position: 'relative' as const }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '24px', boxShadow: '0 24px 64px rgba(0,0,0,0.09)' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 14px' }}>This Month — Ontario Contractor</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '14px' }}>
              {[
                { label: 'Revenue', value: '$18,450', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
                { label: 'HST Collected', value: '$2,399', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
                { label: 'WSIB Due', value: 'Jul 31', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
                { label: 'Unpaid', value: '2', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
              ].map(card => (
                <div key={card.label} style={{ background: card.bg, border: `1px solid ${card.border}`, borderRadius: '10px', padding: '14px' }}>
                  <p style={{ color: '#6b7280', fontSize: '11px', fontWeight: '600', margin: '0 0 4px', textTransform: 'uppercase' as const }}>{card.label}</p>
                  <p style={{ color: card.color, fontSize: '22px', fontWeight: '800', margin: 0 }}>{card.value}</p>
                </div>
              ))}
            </div>
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <p style={{ fontWeight: '700', color: '#111', fontSize: '13px', margin: 0 }}>Recent Quotes</p>
                <span style={{ color: '#16a34a', fontSize: '12px', fontWeight: '600' }}>View all</span>
              </div>
              {[
                { name: 'Mike Thompson', amount: '$2,712 + HST', status: 'approved', approved: true },
                { name: 'Sarah Chen', amount: '$1,005 + HST', status: 'sent', approved: false },
              ].map(q => (
                <div key={q.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid #f3f4f6' }}>
                  <span style={{ fontSize: '13px', color: '#374151' }}>{q.name}</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', color: '#16a34a', fontSize: '13px' }}>{q.amount}</span>
                    <span style={{ background: q.approved ? '#f0fdf4' : '#eff6ff', color: q.approved ? '#15803d' : '#1d4ed8', border: `1px solid ${q.approved ? '#bbf7d0' : '#bfdbfe'}`, borderRadius: '100px', padding: '2px 8px', fontSize: '11px', fontWeight: '600' }}>
                      {q.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Float badge */}
          <div style={{ position: 'absolute' as const, bottom: '-16px', left: '-20px', background: '#16a34a', borderRadius: '12px', padding: '12px 18px', boxShadow: '0 8px 28px rgba(22,163,74,0.45)' }}>
            <p style={{ color: 'white', fontSize: '12px', fontWeight: '800', margin: '0 0 1px' }}>AI Quote Generated</p>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px', margin: 0 }}>200A panel upgrade — $3,200 + HST</p>
          </div>
          {/* WSIB badge */}
          <div style={{ position: 'absolute' as const, top: '-14px', right: '-14px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
            <p style={{ color: '#15803d', fontSize: '11px', fontWeight: '800', margin: '0 0 1px' }}>WSIB Reminder</p>
            <p style={{ color: '#6b7280', fontSize: '11px', margin: 0 }}>Filing due in 3 days</p>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <div className="td-trust-bar" style={{ background: '#0a0a0a', padding: '18px 48px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '40px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' as const }}>
          {[
            'WSIB Premium Calculator',
            'HST 13% Auto-Applied',
            'Clearance Certificate Tracking',
            'Skilled Trades Ontario Hours',
            'Canadian Data Storage',
            'Priced in CAD',
          ].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '600', whiteSpace: 'nowrap' as const }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Why Ontario section */}
      <section id="why-ontario" className="td-section" style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb', padding: '96px 48px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center' as const, marginBottom: '64px' }}>
            <p style={{ fontSize: '12px', fontWeight: '700', color: '#16a34a', textTransform: 'uppercase' as const, letterSpacing: '1px', margin: '0 0 12px' }}>The Ontario difference</p>
            <h2 className="td-h2" style={{ fontSize: '40px', fontWeight: '900', letterSpacing: '-1.5px', color: '#0a0a0a', margin: '0 0 16px' }}>Other software ignores Ontario law.</h2>
            <p style={{ color: '#6b7280', fontSize: '17px', maxWidth: '560px', margin: '0 auto', lineHeight: '1.7' }}>
              Jobber was built for generic home services in the US. TradeDesk was built around the actual rules Ontario trades work under every day.
            </p>
          </div>

          {/* Comparison table */}
          <div className="td-comparison-table" style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ padding: '16px 24px' }} />
              <div style={{ padding: '16px 24px', textAlign: 'center' as const, borderLeft: '1px solid #e5e7eb' }}>
                <p style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', margin: 0, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Spreadsheets</p>
              </div>
              <div style={{ padding: '16px 24px', textAlign: 'center' as const, borderLeft: '1px solid #e5e7eb' }}>
                <p style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', margin: 0, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Jobber (USD)</p>
              </div>
              <div style={{ padding: '16px 24px', textAlign: 'center' as const, borderLeft: '1px solid #e5e7eb', background: '#f0fdf4' }}>
                <p style={{ fontSize: '12px', fontWeight: '800', color: '#15803d', margin: 0, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>TradeDesk</p>
              </div>
            </div>
            {[
              { feature: 'WSIB premium tracking + reminders', sheets: false, jobber: false, td: true },
              { feature: 'HST 13% auto-calculated on every quote', sheets: false, jobber: false, td: true },
              { feature: 'WSIB Clearance Certificate alerts', sheets: false, jobber: false, td: true },
              { feature: 'Apprenticeship hours (Skilled Trades Ontario)', sheets: false, jobber: false, td: true },
              { feature: 'Priced in Canadian dollars', sheets: true, jobber: false, td: true },
              { feature: 'Quotes + invoices', sheets: false, jobber: true, td: true },
              { feature: 'AI quote generation', sheets: false, jobber: true, td: true },
              { feature: 'Online payments, deposits + tipping', sheets: false, jobber: true, td: true },
              { feature: 'Two-way client texting', sheets: false, jobber: true, td: true },
              { feature: 'Customizable job checklists', sheets: false, jobber: true, td: true },
              { feature: 'Time tracking + labor cost per job', sheets: false, jobber: true, td: true },
              { feature: 'Recurring job scheduling', sheets: false, jobber: true, td: true },
              { feature: 'Batch invoicing from quotes', sheets: false, jobber: true, td: true },
              { feature: 'Drag-and-drop appointment calendar', sheets: false, jobber: true, td: true },
              { feature: 'AI receipt scanning with line items', sheets: false, jobber: false, td: true },
            ].map((row, i) => (
              <div key={row.feature} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', borderTop: i === 0 ? 'none' : '1px solid #f3f4f6' }}>
                <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>{row.feature}</span>
                </div>
                {[row.sheets, row.jobber, row.td].map((val, j) => (
                  <div key={j} style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid #f3f4f6', background: j === 2 ? '#f0fdf4' : 'transparent' }}>
                    {val ? (
                      <div style={{ width: '22px', height: '22px', background: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    ) : (
                      <div style={{ width: '22px', height: '22px', background: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 1l6 6M7 1L1 7" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center' as const, color: '#9ca3af', fontSize: '13px', marginTop: '20px' }}>
            Jobber forces Canadian contractors to pay in USD — that's a 35–40% surcharge before you've done anything.
          </p>
        </div>
      </section>

      {/* Ontario compliance callouts */}
      <section className="td-section" style={{ maxWidth: '1200px', margin: '0 auto', padding: '96px 48px 80px' }}>
        <div style={{ textAlign: 'center' as const, marginBottom: '56px' }}>
          <p style={{ fontSize: '12px', fontWeight: '700', color: '#16a34a', textTransform: 'uppercase' as const, letterSpacing: '1px', margin: '0 0 12px' }}>Ontario compliance</p>
          <h2 className="td-h2" style={{ fontSize: '40px', fontWeight: '900', letterSpacing: '-1.5px', color: '#0a0a0a', margin: 0 }}>Built around the rules you actually work under</h2>
        </div>
        <div className="td-3col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {[
            {
              title: 'WSIB Premium Tracking',
              body: 'Log your reportable earnings each period, auto-calculate what you owe at your WSIB rate, and get a reminder 3 days before the filing deadline. No more guessing or missed deadlines.',
              tag: 'Mandatory in Ontario',
              color: '#dc2626', tagBg: '#fef2f2', tagBorder: '#fecaca',
            },
            {
              title: 'HST Auto-Calculated',
              body: 'Every quote and invoice automatically applies the 13% Ontario HST. Your customers see the breakdown — subtotal, tax, total — without you having to think about it.',
              tag: '13% Ontario rate',
              color: '#2563eb', tagBg: '#eff6ff', tagBorder: '#bfdbfe',
            },
            {
              title: 'Clearance Certificate Alerts',
              body: 'Track your WSIB Clearance Certificate and your subcontractors\' certificates. Get alerted before they expire — because hiring a sub with a lapsed cert makes you liable.',
              tag: 'Required by law',
              color: '#7c3aed', tagBg: '#f5f3ff', tagBorder: '#ddd6fe',
            },
            {
              title: 'Apprenticeship Hour Logging',
              body: 'Track hours toward your Red Seal or Certificate of Qualification under Skilled Trades Ontario. Log by employer, supervisor, and task. Export a clean record at any point.',
              tag: 'Skilled Trades Ontario',
              color: '#0369a1', tagBg: '#f0f9ff', tagBorder: '#bae6fd',
            },
            {
              title: 'Crew WSIB Management',
              body: 'Manage your subcontractors and crew members. Track each person\'s WSIB number, expiry date, and rate — with warning banners when anyone is about to lapse.',
              tag: 'Subcontractor compliance',
              color: '#15803d', tagBg: '#f0fdf4', tagBorder: '#bbf7d0',
            },
            {
              title: 'Canadian Data Storage',
              body: 'Your business data stays in Canada. You\'re not subject to US data laws, US court orders, or US privacy regulations. Your clients\' information doesn\'t leave the country.',
              tag: 'Data sovereignty',
              color: '#92400e', tagBg: '#fefce8', tagBorder: '#fde047',
            },
          ].map(f => (
            <div key={f.title} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'inline-block', background: f.tagBg, border: `1px solid ${f.tagBorder}`, borderRadius: '100px', padding: '3px 10px', fontSize: '11px', fontWeight: '700', color: f.color, marginBottom: '16px', textTransform: 'uppercase' as const, letterSpacing: '0.3px' }}>
                {f.tag}
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0a0a0a', margin: '0 0 10px', letterSpacing: '-0.3px' }}>{f.title}</h3>
              <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.75', margin: 0 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="td-section" style={{ background: '#f8fafc', borderTop: '1px solid #e5e7eb', padding: '96px 48px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center' as const, marginBottom: '64px' }}>
            <p style={{ fontSize: '12px', fontWeight: '700', color: '#16a34a', textTransform: 'uppercase' as const, letterSpacing: '1px', margin: '0 0 12px' }}>Everything else</p>
            <h2 className="td-h2" style={{ fontSize: '40px', fontWeight: '900', letterSpacing: '-1.5px', color: '#0a0a0a', margin: 0 }}>A complete business, not just an app</h2>
          </div>
          <div className="td-3col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', background: '#e5e7eb', borderRadius: '16px', overflow: 'hidden' }}>
            {[
              { title: 'AI Quote Generator', desc: 'Describe the job in plain English — "200A panel upgrade, 3 bed house, London ON." TradeDesk writes a professional itemized quote with HST in seconds. No more quoting from memory.', tag: 'Powered by GPT-4o' },
              { title: 'Online Payments, Deposits & Tips', desc: "Every invoice gets a branded pay page where customers can add a tip before paying by card. Require a deposit on a quote and it auto-approves the moment they pay. Funds hit your account the next business day.", tag: 'Stripe-powered' },
              { title: 'AI Receipt Scanning', desc: 'Photograph a Home Depot receipt on site. AI extracts every line item, amount, and category automatically. Every expense tracked, every purchase categorized for tax time.', tag: 'Line-item extraction' },
              { title: 'Client CRM', desc: "Every customer's complete history — quotes, invoices, jobs, contact info — in one place. See at a glance what they've been quoted, what they owe, and when you last spoke.", tag: 'Full history' },
              { title: 'Job Management', desc: 'Create jobs, attach photos from the job site, build a customizable checklist so nothing gets missed, track progress from scheduled to complete, and trigger a Google review request when you mark it done.', tag: 'With photo attachments' },
              { title: 'Two-Way Client Texting', desc: "Text customers straight from their client profile using your own business number, and see their replies land right back in TradeDesk. No more juggling a separate phone for job updates.", tag: 'SMS-powered' },
              { title: 'Appointment Scheduling', desc: 'Book customer appointments, send automatic SMS reminders the day before, and view your full calendar. Never show up to a no-show because they forgot.', tag: 'SMS reminders' },
              { title: 'AI Profit Analyzer', desc: 'Connect your jobs, quotes, and invoices and let AI tell you your monthly revenue, average job value, collection rate, and exactly where you\'re leaving money on the table.', tag: 'Business intelligence' },
              { title: 'Crew Management', desc: 'Add your subcontractors and crew members with their trades, rates, and WSIB info. Get warned when someone\'s certificate is about to expire before you send them to a job.', tag: 'WSIB-aware' },
              { title: 'Public Contractor Profile', desc: 'Every TradeDesk account comes with a public profile page you can share with customers — your trade, services, reviews, and a direct quote request form.', tag: 'Free with every plan' },
            ].map(f => (
              <div key={f.title} style={{ background: 'white', padding: '32px' }}>
                <div style={{ display: 'inline-block', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '100px', padding: '3px 10px', fontSize: '11px', fontWeight: '700', color: '#15803d', marginBottom: '16px', textTransform: 'uppercase' as const, letterSpacing: '0.3px' }}>
                  {f.tag}
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0a0a0a', margin: '0 0 10px', letterSpacing: '-0.3px' }}>{f.title}</h3>
                <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.75', margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Switch from spreadsheets */}
      <section style={{ background: '#0a0a0a', padding: '80px 48px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center' as const, marginBottom: '48px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.3)', borderRadius: '100px', padding: '5px 16px', fontSize: '12px', fontWeight: '700', color: '#4ade80', marginBottom: '20px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
              Zero learning curve
            </div>
            <h2 style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '-1px', color: '#ffffff', margin: '0 0 16px' }}>
              Already using spreadsheets or QuickBooks?
            </h2>
            <p style={{ fontSize: '17px', color: '#8faac4', lineHeight: '1.7', margin: '0 auto', maxWidth: '580px' }}>
              Import everything in minutes. Your clients, quotes, invoices, jobs, and expense history come with you — nothing gets left behind.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '40px' }}>
            {[
              { label: 'Clients', desc: 'Name, phone, email', color: '#0369a1' },
              { label: 'Quotes & Invoices', desc: 'Full billing history', color: '#7c3aed' },
              { label: 'Receipts', desc: 'All expense records', color: '#15803d' },
              { label: 'Jobs', desc: 'Past job history', color: '#b45309' },
            ].map(item => (
              <div key={item.label} style={{ background: '#141c2e', border: '1px solid #1e2d45', borderRadius: '12px', padding: '20px 18px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color, marginBottom: '12px' }} />
                <p style={{ fontWeight: '700', color: '#f0f4ff', fontSize: '14px', margin: '0 0 4px' }}>{item.label}</p>
                <p style={{ color: '#8faac4', fontSize: '12px', margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ background: '#141c2e', border: '1px solid #1e2d45', borderRadius: '14px', padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' as const }}>
            <div>
              <p style={{ fontWeight: '700', color: '#f0f4ff', fontSize: '16px', margin: '0 0 6px' }}>Upload a CSV or Excel file — that's it.</p>
              <p style={{ color: '#8faac4', fontSize: '14px', margin: 0 }}>TradeDesk auto-detects your columns, you confirm the mapping, and your data is in. Works with QuickBooks exports, Google Sheets, and any spreadsheet.</p>
            </div>
            <a href="/signup" style={{ flexShrink: 0, padding: '12px 28px', background: '#16a34a', color: 'white', borderRadius: '8px', fontWeight: '700', fontSize: '14px', textDecoration: 'none', boxShadow: '0 4px 16px rgba(22,163,74,0.3)', whiteSpace: 'nowrap' as const }}>
              Start free trial
            </a>
          </div>
        </div>
      </section>

      {/* Early Access */}
      <section className="td-section" style={{ background: '#f8fafc', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', padding: '80px 48px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center' as const }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '100px', padding: '5px 16px', fontSize: '12px', fontWeight: '700', color: '#15803d', marginBottom: '24px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><circle cx="4" cy="4" r="4" fill="#16a34a"/></svg>
            Now in early access
          </div>
          <h2 className="td-h2" style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '-1px', color: '#0a0a0a', margin: '0 0 16px' }}>
            Be one of the first contractors on TradeDesk.
          </h2>
          <p style={{ fontSize: '17px', color: '#4b5563', lineHeight: '1.75', margin: '0 0 40px', maxWidth: '580px', marginLeft: 'auto', marginRight: 'auto' }}>
            We're onboarding Ontario contractors directly — no waitlist. You get a 14-day free trial and a direct line to the founder. If something doesn't work for how you run your business, tell us and we'll fix it.
          </p>
          <div className="td-3col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '40px', textAlign: 'left' as const }}>
            {[
              { title: 'Direct access to the founder', body: 'You\'re not ticket #4821. You talk to the person who built this. Issues get fixed fast.' },
              { title: 'Shape the product', body: 'Early users tell us what to build next. Your workflow, your problems — we build around them.' },
              { title: 'Locked-in pricing', body: 'Early access users keep their rate. Price never goes up as long as you stay subscribed.' },
            ].map(item => (
              <div key={item.title} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '22px' }}>
                <div style={{ width: '28px', height: '28px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                  <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5l4 4 6-8" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <p style={{ fontWeight: '700', color: '#111', fontSize: '14px', margin: '0 0 6px' }}>{item.title}</p>
                <p style={{ color: '#6b7280', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>{item.body}</p>
              </div>
            ))}
          </div>
          <Link href="/signup" style={{ display: 'inline-block', padding: '14px 32px', background: '#16a34a', color: 'white', borderRadius: '8px', fontWeight: '800', fontSize: '16px', textDecoration: 'none', boxShadow: '0 4px 20px rgba(22,163,74,0.3)' }}>
            Start your free trial
          </Link>
          <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '12px' }}>14-day free trial. No credit card. Cancel any time.</p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="td-section" style={{ background: '#f8fafc', borderTop: '1px solid #e5e7eb', padding: '96px 48px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center' as const, marginBottom: '56px' }}>
            <p style={{ fontSize: '12px', fontWeight: '700', color: '#16a34a', textTransform: 'uppercase' as const, letterSpacing: '1px', margin: '0 0 12px' }}>Simple pricing in CAD</p>
            <h2 className="td-h2" style={{ fontSize: '40px', fontWeight: '900', letterSpacing: '-1.5px', color: '#0a0a0a', margin: '0 0 12px' }}>Less than Jobber. More for Ontario.</h2>
            <p style={{ color: '#6b7280', fontSize: '16px', margin: 0 }}>14-day free trial. No credit card. Cancel any time. Price shown in Canadian dollars.</p>
          </div>
          <div className="td-pricing-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', maxWidth: '1060px', margin: '0 auto' }}>

            {/* Starter */}
            <div style={{ border: '2px solid #e5e7eb', borderRadius: '16px', padding: '32px', position: 'relative' as const, background: 'white' }}>
              <p style={{ fontWeight: '800', fontSize: '18px', color: '#111', margin: '0 0 4px' }}>Starter</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', margin: '0 0 8px' }}>
                <span style={{ fontSize: '42px', fontWeight: '900', color: '#0a0a0a', letterSpacing: '-2px', lineHeight: '1' }}>$99</span>
                <span style={{ color: '#6b7280', fontSize: '14px', marginBottom: '6px' }}>/mo CAD</span>
              </div>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 24px', lineHeight: '1.5' }}>Everything you need to run your trade business compliantly.</p>
              <Link href="/signup" style={{ display: 'block', textAlign: 'center' as const, padding: '12px', background: 'white', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '8px', fontWeight: '700', fontSize: '14px', textDecoration: 'none', marginBottom: '24px' }}>
                Start Free Trial
              </Link>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
                {['Unlimited quotes + invoices', 'HST auto-calculated', 'WSIB tracking + reminders', 'Jobs + appointment scheduling', 'Job checklists', 'Online payments, deposits + tips', 'Two-way client texting', 'Client CRM', 'Receipt scanning + AI extraction', 'Crew + clearance cert tracking'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '16px', height: '16px', background: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <span style={{ fontSize: '13px', color: '#374151' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro */}
            <div style={{ border: '2px solid #16a34a', borderRadius: '16px', padding: '32px', position: 'relative' as const, background: '#f0fdf4' }}>
              <div style={{ position: 'absolute' as const, top: '-13px', left: '50%', transform: 'translateX(-50%)', background: '#16a34a', color: 'white', borderRadius: '100px', padding: '4px 18px', fontSize: '11px', fontWeight: '800', whiteSpace: 'nowrap' as const, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
                Most Popular
              </div>
              <p style={{ fontWeight: '800', fontSize: '18px', color: '#111', margin: '0 0 4px' }}>Pro</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', margin: '0 0 8px' }}>
                <span style={{ fontSize: '42px', fontWeight: '900', color: '#0a0a0a', letterSpacing: '-2px', lineHeight: '1' }}>$199</span>
                <span style={{ color: '#6b7280', fontSize: '14px', marginBottom: '6px' }}>/mo CAD</span>
              </div>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 24px', lineHeight: '1.5' }}>AI-powered tools for contractors who want the edge.</p>
              <Link href="/signup" style={{ display: 'block', textAlign: 'center' as const, padding: '12px', background: '#16a34a', color: 'white', border: '1px solid #16a34a', borderRadius: '8px', fontWeight: '700', fontSize: '14px', textDecoration: 'none', marginBottom: '24px' }}>
                Start Free Trial
              </Link>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
                {['Everything in Starter', 'AI Quote Generator (GPT-4o)', 'AI Profit Analyzer', 'AI Business Assistant', 'Apprenticeship hour tracker', 'Public contractor profile', 'Referral program', 'Priority support'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '16px', height: '16px', background: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <span style={{ fontSize: '13px', color: '#374151' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Enterprise */}
            <div style={{ border: '2px solid #1e2d45', borderRadius: '16px', padding: '32px', position: 'relative' as const, background: '#141c2e' }}>
              <div style={{ display: 'inline-block', background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.3)', borderRadius: '100px', padding: '3px 12px', fontSize: '10px', fontWeight: '800', color: '#4ade80', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '12px' }}>
                Custom Pricing
              </div>
              <p style={{ fontWeight: '800', fontSize: '18px', color: '#f0f4ff', margin: '0 0 4px' }}>Enterprise</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', margin: '0 0 8px' }}>
                <span style={{ fontSize: '42px', fontWeight: '900', color: '#f0f4ff', letterSpacing: '-2px', lineHeight: '1' }}>Custom</span>
              </div>
              <p style={{ color: '#8faac4', fontSize: '14px', margin: '0 0 24px', lineHeight: '1.5' }}>For larger companies with multiple crews, estimators, and project managers.</p>
              <a href="mailto:rayanghazal06@gmail.com?subject=Enterprise%20Plan%20Inquiry" style={{ display: 'block', textAlign: 'center' as const, padding: '12px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '14px', textDecoration: 'none', marginBottom: '24px' }}>
                Talk to us
              </a>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
                {['Everything in Pro', 'Multiple user accounts', 'Company-wide reporting', 'Dedicated account manager', 'Custom onboarding + training', 'Same-day support SLA', 'Volume pricing', 'Custom integrations on request'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '16px', height: '16px', background: 'rgba(22,163,74,0.2)', border: '1px solid rgba(22,163,74,0.4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <span style={{ fontSize: '13px', color: '#8faac4' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
          <p style={{ textAlign: 'center' as const, color: '#9ca3af', fontSize: '13px', marginTop: '28px' }}>
            Jobber's Connect plan starts at $169 USD/month (~$235 CAD). TradeDesk Starter is $99 CAD — and actually knows what WSIB is.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ background: '#0a0a0a', padding: '96px 48px', textAlign: 'center' as const }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.3)', borderRadius: '100px', padding: '5px 14px', fontSize: '12px', fontWeight: '700', color: '#4ade80', marginBottom: '28px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
            Made in Ontario
          </div>
          <h2 className="td-cta-h2" style={{ fontSize: '48px', fontWeight: '900', color: 'white', letterSpacing: '-2px', margin: '0 0 16px', lineHeight: '1.05' }}>
            Stop paying in USD<br />for software that<br />
            <span style={{ color: '#4ade80' }}>ignores Ontario law.</span>
          </h2>
          <p style={{ color: '#6b7280', fontSize: '16px', margin: '0 0 40px', lineHeight: '1.7' }}>
            14 days free. No credit card. Built for Ontario trades, priced in CAD, with WSIB built-in from day one.
          </p>
          <Link href="/signup" style={{ display: 'inline-block', padding: '16px 40px', background: '#16a34a', color: 'white', borderRadius: '8px', fontWeight: '800', fontSize: '16px', textDecoration: 'none', boxShadow: '0 4px 24px rgba(22,163,74,0.45)', letterSpacing: '-0.2px' }}>
            Create your free account
          </Link>
          <p style={{ color: '#4b5563', fontSize: '13px', marginTop: '16px' }}>No credit card required. Priced in CAD. Cancel any time.</p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0a0a0a', borderTop: '1px solid #1f2937', padding: '64px 48px 32px' }}>
        <div className="td-footer-grid" style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: '32px', marginBottom: '48px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="4" height="16" fill="#ffffff"/><rect x="2" y="18" width="20" height="4" fill="#ffffff"/><rect x="6" y="18" width="4" height="4" fill="#16a34a"/></svg>
              <span style={{ fontWeight: '700', color: 'white', fontSize: '15px' }}>TradeDesk</span>
            </div>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: 0, lineHeight: 1.6, maxWidth: '260px' }}>Built for Ontario contractors. WSIB + HST + Canadian data. Priced in CAD.</p>
          </div>

          <div>
            <p style={{ color: '#9ca3af', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' as const, letterSpacing: '0.6px', margin: '0 0 16px' }}>Features</p>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '11px' }}>
              <a href="#features" style={{ color: '#d1d5db', fontSize: '13px', textDecoration: 'none' }}>Quotes &amp; Invoices</a>
              <a href="#features" style={{ color: '#d1d5db', fontSize: '13px', textDecoration: 'none' }}>Jobs &amp; Checklists</a>
              <a href="#features" style={{ color: '#d1d5db', fontSize: '13px', textDecoration: 'none' }}>Client Portal &amp; Payments</a>
              <a href="#features" style={{ color: '#d1d5db', fontSize: '13px', textDecoration: 'none' }}>Two-Way Texting</a>
              <a href="#features" style={{ color: '#d1d5db', fontSize: '13px', textDecoration: 'none' }}>WSIB Tracking</a>
              <a href="#features" style={{ color: '#d1d5db', fontSize: '13px', textDecoration: 'none' }}>AI Assistant</a>
            </div>
          </div>

          <div>
            <p style={{ color: '#9ca3af', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' as const, letterSpacing: '0.6px', margin: '0 0 16px' }}>Company</p>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '11px' }}>
              <a href="#why-ontario" style={{ color: '#d1d5db', fontSize: '13px', textDecoration: 'none' }}>Why Ontario</a>
              <a href="#pricing" style={{ color: '#d1d5db', fontSize: '13px', textDecoration: 'none' }}>Pricing</a>
              <a href="mailto:rayanghazal06@gmail.com" style={{ color: '#d1d5db', fontSize: '13px', textDecoration: 'none' }}>Contact</a>
            </div>
          </div>

          <div>
            <p style={{ color: '#9ca3af', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' as const, letterSpacing: '0.6px', margin: '0 0 16px' }}>Get Started</p>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '11px' }}>
              <Link href="/signup" style={{ color: '#d1d5db', fontSize: '13px', textDecoration: 'none' }}>Start Free Trial</Link>
              <Link href="/login" style={{ color: '#d1d5db', fontSize: '13px', textDecoration: 'none' }}>Sign In</Link>
            </div>
          </div>
        </div>

        <div className="td-footer-inner" style={{ maxWidth: '1200px', margin: '0 auto', paddingTop: '24px', borderTop: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '12px' }}>
          <p style={{ color: '#4b5563', fontSize: '12px', margin: 0 }}>© 2026 TradeDesk. All rights reserved.</p>
          <p style={{ color: '#4b5563', fontSize: '12px', margin: 0 }}>Made in Ontario, for Ontario.</p>
        </div>
      </footer>

    </div>
  );
}
