# TradeDesk — Claude Context File

This file gives any new Claude session full context on the TradeDesk project. Read this before touching any code.

---

## What is TradeDesk

B2B SaaS platform for Ontario contractors. Handles quotes, invoices, jobs, appointments, WSIB compliance tracking, AI features, client portal, automated SMS/email, and online payments. Built and run by Rayan Ghazal (3rd year CS, Western University, London ON). Currently in beta — seeking first paying contractors.

Live URL: https://mytradedesk.ca (also reachable at https://tradedesk-eight.vercel.app)
Local: http://localhost:3000
Repo: github.com/Rghazal06/tradedesk (main branch)
Supabase project: ibxxgkvsmuucnafeehrv.supabase.co (Canada Central)

---

## Tech Stack

- **Framework:** Next.js 16, App Router, TypeScript, React 19
- **Database/Auth:** Supabase (Postgres + Auth + Storage)
- **Payments:** Stripe — still in TEST mode (swap keys before go-live)
- **Email:** Resend (from: noreply@mytradedesk.ca)
- **SMS:** Twilio
- **AI:** OpenAI gpt-4o-mini (vision + chat + whisper)
- **Hosting:** Vercel (crons configured in vercel.json)

---

## Environment Variables

All of these must be in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@mytradedesk.ca
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
CRON_SECRET=
NEXT_PUBLIC_APP_URL=https://mytradedesk.ca
```

Stripe test card: `4242 4242 4242 4242`

---

## Strict Coding Rules — Never Break These

1. **Inline styles ONLY** — no Tailwind classes anywhere in page files. The project was built with inline styles from the start.
2. **No emojis in new pages** — existing pages have them, don't add more. NAV_ITEMS array is the only exception.
3. **React 19:** use `React.JSX.Element`, never plain `JSX.Element`.
4. **OpenAI** must be instantiated INSIDE request handlers, never at module level.
5. **Resend** must be instantiated INSIDE request handlers, never at module level.
6. **All API routes** must call `getAuthUser(req)` from `lib/apiAuth.ts` and return 401 if not authenticated — except explicitly public endpoints (portal, booking, quote approval).
7. **Service role client** for all server-side DB operations. Never trust client-supplied user IDs. Always use `.eq('user_id', user.id)` even with service role.
8. **Error responses** must use sanitized messages — never expose `error.message`, Supabase URLs, column names, or stack traces.
9. **Rate limiting** via `lib/rateLimit.ts` on all AI and public endpoints.
10. **Cron routes** must check `Authorization: Bearer <CRON_SECRET>` header.
11. **URL validation** — `/^https?:\/\//` before rendering stored URLs as `<a>` tags.
12. **Git:** always `git add <specific files>` — never `git add -A` (causes slow parent-directory scanning).

---

## Design System

- Page background: `#f8fafc`
- Cards: `background: white`, `border: 1px solid #e5e7eb`, `borderRadius: 12px`
- Primary color: `#16a34a` (green)
- Active nav item: `background: #f0fdf4`, `color: #16a34a`, `border: 1px solid #bbf7d0`
- Font: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- Primary button: `background: #16a34a`, `color: white`, `borderRadius: 8px`, `fontWeight: 600`
- Sidebar: sticky white, 240px wide
- Shared sidebar component: `components/Sidebar.tsx`

---

## Standard NAV_ITEMS (copy exactly — used on every app page)

```tsx
const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: '⚡' },
  { label: 'Appointments', href: '/appointments', icon: '📅' },
  { label: 'Quotes', href: '/quotes', icon: '📋' },
  { label: 'Invoices', href: '/invoices', icon: '🧾' },
  { label: 'Jobs', href: '/jobs', icon: '🔧' },
  { label: 'WSIB Tracking', href: '/wsib', icon: '🛡️' },
  { label: 'Clients', href: '/clients', icon: '👥' },
  { label: 'AI Assistant', href: '/assistant', icon: '🤖' },
  { label: 'AI Profit Analyzer', href: '/profit', icon: '📈' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
];
```

---

## Database Tables

Every table has RLS enabled. Service role bypasses RLS — always filter by `user_id` manually.

| Table | Key columns |
|---|---|
| `profiles` | id, full_name, company_name, email, phone, trade, logo_url, public_slug, is_public, bio, services (text[]), referral_code, referred_by, referral_count, google_review_link, booking_enabled, booking_window_days, booking_notice_hours, stripe_customer_id, subscription_status, trial_ends_at |
| `quotes` | id, user_id, customer_name, customer_email, customer_phone, customer_address, job_description, line_items (jsonb), subtotal, hst, total, status, notes, portal_token, approved (bool), created_at |
| `invoices` | id, user_id, customer_name, customer_email, customer_phone, customer_address, line_items (jsonb), subtotal, hst, total, status, due_date, payment_link, notes, created_at |
| `jobs` | id, user_id, customer_name, title, status, scheduled_date, scheduled_time, estimated_hours, address, description, photos (text[]), voice_notes (text[]), created_at |
| `wsib_entries` | id, user_id, contractor_name, certificate_number, expiry_date, status, notes, created_at |
| `appointments` | id, user_id, customer_name, customer_email, customer_phone, title, description, scheduled_date, duration_minutes, status, address, created_at |
| `notifications` | id, user_id, type, message, read, created_at |
| `receipts` | id, user_id, image_url, merchant, amount, date, category, notes, raw_text, line_items (jsonb), created_at |
| `apprenticeship_hours` | id, user_id, work_date, hours, trade_category, employer_name, supervisor_name, task_description, created_at |
| `crew` | id, user_id, name, trade, phone, email, status, notes, created_at |
| `pricebook_items` | id, user_id, name, description, unit_price, unit, category, created_at |
| `coi_entries` | id, user_id, provider, policy_number, coverage_type, expiry_date, document_url, created_at |
| `leads` | id, user_id, phone, name, message, status, source, created_at |
| `onboarding_emails` | id, user_id, email_number, sent_at, created_at |
| `job_reports` | id, user_id, job_id, content, share_token, created_at |
| `bookings` | id, contractor_id, customer_name, customer_email, customer_phone, scheduled_date, scheduled_time, duration_minutes, notes, status, created_at |
| `pricebook_items` | id, user_id, name, description, unit_price, unit, category, created_at |

Supabase Storage buckets: `receipts` (public), `job-photos` (private)

HST: always calculated at 13%. `subtotal * 0.13 = hst`, `subtotal + hst = total`.

---

## Pages Built

### Public pages (no auth)
- `/` — Landing page (`app/page.tsx`) — server component, Jobber-style CSS-only nav with dropdowns, hero, features, pricing ($99/$199 CAD), footer
- `/login`, `/signup` — Supabase auth
- `/portal` — Client portal (`app/portal/page.tsx`) — token-based, shows all quotes + invoices + jobs for a customer. Tabs: Overview / Quotes / Invoices / Jobs. "Pay Now" buttons on invoices. Quote approval. Google review nudge.
- `/book/[slug]` — Public contractor booking page
- `/contractors/[slug]` — Public contractor profile
- `/share/[id]` — Public AI-generated job report

### App pages (require auth, use Sidebar.tsx)
- `/dashboard` — KPI cards, recent activity, quick actions
- `/quotes` — List + create quotes. HST auto-calc. Edit + delete. Portal link generation.
- `/quotes/edit/[id]` — Edit existing quote
- `/invoices` — List + create invoices. Mark paid (triggers Google review SMS). Edit + delete.
- `/invoices/edit/[id]` — Edit existing invoice
- `/jobs` — Jobs list. Photo gallery + lightbox. Voice notes. AI report. Job costing panel with **profit bar** (gross profit, margin %, visual bar). Profit = `quote.total - receipt spend`.
- `/appointments` — Calendar scheduling with status management
- `/wsib` — WSIB clearance certificate tracker with expiry alerts
- `/crew` — Subcontractor/crew management
- `/receipts` — Receipt scanning (AI extracts merchant/amount/date/category via OpenAI Vision). Image viewer. Line item breakdown. Manual entry. CSV export.
- `/apprenticeship` — Apprenticeship hour logger. Progress bar to STO requirements.
- `/clients` — Client CRM
- `/assistant` — AI chat assistant (rate limited)
- `/profit` — AI profit analyzer (rate limited)
- `/coi` — Certificate of Insurance tracker
- `/import` — Data import wizard
- `/leads` — AI SMS missed-call leads inbox
- `/settings` — Profile, booking config, subscription, referral code

---

## API Routes

### Public (no auth)
- `GET /api/portal/data?token=` — Returns all quotes + invoices + jobs for a customer by portal token
- `POST /api/quotes/approve` — Approve a quote via portal token
- `GET /api/booking/[slug]/availability` — Available booking slots
- `POST /api/booking/[slug]/book` — Create a booking
- `POST /api/leads/sms` — Twilio webhook, saves lead + sends AI auto-reply

### Authenticated
- `POST /api/invoices/mark-paid` — Marks invoice paid + auto-sends Google review SMS via Twilio (SMS failure is non-fatal)
- `POST /api/scan-receipt` — OpenAI Vision receipt extraction (rate limited)
- `POST /api/transcribe-voice` — OpenAI Whisper voice transcription (rate limited)
- `POST /api/generate-report` — AI job report generation (rate limited)
- `POST /api/ai-assistant` — AI chat (rate limited)

### Cron (CRON_SECRET auth)
- `GET /api/cron/invoice-reminders` — Daily at 9am. Sends a payment reminder email for unpaid invoices 7+ days old. This is the only invoice/quote follow-up cron that currently exists — there is no `/api/cron/followups` route and no quote follow-up cron in the codebase (see Known Issues #1).
- `GET /api/cron/appointment-reminders` — Daily at 8am
- `GET /api/cron/wsib-reminders` — Daily at 9am
- `GET /api/cron/onboarding` — Daily at 10am, sends 5-email onboarding sequence
- `GET /api/cron/clearance-reminder` — Daily at 9am

---

## Key Architecture Decisions

**Portal token:** Uses `?token=` query string (not `/portal/[token]/`). Windows file system can't create folders with square brackets. Acceptable for now.

**Invoice reminders:** `/api/cron/invoice-reminders` queries unpaid invoices with `created_at <= now - 7 days` and emails a reminder. It has no `sent_at`/tracking column, so it will re-send a reminder to the same invoice on every run once it crosses the 7-day mark — worth adding a guard (e.g. a `last_reminder_sent_at` column, or an upper bound on the date window) if this becomes a problem. There is no quote follow-up cron and no day-3 reminder currently — only this single day-7+ invoice check.

**Service role + user_id check:** Even though Supabase service role bypasses RLS, all server-side routes explicitly add `.eq('user_id', user.id)` to prevent one contractor accessing another's data.

**SMS failure non-fatal:** In `/api/invoices/mark-paid`, the invoice is marked paid before the Twilio call. SMS errors are caught with try/catch. Returns `{ smsSent: false }` on failure.

**Supabase client pattern:**
- Server-side API routes: `createClient(URL, SERVICE_ROLE_KEY)` (service role, never trust client user IDs)
- Client-side pages: `createBrowserClient(URL, ANON_KEY)` + RLS
- Server components: `createServerClient` from `@supabase/ssr` with cookie handling

---

## Known Issues / Tech Debt

1. **No quote follow-ups / no reminder tracking** — Only one cron (`/api/cron/invoice-reminders`, day-7+ unpaid invoices) exists. There is no quote follow-up cron and no day-3 reminder. The invoice reminder also has no sent-tracking column, so it will re-email the same overdue invoice on every daily run once it's 7+ days old, not just once. (An earlier version of this doc described a consolidated `/api/cron/followups` route replacing this — that route does not exist in the codebase; disregard any reference to it elsewhere.)
2. **Stripe test mode** — Intentionally still in test mode while in beta with no paying customers yet. Swap `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` for live keys in Vercel right when the first real paying contractor is about to be onboarded — no need to do it earlier.
3. **Custom domain** — Live at `https://mytradedesk.ca` (Vercel domain `tradedesk-eight.vercel.app` still works too). Confirm `NEXT_PUBLIC_APP_URL` is set to `https://mytradedesk.ca` in Vercel env vars.
4. **Resend domain** — Email sends from `noreply@mytradedesk.ca`. Already matches the live domain — no change needed.
5. **App audit** (Task #47 in_progress) — Full audit of all app pages for UX/bug issues. Task #48 is implementing the fixes.

---

## Pricing

| Plan | Price | Features |
|---|---|---|
| Starter | $99 CAD/month | Quotes, Invoices, Jobs, WSIB, Appointments, Client Portal, Per-job profit bar, Google review SMS, Automated follow-ups |
| Pro | $199 CAD/month | Everything in Starter + AI Assistant, AI Profit Analyzer, SMS missed-call handler, Priority support |
| Enterprise | Custom | Custom features, dedicated support |

14-day free trial — no credit card required.

---

## Vercel Cron Schedule (vercel.json)

```json
{
  "crons": [
    { "path": "/api/cron/invoice-reminders", "schedule": "0 9 * * *" },
    { "path": "/api/cron/appointment-reminders", "schedule": "0 8 * * *" },
    { "path": "/api/cron/wsib-reminders", "schedule": "0 9 * * *" },
    { "path": "/api/cron/onboarding", "schedule": "0 10 * * *" },
    { "path": "/api/cron/clearance-reminder", "schedule": "0 9 * * *" }
  ]
}
```

This matches the actual `vercel.json` — no `followups` entry exists. See Known Issues #1 for the gap this leaves (no quote follow-ups, no reminder tracking).
