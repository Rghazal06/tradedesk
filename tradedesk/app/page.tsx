import Link from "next/link";

export default function Home() {
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: 'white', color: '#1a1a1a' }}>
      
      {/* Navbar */}
      <nav style={{ borderBottom: '1px solid #e5e7eb', padding: '0 48px', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'white', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', background: '#16a34a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '13px' }}>TD</div>
          <span style={{ fontWeight: '700', fontSize: '18px', color: '#111' }}>TradeDesk</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <a href="#features" style={{ color: '#4b5563', fontSize: '14px', textDecoration: 'none', fontWeight: '500' }}>Features</a>
          <a href="#pricing" style={{ color: '#4b5563', fontSize: '14px', textDecoration: 'none', fontWeight: '500' }}>Pricing</a>
          <a href="#why" style={{ color: '#4b5563', fontSize: '14px', textDecoration: 'none', fontWeight: '500' }}>Why TradeDesk</a>
          <Link href="/login" style={{ color: '#4b5563', fontSize: '14px', textDecoration: 'none', fontWeight: '500' }}>Log In</Link>
          <Link href="/signup" style={{ background: '#16a34a', color: 'white', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}>Start Free Trial</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '80px 48px 60px', maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '100px', padding: '6px 14px', marginBottom: '24px' }}>
            <span style={{ width: '6px', height: '6px', background: '#16a34a', borderRadius: '50%', display: 'inline-block' }}></span>
            <span style={{ color: '#15803d', fontSize: '13px', fontWeight: '600' }}>Built exclusively for Ontario contractors</span>
          </div>
          <h1 style={{ fontSize: '52px', fontWeight: '800', lineHeight: '1.1', color: '#111', margin: '0 0 24px', letterSpacing: '-1.5px' }}>
            Run your trade business from your phone
          </h1>
          <p style={{ fontSize: '18px', color: '#4b5563', lineHeight: '1.7', margin: '0 0 36px' }}>
            The only business software built specifically for Ontario contractors. Quote faster, get paid sooner, track WSIB automatically — all in one place.
          </p>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link href="/signup" style={{ background: '#16a34a', color: 'white', padding: '14px 28px', borderRadius: '10px', fontSize: '16px', fontWeight: '700', textDecoration: 'none', boxShadow: '0 4px 14px rgba(22,163,74,0.3)' }}>
              Start Free Trial
            </Link>
            <Link href="/login" style={{ color: '#374151', padding: '14px 28px', borderRadius: '10px', fontSize: '16px', fontWeight: '600', textDecoration: 'none', border: '1px solid #e5e7eb' }}>
              Log In →
            </Link>
          </div>
          <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '16px' }}>No credit card required. 14-day free trial.</p>
          <div style={{ display: 'flex', gap: '32px', marginTop: '48px', paddingTop: '32px', borderTop: '1px solid #f3f4f6' }}>
            {[
              { value: '100+', label: 'Ontario contractors' },
              { value: '4.9★', label: 'Average rating' },
              { value: '$0', label: 'Setup cost' },
            ].map(stat => (
              <div key={stat.label}>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#111' }}>{stat.value}</div>
                <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Image */}
        <div style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.12)' }}>
          <img
            src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80"
            alt="Contractor using TradeDesk on phone"
            style={{ width: '100%', height: '420px', objectFit: 'cover', display: 'block' }}
          />
          <div style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderRadius: '12px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Quote sent to customer</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#111', marginTop: '2px' }}>$4,520 + HST</div>
            </div>
            <div style={{ background: '#16a34a', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}>✓ Approved</div>
          </div>
        </div>
      </section>

      {/* Trusted by with photos */}
      <section style={{ background: '#f9fafb', padding: '48px', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p style={{ color: '#9ca3af', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '32px', textAlign: 'center' }}>Trusted by Ontario trades professionals</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '32px' }}>
            {[
              { img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&q=80', trade: 'Electrician' },
              { img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80', trade: 'Plumber' },
              { img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300&q=80', trade: 'General Contractor' },
              { img: 'https://images.unsplash.com/photo-1581092335397-9583eb92d232?w=300&q=80', trade: 'HVAC Tech' },
              { img: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=300&q=80', trade: 'Roofer' },
            ].map(p => (
              <div key={p.trade} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', height: '160px' }}>
                <img src={p.img} alt={p.trade} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.6))', padding: '16px 12px 10px' }}>
                  <span style={{ color: 'white', fontSize: '12px', fontWeight: '700' }}>{p.trade}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', flexWrap: 'wrap' }}>
            {['⚡ Electricians', '🔧 Plumbers', '❄️ HVAC', '🏠 General Contractors', '🏗️ Roofers'].map(trade => (
              <span key={trade} style={{ color: '#4b5563', fontSize: '15px', fontWeight: '600' }}>{trade}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Why TradeDesk */}
      <section id="why" style={{ padding: '80px 48px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <h2 style={{ fontSize: '38px', fontWeight: '800', color: '#111', margin: '0 0 16px', letterSpacing: '-1px' }}>Why Ontario contractors choose TradeDesk</h2>
          <p style={{ color: '#6b7280', fontSize: '18px', maxWidth: '560px', margin: '0 auto', lineHeight: '1.6' }}>Every US tool ignores Ontario regulations. We built TradeDesk specifically for you.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {[
            { icon: '🛡️', title: 'WSIB Tracking Built In', desc: 'Automatically track reportable earnings, calculate premiums, and never miss a filing deadline. No US tool does this.', highlight: 'Ontario exclusive' },
            { icon: '🏛️', title: 'HST Auto-Calculated', desc: 'Every quote and invoice automatically calculates 13% Ontario HST. Your CRA filings become simple.', highlight: 'Ontario exclusive' },
            { icon: '✨', title: 'AI Quote Generator', desc: 'Describe any job in plain English. Our AI instantly generates professional line items with Ontario market rates.', highlight: 'Saves 2+ hours/week' },
            { icon: '💳', title: 'Get Paid Online', desc: 'Customers approve quotes and pay invoices online. No more chasing payments by phone.', highlight: 'Avg 3x faster payment' },
            { icon: '📱', title: 'Works From Your Phone', desc: 'Create quotes on the job site, invoice from your truck. TradeDesk works everywhere you work.', highlight: 'Mobile first' },
            { icon: '🤖', title: 'AI Profit Analyzer', desc: 'Every month, AI analyzes your business and tells you exactly how to make more money.', highlight: 'Unique to TradeDesk' },
          ].map(feature => (
            <div key={feature.title} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '28px' }}>
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '16px' }}>{feature.icon}</span>
              <div style={{ display: 'inline-block', background: '#f0fdf4', color: '#15803d', fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '100px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{feature.highlight}</div>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#111', margin: '0 0 10px' }}>{feature.title}</h3>
              <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ background: '#f9fafb', padding: '80px 48px', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontSize: '38px', fontWeight: '800', color: '#111', margin: '0 0 16px', letterSpacing: '-1px' }}>Everything you need, nothing you don't</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {[
              { icon: '📋', title: 'Smart Quotes', desc: 'AI-powered quotes in seconds' },
              { icon: '🧾', title: 'Invoicing', desc: 'One-click from quote to invoice' },
              { icon: '💰', title: 'Online Payments', desc: 'Stripe-powered payment links' },
              { icon: '🛡️', title: 'WSIB Tracking', desc: 'Ontario compliance automated' },
              { icon: '📅', title: 'Job Scheduling', desc: 'Manage your crew calendar' },
              { icon: '⭐', title: 'Review Requests', desc: 'Auto SMS after job completion' },
              { icon: '🔗', title: 'Customer Portal', desc: 'Clients approve quotes online' },
              { icon: '🤖', title: 'AI Analyzer', desc: 'Monthly business insights' },
            ].map(f => (
              <div key={f.title} style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: '24px', display: 'block', marginBottom: '10px' }}>{f.icon}</span>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#111', marginBottom: '4px' }}>{f.title}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials with real photos */}
      <section style={{ padding: '80px 48px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <h2 style={{ fontSize: '38px', fontWeight: '800', color: '#111', margin: '0 0 16px', letterSpacing: '-1px' }}>Ontario contractors love TradeDesk</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {[
            {
              name: 'Mike T.',
              trade: 'Electrician, London ON',
              quote: 'The WSIB tracking alone saves me hours every month. Finally a tool built for Ontario.',
              img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80'
            },
            {
              name: 'Sarah K.',
              trade: 'HVAC Contractor, Hamilton ON',
              quote: 'The AI quote generator is insane. I describe the job and it gives me professional line items instantly.',
              img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80'
            },
            {
              name: 'Dave R.',
              trade: 'General Contractor, Ottawa ON',
              quote: 'Finally a tool that understands HST and WSIB. TradeDesk actually gets Ontario.',
              img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80'
            },
          ].map(t => (
            <div key={t.name} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '28px' }}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                {'★★★★★'.split('').map((s, i) => <span key={i} style={{ color: '#f59e0b', fontSize: '16px' }}>{s}</span>)}
              </div>
              <p style={{ color: '#374151', fontSize: '15px', lineHeight: '1.7', margin: '0 0 20px', fontStyle: 'italic' }}>"{t.quote}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src={t.img} alt={t.name} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}/>
                <div>
                  <div style={{ fontWeight: '700', color: '#111', fontSize: '14px' }}>{t.name}</div>
                  <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '2px' }}>{t.trade}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ background: '#f9fafb', padding: '80px 48px', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontSize: '38px', fontWeight: '800', color: '#111', margin: '0 0 16px', letterSpacing: '-1px' }}>Simple, transparent pricing</h2>
            <p style={{ color: '#6b7280', fontSize: '18px' }}>No hidden fees. Cancel anytime.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {[
              { name: 'Starter', price: '$99', period: '/month', desc: 'Perfect for solo contractors', features: ['Unlimited quotes & invoices', 'AI quote generator', 'WSIB tracking', 'Stripe payment links', 'Customer portal', 'Invoice reminders'], highlighted: false },
              { name: 'Pro', price: '$199', period: '/month', desc: 'For growing trades businesses', features: ['Everything in Starter', 'AI Profit Analyzer', 'SMS review requests', 'Job scheduling & crew', 'Apprenticeship tracking', 'Priority support'], highlighted: true },
            ].map(plan => (
              <div key={plan.name} style={{ background: plan.highlighted ? '#16a34a' : 'white', border: plan.highlighted ? 'none' : '1px solid #e5e7eb', borderRadius: '20px', padding: '36px', position: 'relative' }}>
                {plan.highlighted && <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#fbbf24', color: '#92400e', fontSize: '11px', fontWeight: '800', padding: '4px 16px', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Most Popular</div>}
                <div style={{ fontSize: '16px', fontWeight: '700', color: plan.highlighted ? 'rgba(255,255,255,0.8)' : '#6b7280', marginBottom: '8px' }}>{plan.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '48px', fontWeight: '800', color: plan.highlighted ? 'white' : '#111', letterSpacing: '-2px' }}>{plan.price}</span>
                  <span style={{ color: plan.highlighted ? 'rgba(255,255,255,0.6)' : '#6b7280', fontSize: '16px' }}>{plan.period}</span>
                </div>
                <p style={{ color: plan.highlighted ? 'rgba(255,255,255,0.7)' : '#6b7280', fontSize: '14px', marginBottom: '28px' }}>{plan.desc}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px' }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: plan.highlighted ? 'rgba(255,255,255,0.9)' : '#374151', fontSize: '14px' }}>
                      <span style={{ color: plan.highlighted ? '#bbf7d0' : '#16a34a', fontWeight: '700' }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" style={{ display: 'block', textAlign: 'center', background: plan.highlighted ? 'white' : '#16a34a', color: plan.highlighted ? '#16a34a' : 'white', padding: '14px', borderRadius: '10px', fontWeight: '700', fontSize: '15px', textDecoration: 'none' }}>Start Free Trial</Link>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px', marginTop: '24px' }}>14-day free trial · No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 48px', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '42px', fontWeight: '800', color: '#111', margin: '0 0 20px', letterSpacing: '-1.5px', lineHeight: '1.1' }}>Ready to run a better trade business?</h2>
        <p style={{ color: '#6b7280', fontSize: '18px', marginBottom: '36px', lineHeight: '1.6' }}>Join Ontario contractors who quote faster, get paid sooner, and stress less about paperwork.</p>
        <Link href="/signup" style={{ display: 'inline-block', background: '#16a34a', color: 'white', padding: '16px 36px', borderRadius: '12px', fontSize: '18px', fontWeight: '700', textDecoration: 'none', boxShadow: '0 8px 24px rgba(22,163,74,0.3)' }}>
          Start Your Free Trial Today
        </Link>
        <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '16px' }}>No credit card required · Setup in 5 minutes</p>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #e5e7eb', padding: '40px 48px', background: '#f9fafb' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', background: '#16a34a', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '11px' }}>TD</div>
            <span style={{ fontWeight: '700', color: '#111', fontSize: '15px' }}>TradeDesk</span>
          </div>
          <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>© 2026 TradeDesk. Built for Ontario contractors.</p>
          <div style={{ display: 'flex', gap: '24px' }}>
            <Link href="/login" style={{ color: '#6b7280', fontSize: '13px', textDecoration: 'none' }}>Log In</Link>
            <Link href="/signup" style={{ color: '#6b7280', fontSize: '13px', textDecoration: 'none' }}>Sign Up</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}