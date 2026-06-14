import Link from 'next/link';

export default function LandingPage() {
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#ffffff', color: '#111' }}>

      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 48px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="4" height="16" fill="#0a0a0a"/><rect x="2" y="18" width="20" height="4" fill="#0a0a0a"/><rect x="6" y="18" width="4" height="4" fill="#16a34a"/></svg>
          <span style={{ fontWeight: '800', fontSize: '17px', letterSpacing: '-0.3px' }}>TradeDesk</span>
        </div>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <a href="#features" style={{ color: '#6b7280', fontSize: '14px', textDecoration: 'none', fontWeight: '500' }}>Features</a>
          <a href="#pricing" style={{ color: '#6b7280', fontSize: '14px', textDecoration: 'none', fontWeight: '500' }}>Pricing</a>
          <Link href="/login" style={{ color: '#374151', fontSize: '14px', textDecoration: 'none', fontWeight: '600' }}>Sign in</Link>
          <Link href="/signup" style={{ padding: '8px 18px', background: '#16a34a', color: 'white', borderRadius: '6px', fontSize: '14px', fontWeight: '700', textDecoration: 'none' }}>
            Start Free Trial
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 48px 64px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-block', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '100px', padding: '4px 14px', fontSize: '12px', fontWeight: '700', color: '#15803d', marginBottom: '24px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
            Built for Ontario Contractors
          </div>
          <h1 style={{ fontSize: '52px', fontWeight: '900', lineHeight: '1.1', letterSpacing: '-2px', color: '#0a0a0a', margin: '0 0 20px' }}>
            Run your trade<br />
            business from<br />
            <span style={{ color: '#16a34a' }}>one place.</span>
          </h1>
          <p style={{ fontSize: '18px', color: '#4b5563', lineHeight: '1.7', margin: '0 0 36px', maxWidth: '420px' }}>
            Quotes, invoices, WSIB tracking, and payments built specifically for electricians, plumbers, HVAC techs, and contractors in Ontario.
          </p>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' as const }}>
            <Link href="/signup" style={{ padding: '14px 28px', background: '#16a34a', color: 'white', borderRadius: '8px', fontWeight: '700', fontSize: '16px', textDecoration: 'none', boxShadow: '0 4px 16px rgba(22,163,74,0.35)' }}>
              Start 14-day free trial
            </Link>
            <span style={{ color: '#9ca3af', fontSize: '13px' }}>No credit card required</span>
          </div>
          <div style={{ display: 'flex', gap: '32px', marginTop: '40px' }}>
            {[
              { value: '13%', label: 'HST auto-calculated' },
              { value: '$0', label: 'Setup fee' },
              { value: '14 days', label: 'Free trial' },
            ].map(stat => (
              <div key={stat.label}>
                <p style={{ fontSize: '22px', fontWeight: '800', color: '#16a34a', margin: '0 0 2px', letterSpacing: '-0.5px' }}>{stat.value}</p>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, fontWeight: '500' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hero visual */}
        <div style={{ position: 'relative' as const }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 12px' }}>This Month</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: 'Revenue', value: '$18,450', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
                { label: 'Quotes Sent', value: '14', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
                { label: 'Jobs Active', value: '6', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
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
                { name: 'Mike Thompson', amount: '$2,400', status: 'approved', approved: true },
                { name: 'Sarah Chen', amount: '$890', status: 'pending', approved: false },
              ].map(q => (
                <div key={q.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid #f3f4f6' }}>
                  <span style={{ fontSize: '13px', color: '#374151' }}>{q.name}</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', color: '#16a34a', fontSize: '13px' }}>{q.amount}</span>
                    <span style={{ background: q.approved ? '#f0fdf4' : '#fefce8', color: q.approved ? '#15803d' : '#854d0e', border: `1px solid ${q.approved ? '#bbf7d0' : '#fde047'}`, borderRadius: '100px', padding: '2px 8px', fontSize: '11px', fontWeight: '600' }}>
                      {q.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: 'absolute' as const, bottom: '-16px', left: '-16px', background: '#16a34a', borderRadius: '12px', padding: '12px 16px', boxShadow: '0 8px 24px rgba(22,163,74,0.4)' }}>
            <p style={{ color: 'white', fontSize: '12px', fontWeight: '700', margin: '0 0 2px' }}>AI Quote Generated</p>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', margin: 0 }}>Panel upgrade — $3,200</p>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <div style={{ background: '#f8fafc', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', padding: '20px 48px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '40px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' as const }}>
          {['Ontario Compliance Built-In', 'WSIB Auto-Tracking', 'Stripe Payments', '13% HST Calculated', 'Canadian Data Storage'].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: '#374151', fontWeight: '600', whiteSpace: 'nowrap' as const }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section id="features" style={{ maxWidth: '1200px', margin: '0 auto', padding: '96px 48px' }}>
        <div style={{ textAlign: 'center' as const, marginBottom: '64px' }}>
          <p style={{ fontSize: '12px', fontWeight: '700', color: '#16a34a', textTransform: 'uppercase' as const, letterSpacing: '1px', margin: '0 0 12px' }}>Everything you need</p>
          <h2 style={{ fontSize: '40px', fontWeight: '900', letterSpacing: '-1.5px', color: '#0a0a0a', margin: 0 }}>Built for the job site, not a boardroom</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', background: '#e5e7eb', borderRadius: '16px', overflow: 'hidden' }}>
          {[
            { title: 'AI Quote Generator', desc: 'Describe the job in plain English. TradeDesk generates a professional, itemized quote with accurate Ontario pricing in seconds.', tag: 'Powered by GPT-4' },
            { title: 'WSIB Tracking', desc: 'Log reportable earnings, auto-calculate premiums, and get reminded 3 days before every filing deadline. Never pay a penalty again.', tag: 'Ontario-specific' },
            { title: 'Stripe Payment Links', desc: 'Every invoice gets a payment link. Customers pay by card or bank transfer the day they receive it. Funds deposited directly to you.', tag: 'Get paid faster' },
            { title: 'Client CRM', desc: "Every customer's full history — quotes, invoices, jobs, and contact info — in one place. No more digging through texts.", tag: 'Full history' },
            { title: 'Appointment Scheduling', desc: 'Book jobs with customers, send automatic SMS reminders the day before, and manage your calendar from your phone.', tag: 'SMS reminders' },
            { title: 'Receipt Scanning', desc: 'Photograph any receipt on site. AI reads the merchant, amount, and date automatically. Export everything to CSV at tax time.', tag: 'AI-powered' },
          ].map(f => (
            <div key={f.title} style={{ background: 'white', padding: '32px' }}>
              <div style={{ display: 'inline-block', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '100px', padding: '3px 10px', fontSize: '11px', fontWeight: '700', color: '#15803d', marginBottom: '16px', textTransform: 'uppercase' as const, letterSpacing: '0.3px' }}>
                {f.tag}
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0a0a0a', margin: '0 0 10px', letterSpacing: '-0.3px' }}>{f.title}</h3>
              <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.7', margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ background: '#f8fafc', borderTop: '1px solid #e5e7eb', padding: '96px 48px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center' as const, marginBottom: '56px' }}>
            <p style={{ fontSize: '12px', fontWeight: '700', color: '#16a34a', textTransform: 'uppercase' as const, letterSpacing: '1px', margin: '0 0 12px' }}>Trusted by Ontario contractors</p>
            <h2 style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '-1px', color: '#0a0a0a', margin: 0 }}>What they say</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {[
              { quote: 'The AI quote generator alone saves me 2 hours a week. I describe the job on site and it builds the whole thing with line items and HST.', name: 'Mike Karalus', role: 'Electrician, London ON' },
              { quote: 'I used to dread WSIB filing. Now I just check TradeDesk once a month. It has everything ready — the numbers, the due date, everything.', name: 'Jason Patel', role: 'Plumber, Hamilton ON' },
              { quote: 'Customers pay the same day I send the invoice now. Before TradeDesk I was chasing cheques for 60 days. It is a completely different business.', name: 'Rick Fortier', role: 'HVAC Tech, Ottawa ON' },
            ].map(t => (
              <div key={t.name} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '28px' }}>
                <p style={{ fontSize: '15px', color: '#374151', lineHeight: '1.7', margin: '0 0 20px', fontStyle: 'italic' as const }}>"{t.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', background: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '14px' }}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p style={{ fontWeight: '700', color: '#111', fontSize: '14px', margin: 0 }}>{t.name}</p>
                    <p style={{ color: '#9ca3af', fontSize: '12px', margin: 0 }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ maxWidth: '1200px', margin: '0 auto', padding: '96px 48px' }}>
        <div style={{ textAlign: 'center' as const, marginBottom: '56px' }}>
          <p style={{ fontSize: '12px', fontWeight: '700', color: '#16a34a', textTransform: 'uppercase' as const, letterSpacing: '1px', margin: '0 0 12px' }}>Simple pricing</p>
          <h2 style={{ fontSize: '40px', fontWeight: '900', letterSpacing: '-1.5px', color: '#0a0a0a', margin: '0 0 12px' }}>Pay for what you use</h2>
          <p style={{ color: '#6b7280', fontSize: '16px', margin: 0 }}>Start free for 14 days. No credit card required.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '760px', margin: '0 auto' }}>
          {[
            { name: 'Starter', price: '$99', desc: 'Everything you need to run your trade business.', features: ['Unlimited quotes + invoices', 'Jobs + appointment scheduling', 'WSIB tracking', 'Stripe payment links', 'Client CRM', 'Receipt scanning', 'Email + SMS reminders'], highlight: false },
            { name: 'Pro', price: '$199', desc: 'For contractors who want the edge.', features: ['Everything in Starter', 'AI Quote Generator', 'AI Profit Analyzer', 'AI Business Assistant', 'Apprenticeship hour tracker', 'Public contractor profile', 'Priority support'], highlight: true },
          ].map(plan => (
            <div key={plan.name} style={{ border: `2px solid ${plan.highlight ? '#16a34a' : '#e5e7eb'}`, borderRadius: '16px', padding: '32px', position: 'relative' as const, background: plan.highlight ? '#f0fdf4' : 'white' }}>
              {plan.highlight && (
                <div style={{ position: 'absolute' as const, top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#16a34a', color: 'white', borderRadius: '100px', padding: '4px 16px', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap' as const, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
                  Most Popular
                </div>
              )}
              <p style={{ fontWeight: '800', fontSize: '18px', color: '#111', margin: '0 0 4px' }}>{plan.name}</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', margin: '0 0 8px' }}>
                <span style={{ fontSize: '44px', fontWeight: '900', color: '#0a0a0a', letterSpacing: '-2px', lineHeight: '1' }}>{plan.price}</span>
                <span style={{ color: '#6b7280', fontSize: '14px', marginBottom: '6px' }}>/month</span>
              </div>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 24px' }}>{plan.desc}</p>
              <Link href="/signup" style={{ display: 'block', textAlign: 'center' as const, padding: '13px', background: plan.highlight ? '#16a34a' : 'white', color: plan.highlight ? 'white' : '#16a34a', border: `1px solid ${plan.highlight ? '#16a34a' : '#bbf7d0'}`, borderRadius: '8px', fontWeight: '700', fontSize: '15px', textDecoration: 'none', marginBottom: '24px' }}>
                Start Free Trial
              </Link>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '16px', height: '16px', background: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <span style={{ fontSize: '14px', color: '#374151' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#0a0a0a', padding: '96px 48px', textAlign: 'center' as const }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '44px', fontWeight: '900', color: 'white', letterSpacing: '-2px', margin: '0 0 16px', lineHeight: '1.1' }}>
            Start running your<br />business better today.
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '16px', margin: '0 0 36px', lineHeight: '1.6' }}>
            14 days free. No credit card. Built for Ontario contractors.
          </p>
          <Link href="/signup" style={{ display: 'inline-block', padding: '16px 36px', background: '#16a34a', color: 'white', borderRadius: '8px', fontWeight: '800', fontSize: '16px', textDecoration: 'none', boxShadow: '0 4px 20px rgba(22,163,74,0.4)' }}>
            Create your free account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0a0a0a', borderTop: '1px solid #1f2937', padding: '40px 48px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="4" height="16" fill="#ffffff"/><rect x="2" y="18" width="20" height="4" fill="#ffffff"/><rect x="6" y="18" width="4" height="4" fill="#16a34a"/></svg>
            <span style={{ fontWeight: '700', color: 'white', fontSize: '15px' }}>TradeDesk</span>
          </div>
          <p style={{ color: '#4b5563', fontSize: '13px', margin: 0 }}>Built for Ontario contractors. Canadian data storage.</p>
          <div style={{ display: 'flex', gap: '24px' }}>
            <Link href="/login" style={{ color: '#6b7280', fontSize: '13px', textDecoration: 'none' }}>Sign in</Link>
            <Link href="/signup" style={{ color: '#6b7280', fontSize: '13px', textDecoration: 'none' }}>Sign up</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
