'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const FF = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const STEPS = [
  {
    id: 'profile',
    title: 'Complete your profile',
    time: '2 min',
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
    description: 'Add your trade type, company name, phone number, and address. This information appears on every quote, invoice, and email you send — a complete profile looks more professional to clients.',
    tips: [
      'Your trade type helps AI generate more accurate, realistic quotes',
      'Add your company name so clients recognize every document you send',
      'You can add a logo URL to have it appear on quotes and invoices',
    ],
    cta: 'Open settings',
    href: '/settings',
    icon: (c: string) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="11" r="6" stroke={c} strokeWidth="2.2"/>
        <path d="M4 28c0-6.6 5.4-11 12-11s12 4.4 12 11" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'quote',
    title: 'Create your first AI quote',
    time: '3 min',
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    description: 'Describe a job in plain English — "200A panel upgrade, 3 bed house, London ON" — and AI writes a professional itemized quote with 13% HST automatically applied. Takes under a minute.',
    tips: [
      'Be specific about the job scope and location for better line items',
      'You can edit any AI-generated line item before sending',
      'Add the customer name to automatically create them in your CRM',
    ],
    cta: 'Create a quote',
    href: '/quotes/new',
    icon: (c: string) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="3" width="18" height="24" rx="2.5" stroke={c} strokeWidth="2.2"/>
        <path d="M9 10h10M9 14h10M9 18h6" stroke={c} strokeWidth="2" strokeLinecap="round"/>
        <circle cx="25" cy="25" r="5" fill={c}/>
        <path d="M25 22.5v2.5H27.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'pricebook',
    title: 'Build your pricebook',
    time: '5 min',
    color: '#b45309',
    bg: '#fefce8',
    border: '#fde68a',
    description: 'Add your standard flat-rate prices for common jobs and materials. When AI generates a quote, it pulls from your pricebook automatically — so your prices stay consistent across every job.',
    tips: [
      'Add your most common services first — panel upgrades, service calls, etc.',
      'Pricebook items auto-populate when AI generates quotes',
      'Include both labour and material rates for accurate quotes',
    ],
    cta: 'Open pricebook',
    href: '/pricebook',
    icon: (c: string) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="24" height="24" rx="3" stroke={c} strokeWidth="2.2"/>
        <path d="M10 11h12M10 16h8" stroke={c} strokeWidth="2" strokeLinecap="round"/>
        <path d="M17 21l2.5 2.5L24 19" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'wsib',
    title: 'Set up WSIB tracking',
    time: '2 min',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    description: 'Enter your WSIB premium rate once. TradeDesk auto-calculates what you owe each period based on your logged earnings, and emails you 3 days before every filing deadline — no more missed payments or penalties.',
    tips: [
      'Find your rate class on the WSIB Ontario website under "Premium rates"',
      'Log your gross reportable earnings after every client payment',
      'Mark entries as paid after you file to keep your balance current',
    ],
    cta: 'Set up WSIB',
    href: '/wsib',
    icon: (c: string) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M16 3L27 8.5v8C27 23 22 27.5 16 29 10 27.5 5 23 5 16.5v-8z" stroke={c} strokeWidth="2.2" strokeLinejoin="round"/>
        <path d="M10 16l4 4 8-8" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'invoice',
    title: 'Send an invoice with a payment link',
    time: '3 min',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    description: 'Convert any approved quote to an invoice in one click. Connect Stripe once and every invoice automatically gets a payment link — customers pay by Visa, Mastercard, or bank transfer the same day they receive it.',
    tips: [
      'Connect Stripe under Settings → Subscription to enable payment links',
      'HST is already calculated and shown as a separate line on every invoice',
      'Customers pay from their phone without creating any account',
    ],
    cta: 'Go to invoices',
    href: '/invoices',
    icon: (c: string) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M6 4h20v24l-3.5-2.5L19 28l-3-2-3 2-2.5-2.5L7 28z" stroke={c} strokeWidth="2.2" strokeLinejoin="round"/>
        <path d="M10 11h12M10 15h12M10 19h8" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'client',
    title: 'Add your first client',
    time: '1 min',
    color: '#0369a1',
    bg: '#f0f9ff',
    border: '#bae6fd',
    description: "Build your client CRM as you work. Every client stores their full history — quotes sent, invoices paid, jobs completed, and all contact info — so you always know exactly where things stand with each customer.",
    tips: [
      'Clients are automatically created when you use their name on a quote',
      'Add notes to remember how you met or any special job instructions',
      'Filter clients by trade type or location for targeted follow-ups',
    ],
    cta: 'Add a client',
    href: '/clients',
    icon: (c: string) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="12" cy="10" r="5.5" stroke={c} strokeWidth="2.2"/>
        <path d="M3 28c0-5 4-9 9-9s9 4 9 9" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
        <circle cx="25" cy="12" r="4" stroke={c} strokeWidth="2"/>
        <path d="M28 25c.5.5 2 2 2 4" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'job',
    title: 'Schedule and track a job',
    time: '2 min',
    color: '#b45309',
    bg: '#fefce8',
    border: '#fde68a',
    description: 'Create a job, assign it to a client, set the date and time, and track its status from scheduled to in-progress to complete. Attach before and after photos from the job site and generate a professional PDF report when done.',
    tips: [
      'Use the Report button to generate a detailed job summary PDF for your records',
      'Attach photos directly from your phone while on site',
      'Marking a job complete can trigger an automatic Google review request',
    ],
    cta: 'Create a job',
    href: '/jobs',
    icon: (c: string) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M22 4c2.5 0 6 3.5 6 6 0 1.8-1 3-2.5 4.2L10 28 4 22 17.5 7.5C18.8 5.8 20.5 4 22 4z" stroke={c} strokeWidth="2.2" strokeLinejoin="round"/>
        <path d="M19 7.5l5 5" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'appointments',
    title: 'Book your first appointment',
    time: '2 min',
    color: '#0891b2',
    bg: '#ecfeff',
    border: '#a5f3fc',
    description: 'Schedule customer appointments with date, time, and job type. TradeDesk sends automatic SMS reminders to customers the day before so they never forget — and you never show up to a no-show.',
    tips: [
      'SMS reminders go out automatically the day before each appointment',
      'Add customer phone number to make sure reminders get sent',
      'View all appointments in your calendar to plan your week',
    ],
    cta: 'Book an appointment',
    href: '/appointments',
    icon: (c: string) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="3" y="6" width="26" height="22" rx="3" stroke={c} strokeWidth="2.2"/>
        <path d="M3 13h26" stroke={c} strokeWidth="2"/>
        <path d="M9 3v6M23 3v6" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
        <path d="M10 21l3.5 3.5L22 18" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'receipts',
    title: 'Scan your first receipt',
    time: '2 min',
    color: '#15803d',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    description: 'Photograph any receipt from the job site — Home Depot, Rona, tool suppliers, fuel. AI automatically extracts every line item, amount, and vendor. Attach receipts to jobs to track actual costs vs. what you quoted.',
    tips: [
      'Take the photo in good lighting — contrast helps AI extraction accuracy',
      'Attach receipts to jobs to see your real cost margin vs. quoted amount',
      'All receipts are automatically categorized for tax time',
    ],
    cta: 'Scan a receipt',
    href: '/receipts',
    icon: (c: string) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="6" y="2" width="16" height="22" rx="2" stroke={c} strokeWidth="2.2"/>
        <path d="M9 8h10M9 12h10M9 16h6" stroke={c} strokeWidth="2" strokeLinecap="round"/>
        <circle cx="22" cy="22" r="7" fill="white" stroke={c} strokeWidth="2"/>
        <path d="M22 19v3l2 1.5" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'crew',
    title: 'Add your crew and subcontractors',
    time: '3 min',
    color: '#0369a1',
    bg: '#f0f9ff',
    border: '#bae6fd',
    description: 'Add your subcontractors and crew members with their trade, WSIB number, and certificate expiry dates. TradeDesk warns you before anyone\'s certificate lapses — because hiring a sub with an expired cert makes you liable.',
    tips: [
      'Add everyone you regularly work with so WSIB tracking is automatic',
      'You\'ll get a warning banner 30 days before any certificate expires',
      'Track each crew member\'s WSIB rate class for accurate compliance',
    ],
    cta: 'Add crew members',
    href: '/crew',
    icon: (c: string) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="10" cy="10" r="4.5" stroke={c} strokeWidth="2.2"/>
        <circle cx="22" cy="10" r="4.5" stroke={c} strokeWidth="2.2"/>
        <path d="M2 26c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
        <path d="M19 22c1-1.8 3-3 5-3 2.8 0 5 2 5 5" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'insurance',
    title: 'Track your insurance (COI)',
    time: '2 min',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    description: 'Add your Certificate of Insurance, general liability, and any other policies. TradeDesk tracks expiry dates and alerts you before any coverage lapses — so you\'re never caught working without valid insurance.',
    tips: [
      'Upload your COI document so you have a copy ready to send clients',
      'Many commercial clients require proof of insurance before work starts',
      'Set a reminder 60 days before expiry to give yourself time to renew',
    ],
    cta: 'Add insurance',
    href: '/insurance',
    icon: (c: string) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M4 4h24v24H4z" rx="2" stroke={c} strokeWidth="2.2"/>
        <rect x="4" y="4" width="24" height="24" rx="2" stroke={c} strokeWidth="2.2"/>
        <path d="M10 13l3 3 9-9" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 20h12" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'assistant',
    title: 'Try the AI assistant',
    time: '2 min',
    color: '#8b5cf6',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    description: 'The AI assistant has access to your actual business data — your quotes, invoices, jobs, and revenue. Ask it anything about your business in plain English and get real, data-backed answers instantly.',
    tips: [
      'Try: "What were my top 5 jobs last month?" or "Which invoices are unpaid?"',
      'Ask: "How much HST did I collect this quarter?" for instant tax prep',
      'The more data you add to TradeDesk, the smarter the answers get',
    ],
    cta: 'Open AI assistant',
    href: '/assistant',
    icon: (c: string) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M16 3l2 9.5L27 16l-9 2.5L16 28l-2-9.5L5 16l9-2.5z" stroke={c} strokeWidth="2.2" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'profit',
    title: 'Analyze your profits',
    time: '2 min',
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    description: 'The Profit Analyzer pulls your quotes, invoices, and job costs together and shows you exactly where your money is going. See your top revenue sources, average job value, collection rate, and where you\'re leaving money on the table.',
    tips: [
      'Run the analyzer monthly to catch declining margins early',
      'Compare your quote-to-win rate to see how often customers accept',
      'Attach receipts to jobs first so cost data is accurate',
    ],
    cta: 'Open profit analyzer',
    href: '/profit',
    icon: (c: string) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <polyline points="4,26 10,18 15,21 22,12 28,6" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="23,6 28,6 28,11" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'leads',
    title: 'Set up the AI missed-call handler',
    time: '3 min',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    description: 'When a customer calls and you\'re on the job, TradeDesk\'s AI texts them back automatically: "Hi, I\'m on a job right now — what can I help you with?" It captures their name, job type, and address, and creates a lead in your inbox.',
    tips: [
      'Requires a Twilio phone number — set it up in Settings → SMS Leads',
      'You review and respond to every AI-captured lead from the Leads inbox',
      'Never lose a customer because you couldn\'t pick up on the job',
    ],
    cta: 'Set up SMS leads',
    href: '/leads',
    icon: (c: string) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M27 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6l3 4 3-4h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" stroke={c} strokeWidth="2.2" strokeLinejoin="round"/>
        <path d="M9 11h14M9 15h9" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'apprenticeship',
    title: 'Log apprenticeship hours',
    time: '2 min',
    color: '#0369a1',
    bg: '#f0f9ff',
    border: '#bae6fd',
    description: 'Track your hours toward your Red Seal or Certificate of Qualification under Skilled Trades Ontario. Log hours by employer, supervisor, and task type — and export a clean record at any time for submission.',
    tips: [
      'Log hours right after each shift so nothing gets missed',
      'Include supervisor name and employer for each entry as required by STO',
      'Export a full log at any time for submission to Skilled Trades Ontario',
    ],
    cta: 'Log hours',
    href: '/apprenticeship',
    icon: (c: string) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <polygon points="16,4 28,10 16,16 4,10" stroke={c} strokeWidth="2.2" strokeLinejoin="round"/>
        <path d="M8 14v7c0 0 3 4 8 4s8-4 8-4v-7" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'booking',
    title: 'Enable online booking',
    time: '2 min',
    color: '#0891b2',
    bg: '#ecfeff',
    border: '#a5f3fc',
    description: "Turn on your public booking page so customers can book appointments without calling. You set working hours, available days, and slot duration — they pick a time that works. All bookings land in your Appointments calendar automatically.",
    tips: [
      'Set a minimum notice time (24–48 hours) to avoid same-day surprises',
      'Your booking link is tradedesk.ca/book/your-slug — share it anywhere',
      'New bookings trigger an instant email notification to you',
    ],
    cta: 'Enable booking',
    href: '/settings',
    icon: (c: string) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="12" stroke={c} strokeWidth="2.2"/>
        <path d="M16 9v7l4 4" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4 16h3M25 16h3M16 4v3M16 25v3" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'public',
    title: 'Go public — share your profile',
    time: '1 min',
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    description: 'Enable your public contractor profile and share the link anywhere — Instagram, Facebook, Google, your website. Customers can see your trade, services, and send you quote requests directly from your profile page.',
    tips: [
      'Share your profile link in your Instagram bio and Google Business listing',
      'Quote requests from your profile appear directly in your Quotes inbox',
      'Enable online booking so customers can self-book from your profile',
    ],
    cta: 'Enable public profile',
    href: '/settings',
    icon: (c: string) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="12" stroke={c} strokeWidth="2.2"/>
        <path d="M16 4c0 0-5 6-5 12s5 12 5 12" stroke={c} strokeWidth="2"/>
        <path d="M16 4c0 0 5 6 5 12s-5 12-5 12" stroke={c} strokeWidth="2"/>
        <path d="M4 16h24" stroke={c} strokeWidth="2"/>
        <path d="M5.5 10h21M5.5 22h21" stroke={c} strokeWidth="1.6"/>
      </svg>
    ),
  },
];

export const ONBOARDING_TOTAL = STEPS.length;

export default function OnboardingPage() {
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUserId(user.id);

    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_steps')
      .eq('id', user.id)
      .single();

    const done = new Set<string>(profile?.onboarding_steps || []);
    setCompletedSteps(done);

    const firstIncomplete = STEPS.findIndex(s => !done.has(s.id));
    setCurrentIdx(firstIncomplete === -1 ? STEPS.length - 1 : firstIncomplete);
    setLoading(false);
  }

  async function markDone(stepId: string) {
    if (!userId) return;
    setSaving(true);
    const newCompleted = new Set(completedSteps);
    newCompleted.add(stepId);
    setCompletedSteps(newCompleted);

    await supabase
      .from('profiles')
      .update({ onboarding_steps: Array.from(newCompleted) })
      .eq('id', userId);

    setSaving(false);

    const nextIdx = STEPS.findIndex((s, i) => i > currentIdx && !newCompleted.has(s.id));
    if (nextIdx !== -1) {
      setCurrentIdx(nextIdx);
    } else {
      const anyNext = STEPS.findIndex(s => !newCompleted.has(s.id));
      if (anyNext !== -1) setCurrentIdx(anyNext);
    }
  }

  function skipStep() {
    if (currentIdx < STEPS.length - 1) setCurrentIdx(currentIdx + 1);
  }

  const allDone = completedSteps.size >= STEPS.length;
  const step = STEPS[currentIdx];
  const isDone = step ? completedSteps.has(step.id) : false;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: FF, color: '#9ca3af', fontSize: '14px' }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: FF, overflow: 'hidden' }}>
      <style>{`
        @media (max-width: 768px) {
          .ob-sidebar { display: none !important; }
          .ob-main { padding: 24px 20px !important; }
          .ob-tips { display: none !important; }
          .ob-actions { flex-direction: column !important; gap: 10px !important; }
          .ob-btn-primary { width: 100% !important; text-align: center !important; justify-content: center !important; }
        }
      `}</style>

      {/* Left sidebar */}
      <div className="ob-sidebar" style={{ width: '260px', minWidth: '260px', background: '#0a0a0a', display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* Logo */}
        <div style={{ padding: '22px 20px', borderBottom: '1px solid #1c1c1c', flexShrink: 0 }}>
          <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="4" height="16" fill="#ffffff"/><rect x="2" y="18" width="20" height="4" fill="#ffffff"/><rect x="6" y="18" width="4" height="4" fill="#16a34a"/></svg>
            <span style={{ color: '#f5f5f5', fontWeight: '700', fontSize: '14px', letterSpacing: '-0.3px' }}>TradeDesk</span>
          </a>
        </div>

        {/* Progress */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1c1c1c', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
            <span style={{ fontSize: '20px', fontWeight: '900', color: '#f5f5f5', letterSpacing: '-0.8px' }}>{completedSteps.size}</span>
            <span style={{ fontSize: '13px', color: '#525252' }}>of {STEPS.length} complete</span>
          </div>
          <div style={{ height: '3px', background: '#1c1c1c', borderRadius: '2px' }}>
            <div style={{ height: '100%', width: `${(completedSteps.size / STEPS.length) * 100}%`, background: '#16a34a', borderRadius: '2px', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Step list */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
          {STEPS.map((s, i) => {
            const done = completedSteps.has(s.id);
            const active = i === currentIdx;
            return (
              <button
                key={s.id}
                onClick={() => setCurrentIdx(i)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '9px 20px', background: active ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', borderLeft: `2px solid ${active ? '#16a34a' : 'transparent'}`, cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `1.5px solid ${done ? '#16a34a' : active ? '#525252' : '#2e2e2e'}`, background: done ? '#16a34a' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {done ? (
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5l2.5 2.5L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  ) : (
                    <span style={{ fontSize: '9px', color: active ? '#9ca3af' : '#383838', fontWeight: '700' }}>{i + 1}</span>
                  )}
                </div>
                <span style={{ fontSize: '12px', color: done ? '#383838' : active ? '#f5f5f5' : '#525252', fontWeight: active ? '600' : '400', lineHeight: '1.35' }}>
                  {s.title}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #1c1c1c', flexShrink: 0 }}>
          <a href="/dashboard" style={{ fontSize: '12px', color: '#383838', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Back to dashboard
          </a>
        </div>
      </div>

      {/* Main content */}
      <div className="ob-main" style={{ flex: 1, overflowY: 'auto', padding: '48px 64px', background: '#fafafa' }}>

        {allDone ? (
          /* Completion screen */
          <div style={{ maxWidth: '520px', margin: '40px auto 0', textAlign: 'center' }}>
            <div style={{ width: '72px', height: '72px', background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
              <svg width="32" height="26" viewBox="0 0 32 26" fill="none"><path d="M2 13l9 9L30 2" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0a0a0a', letterSpacing: '-1.2px', margin: '0 0 12px' }}>You're all set.</h1>
            <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: '1.7', margin: '0 0 36px' }}>
              You've completed all {STEPS.length} steps. TradeDesk is fully set up for your business — you can always come back to revisit any feature.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' as const }}>
              <a href="/dashboard" style={{ padding: '13px 28px', background: '#16a34a', color: 'white', borderRadius: '8px', fontWeight: '700', fontSize: '15px', textDecoration: 'none', boxShadow: '0 4px 16px rgba(22,163,74,0.3)' }}>
                Go to dashboard
              </a>
              <a href="/quotes/new" style={{ padding: '13px 28px', background: 'white', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', fontWeight: '600', fontSize: '15px', textDecoration: 'none' }}>
                Create a quote
              </a>
            </div>
          </div>
        ) : step ? (
          /* Step content */
          <div style={{ maxWidth: '600px' }}>
            {/* Step counter */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '1px' }}>
                Step {currentIdx + 1} of {STEPS.length}
              </span>
              <a href="/dashboard" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none', fontWeight: '500' }}>
                Skip for now
              </a>
            </div>

            {/* Icon */}
            <div style={{ width: '72px', height: '72px', background: step.bg, border: `1.5px solid ${step.border}`, borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              {step.icon(step.color)}
            </div>

            {/* Title + time */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' as const }}>
              <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#0a0a0a', letterSpacing: '-1px', margin: 0 }}>
                {step.title}
              </h1>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '100px', padding: '3px 10px', fontSize: '12px', fontWeight: '600', color: '#6b7280', whiteSpace: 'nowrap' as const }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5.5 3v2.5L7 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {step.time}
              </span>
            </div>

            {/* Description */}
            <p style={{ fontSize: '16px', color: '#374151', lineHeight: '1.75', margin: '0 0 32px' }}>
              {step.description}
            </p>

            {/* Tips */}
            <div className="ob-tips" style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '20px 24px', marginBottom: '32px' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '0.8px', margin: '0 0 12px' }}>Tips</p>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
                {step.tips.map((tip, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '16px', height: '16px', background: step.bg, border: `1px solid ${step.border}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                      <svg width="7" height="6" viewBox="0 0 7 6" fill="none"><path d="M1 3l2 2 3-4" stroke={step.color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <span style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.5' }}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="ob-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' as const }}>
              {isDone ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                    <svg width="14" height="12" viewBox="0 0 14 12" fill="none"><path d="M1 6l4 4 8-9" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#15803d' }}>Completed</span>
                  </div>
                  {currentIdx < STEPS.length - 1 && (
                    <button
                      onClick={() => setCurrentIdx(currentIdx + 1)}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 22px', background: '#0a0a0a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', fontFamily: FF }}
                    >
                      Next step
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  )}
                </>
              ) : (
                <>
                  <a
                    className="ob-btn-primary"
                    href={step.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 24px', background: step.color, color: 'white', borderRadius: '8px', fontWeight: '700', fontSize: '14px', textDecoration: 'none', boxShadow: `0 4px 16px ${step.color}33` }}
                  >
                    {step.cta}
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 11L11 2M11 2H6M11 2v5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </a>
                  <button
                    onClick={() => markDone(step.id)}
                    disabled={saving}
                    style={{ padding: '13px 20px', background: 'white', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', fontFamily: FF, opacity: saving ? 0.6 : 1 }}
                  >
                    {saving ? 'Saving...' : 'Mark as done'}
                  </button>
                  {currentIdx < STEPS.length - 1 && (
                    <button
                      onClick={skipStep}
                      style={{ padding: '13px 16px', background: 'transparent', color: '#9ca3af', border: 'none', fontSize: '13px', cursor: 'pointer', fontFamily: FF }}
                    >
                      Skip
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Prev / Next navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #f3f4f6' }}>
              <button
                onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                disabled={currentIdx === 0}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: currentIdx === 0 ? '#e5e7eb' : '#6b7280', fontSize: '13px', cursor: currentIdx === 0 ? 'default' : 'pointer', fontFamily: FF, fontWeight: '500', padding: 0 }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Previous
              </button>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' as const, justifyContent: 'center', maxWidth: '200px' }}>
                {STEPS.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setCurrentIdx(i)}
                    style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === currentIdx ? '#0a0a0a' : completedSteps.has(s.id) ? '#16a34a' : '#e5e7eb', border: 'none', cursor: 'pointer', padding: 0, transition: 'background 0.2s' }}
                  />
                ))}
              </div>
              <button
                onClick={() => setCurrentIdx(Math.min(STEPS.length - 1, currentIdx + 1))}
                disabled={currentIdx === STEPS.length - 1}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: currentIdx === STEPS.length - 1 ? '#e5e7eb' : '#6b7280', fontSize: '13px', cursor: currentIdx === STEPS.length - 1 ? 'default' : 'pointer', fontFamily: FF, fontWeight: '500', padding: 0 }}
              >
                Next
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
