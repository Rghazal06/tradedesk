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
| `profiles` | id, full_name, company_name, email, phone, trade, logo_url, public_slug, is_public, bio, services (text[]), referral_code, referred_by, referral_count, referral_reward_granted (bool), google_review_link, booking_enabled, booking_window_days, booking_notice_hours, stripe_customer_id, subscription_status, subscription_plan, trial_ends_at |
| `quotes` | id, user_id, customer_name, customer_email, customer_phone, customer_address, job_description, line_items (jsonb), subtotal, hst, total, status, notes, portal_token, approved (bool), deposit_amount, deposit_paid (bool), created_at |
| `invoices` | id, user_id, customer_name, customer_email, customer_phone, job_description, line_items (jsonb), subtotal, hst, total, status, payment_token, tip_amount, last_reminder_sent_at, notes, created_at — corrected 2026-08-10: `due_date`/`customer_address` do not actually exist on this table despite earlier docs; a query referencing `due_date` caused a real silent-404 bug (see Known Issues) |
| `jobs` | id, user_id, title, customer_name, customer_phone, scheduled_date, scheduled_time, estimated_hours, status, notes, photos (text[]), checklist (jsonb, `{id,text,done}[]`), share_token, created_at — verified from actual code, not the previous (inaccurate) `address`/`description`/`voice_notes` column list. Voice notes are transcribed and appended as timestamped text into `notes`, not stored as a separate column. |
| `wsib_entries` | id, user_id, contractor_name, certificate_number, expiry_date, status, notes, created_at |
| `appointments` | id, user_id, customer_name, customer_email, customer_phone, title, description, scheduled_date, duration_minutes, status, address, created_at |
| `notifications` | id, user_id, type, message, read, created_at |
| `receipts` | id, user_id, image_url, merchant, amount, date, category, notes, raw_text, line_items (jsonb), created_at |
| `apprenticeship_hours` | id, user_id, work_date, hours, trade_category, employer_name, supervisor_name, task_description, created_at |
| `crew_members` | id, user_id, name, trade, email, phone, wsib_number, wsib_expiry, rate_type ('hourly'\|'fixed'), hourly_rate, status, notes, created_at — corrected 2026-08-12: table is `crew_members`, not `crew` as previously (incorrectly) documented |
| `time_entries` | id, user_id, job_id, crew_id (nullable, references crew_members), clock_in, clock_out (nullable while active), created_at |
| `pricebook_items` | id, user_id, name, description, unit_price, unit, category, created_at |
| `insurance_docs` | id, user_id, doc_type, insurer, policy_number, expiry_date, coverage_amount, file_url, subcontractor_name, notes, created_at — corrected 2026-08-18: previously (incorrectly) documented as `coi_entries` with different columns; that table never existed |
| `leads` | id, user_id, phone, name, message, status, source, created_at |
| `sms_conversations` | id, user_id, customer_phone, customer_name, messages (jsonb, `{direction:'inbound'\|'outbound',body,ts}[]`), last_message_at, created_at — unique on (user_id, customer_phone). Two-way texting with known clients, separate from `sms_leads` (missed-call AI bot). |
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
- `/portal?token=` — **Single-quote view only** (`app/portal/page.tsx`), token-based via `quotes.portal_token`. Shows one quote's line items + approve button, and now a deposit-payment step if `deposit_amount` is set. Converted from Tailwind to inline styles 2026-08-10 (matches the rest of the app now). There is no unified multi-tab hub with Overview/Quotes/Invoices/Jobs and no `/api/portal/data` route — an earlier version of this doc described that and it never existed in the codebase.
- `/pay?token=` — Public invoice pay page (`app/pay/page.tsx`), token-based via `invoices.payment_token`. Shows the invoice, lets the customer pick a tip (0/10/15/20%/custom), then redirects to a dynamically-created Stripe Checkout session. Replaces the old flow where the contractor generated a raw Stripe Payment Link via `/api/create-payment-link` (deleted — that route only supported a fixed amount, so it couldn't offer tipping).
- `/book/[slug]` — Public contractor booking page
- `/contractors/[slug]` — Public contractor profile
- `/share/[id]` — Public AI-generated job report

### App pages (require auth, use Sidebar.tsx)
- `/dashboard` — KPI cards, recent activity, quick actions
- `/quotes` — List + create quotes. HST auto-calc. Optional deposit amount. Edit + delete. Portal link generation. Multi-select checkboxes + "Create N Invoices" batch-converts several quotes to invoices in one action (reuses the same per-quote conversion logic as the single "→ Invoice" button).
- `/quotes/edit/[id]` — Edit existing quote
- `/invoices` — List + create invoices. Mark paid manually, or "Pay Link" generates a `/pay?token=` link customers can pay (+ optional tip) themselves, which auto-marks paid via webhook and fires the review SMS. Edit + delete.
- `/invoices/edit/[id]` — Edit existing invoice
- `/jobs` — Jobs list. Photo gallery + lightbox. Voice notes. AI report. Checklist (customizable checkbox items per job, shown on the AI report and public share page too). Time tracking (clock in/out per job, optional crew attribution). Recurring jobs (weekly/biweekly/monthly, optional end date) — the next occurrence is created automatically when a job in the series is marked completed, not generated upfront; "Stop Repeating" halts future generation without touching past occurrences. Job costing panel — despite earlier docs calling this a "profit bar," it's actually 4 stat cards (Material Spend from linked receipts / Labor Cost from tracked time × hourly-rate crew / Quoted subtotal from the most recent matching quote / Over-Under difference, materials only) plus a receipts table — there is no visual progress bar.
- `/appointments` — Calendar scheduling with status management. Month navigation (prev/next/Today — previously hardcoded to the current month only). Drag-and-drop appointment chips between day cells to reschedule (native HTML5 DnD, updates `scheduled_date` directly).
- `/wsib` — WSIB clearance certificate tracker with expiry alerts
- `/crew` — Subcontractor/crew management
- `/receipts` — Receipt scanning (AI extracts merchant/amount/date/category via OpenAI Vision). Image viewer. Line item breakdown. Manual entry. CSV export.
- `/apprenticeship` — Apprenticeship hour logger. Progress bar to STO requirements.
- `/clients` — Client CRM
- `/assistant` — AI chat assistant (rate limited)
- `/profit` — AI profit analyzer (rate limited)
- `/insurance` — Insurance/COI tracker (own policies + subcontractor COIs), table `insurance_docs`. Corrected 2026-08-18: previously (incorrectly) documented as `/coi`; that route never existed.
- `/import` — Data import wizard
- `/leads` — AI SMS missed-call leads inbox
- `/settings` — Profile, booking config, subscription, referral code

---

## API Routes

### Public (no auth)
- `POST /api/quotes/approve` — Approve a quote via portal token (no deposit case)
- `POST /api/quotes/create-deposit-checkout` — Looks up a quote by `portal_token`, creates a dynamic Stripe Checkout session for `deposit_amount`. Approval + `deposit_paid` are only set by the webhook once payment actually completes, not by this route.
- `GET /api/invoices/by-token?token=` — Returns an invoice (+ contractor display name) by `payment_token`, for the `/pay` page
- `POST /api/invoices/create-checkout` — Looks up an invoice by `payment_token`, creates a dynamic Stripe Checkout session for the invoice total plus an optional tip line item
- `GET /api/booking/[slug]/availability` — Available booking slots
- `POST /api/booking/[slug]/book` — Create a booking
- `POST /api/twilio/sms` — Twilio inbound SMS webhook (actual path — not `/api/leads/sms` as previously documented). Checks `sms_conversations` first (known client reply → files it there + notifies contractor, no AI reply); otherwise falls through to the missed-call AI qualification bot → `sms_leads`.
- `POST /api/twilio/voice` — Twilio inbound call webhook for the missed-call bot

### Authenticated
- `POST /api/scan-receipt` — OpenAI Vision receipt extraction (rate limited)
- `POST /api/transcribe-voice` — OpenAI Whisper voice transcription (rate limited)
- `POST /api/generate-report` — AI job report generation (rate limited)
- `POST /api/ai-assistant` — AI chat (rate limited)
- `POST /api/send-review-request` — Manually-triggered Google review request SMS (rate limited, 10/hr/user)
- `POST /api/create-checkout` — Creates a Stripe subscription Checkout session for the authenticated user (sets `client_reference_id` + `metadata.plan` so the webhook can attribute the resulting event)
- `POST /api/sms/send` — Contractor texts a known client from their own `profiles.twilio_phone`; upserts `sms_conversations`. Requires `twilio_phone` to be set in Settings first.

### Webhooks (Stripe signature auth, not getAuthUser)
- `POST /api/webhooks/stripe` — The only place `profiles.subscription_status` is ever written. Handles:
  - `checkout.session.completed` (mode=`subscription`) → sets `subscription_status='active'`, `subscription_plan`, `stripe_customer_id`; also triggers the real referral credit (see Known Issues — previously fake)
  - `checkout.session.completed` (mode=`payment`, `metadata.kind==='quote_deposit'`) → sets `quotes.approved=true`, `deposit_paid=true`, notifies the contractor
  - `checkout.session.completed` (mode=`payment`, default/`metadata.kind==='invoice_payment'`) → marks the invoice `paid`, stores `tip_amount` if any, fires the review-request SMS automatically. (Previously "Mark Paid" was 100% manual client-side with no Stripe verification at all — `/api/invoices/mark-paid` never existed despite being documented; invoices are still updatable manually from the UI for cash/e-transfer payments, that path is unchanged.)
  - `customer.subscription.updated` / `.deleted` → keeps `subscription_status` in sync with Stripe going forward (past_due, canceled, etc.)

### Cron (CRON_SECRET auth)
- `GET /api/cron/invoice-reminders` — Daily at 9am. Sends a payment reminder email for unpaid invoices 7+ days old. This is the only invoice/quote follow-up cron that currently exists — there is no `/api/cron/followups` route and no quote follow-up cron in the codebase (see Known Issues #1).
- `GET /api/cron/appointment-reminders` — Daily at 8am
- `GET /api/cron/wsib-reminders` — Daily at 9am
- `GET /api/cron/onboarding` — Daily at 10am, sends 5-email onboarding sequence
- `GET /api/cron/clearance-reminder` — Daily at 9am
- `GET /api/cron/insurance-reminders` — Daily at 9am. Warns a contractor 30 days before an `insurance_docs` policy expires — covers both their own policies and subcontractor COIs on file. Uses the same exact `[today+30, today+31)` window pattern as `clearance-reminder` (a policy only ever falls in the window once, so no tracking column is needed). Added 2026-08-18.

---

## Key Architecture Decisions

**Portal token:** Uses `?token=` query string (not `/portal/[token]/`). Windows file system can't create folders with square brackets. Acceptable for now.

**Invoice reminders:** `/api/cron/invoice-reminders` queries unpaid invoices with `created_at <= now - 7 days` and emails a reminder, guarded by `invoices.last_reminder_sent_at` (added 2026-08-10) so it only re-sends once a week after the first reminder, not on every daily run. There is still no quote follow-up cron and no day-3 reminder — only this single day-7+ invoice check.

**Service role + user_id check:** Even though Supabase service role bypasses RLS, all server-side routes explicitly add `.eq('user_id', user.id)` to prevent one contractor accessing another's data.

**SMS failure non-fatal:** In `/api/webhooks/stripe`, the invoice is marked paid before the review-request Twilio call, and the SMS send is wrapped in try/catch — a Twilio failure never rolls back or blocks the payment being recorded.

**Referral credit:** Applied via real Stripe customer balance transactions (`stripe.customers.createBalanceTransaction`, a negative amount = credit) on both the referrer and the new user, fired from `/api/webhooks/stripe` the first time the new user's subscription checkout completes. Guarded by `profiles.referral_reward_granted` so a retried webhook delivery or a later resubscribe can't double-credit. If the referrer has never checked out before, a bare Stripe Customer object is created for them so the credit still has somewhere to land — it'll apply automatically the first time they do subscribe.

**Labor cost only applies to hourly-rate crew.** `crew_members.rate_type` can be `'hourly'` or `'fixed'` — a fixed rate isn't naturally multiplied by tracked hours, so the Job Costing panel's Labor Cost stat only counts $ for crew with `rate_type='hourly'`. Unassigned time entries and fixed-rate crew still show up in total logged hours, just without a dollar figure.

**SMS conversations have no realtime push** — `app/clients/page.tsx` polls `sms_conversations` every 5s via `setInterval` while a client's message panel is open, rather than using Supabase Realtime subscriptions. Simple and good enough for a single open panel; would need revisiting if this becomes a multi-conversation inbox view.

**Supabase client pattern:**
- Server-side API routes: `createClient(URL, SERVICE_ROLE_KEY)` (service role, never trust client user IDs)
- Client-side pages: `createBrowserClient(URL, ANON_KEY)` + RLS
- Server components: `createServerClient` from `@supabase/ssr` with cookie handling

---

## Known Issues / Tech Debt

1. **No quote follow-up cron** — Only one cron (`/api/cron/invoice-reminders`, day-7+ unpaid invoices) exists; there is no quote follow-up cron and no day-3 reminder. ~~The invoice reminder re-sending daily forever~~ fixed 2026-08-10 via `last_reminder_sent_at`. (An earlier version of this doc described a consolidated `/api/cron/followups` route replacing this — that route does not exist in the codebase; disregard any reference to it elsewhere.)
2. **Stripe test mode** — Intentionally still in test mode while in beta with no paying customers yet. Swap `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` for live keys in Vercel right when the first real paying contractor is about to be onboarded — no need to do it earlier.
3. **Custom domain** — Live at `https://mytradedesk.ca` (Vercel domain `tradedesk-eight.vercel.app` still works too). Confirm `NEXT_PUBLIC_APP_URL` is set to `https://mytradedesk.ca` in Vercel env vars.
4. **Resend domain** — Email sends from `noreply@mytradedesk.ca`. Already matches the live domain — no change needed.
5. **App audit** (Task #47 in_progress) — Full audit of all app pages for UX/bug issues. Task #48 is implementing the fixes.
6. ~~Stripe webhook not registered~~ — **done 2026-08-10.** Event destination is live in the Stripe Dashboard pointing at `https://mytradedesk.ca/api/webhooks/stripe`; verified end-to-end in production (subscription activation, deposit approval, invoice auto-paid all confirmed working).
7. **Remaining confirmed gaps against Jobber** (identified 2026-08-10, roadmap in progress): ~~deposit collection on quotes~~, ~~tip collection on invoices~~, ~~job checklists~~, ~~two-way texting for known clients~~ shipped 2026-08-10 (texting is SMS-only via Twilio, no in-app messaging UI — see Key Architecture Decisions); ~~time tracking/clock-in~~, ~~recurring jobs~~, ~~batch invoicing~~, and ~~drag-and-drop calendar~~ shipped 2026-08-12/13. Still missing: no QuickBooks/Zapier/Mailchimp integration, no route optimization (see note above on why route optimization is intentionally deprioritized — new paid mapping API dependency, real algorithmic complexity, and value that only scales with crew size/job density).
8. **Settings page save is still one big upsert across every field** (personal info, business info, booking config, twilio_phone, etc.) — if `public_slug` collides with another contractor's via the `profiles_public_slug_key` unique constraint, the ENTIRE save still fails and every field on the page still reverts, not just the offending one. **Partially fixed 2026-08-10**: the error banner no longer shows a false-positive green checkmark on failure (now styled red, no checkmark), and a slug collision specifically now gets a clear "that URL is already taken" message instead of a generic one. The underlying "one bad field kills the whole save" behavior is unchanged — still worth splitting into per-section saves eventually.
9. **Twilio webhook URLs must be configured per-number in the Twilio Console** (Phone Numbers → your number → Messaging Configuration, or under the number's Messaging Service if it's attached to one → Integration tab). **Must use `https://www.mytradedesk.ca/api/twilio/sms` and `/api/twilio/voice` — the `www` subdomain, not the bare domain.** `https://mytradedesk.ca` 308-redirects to `https://www.mytradedesk.ca` at the Vercel/DNS level; that's invisible to normal browser links but breaks Twilio's signature validation, since Twilio signs the request against the exact URL it was told to call. A wrong (non-www) webhook URL fails signature validation silently — no error surfaces anywhere in the app, Twilio just gets a 403 and the message vanishes. This cost real debugging time on 2026-08-10; confirmed by curling both URLs directly (`mytradedesk.ca` → 308, `www.mytradedesk.ca` → reaches the route). Stripe webhooks don't have this problem because Stripe's signature isn't tied to the URL, only the payload — this is Twilio-specific. This is entirely outside the app — TradeDesk has no way to configure it programmatically, and Twilio cannot deliver webhooks to `localhost` without a tunnel (e.g. ngrok), unlike Stripe which has `stripe listen` for local testing.

---

## Pricing

| Plan | Price | Features |
|---|---|---|
| Starter | $99 CAD/month | Quotes, Invoices, Jobs (with checklists), WSIB, Appointments, Client Portal, deposits + tips via Stripe, two-way client texting, Per-job costing, Google review SMS |
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
    { "path": "/api/cron/clearance-reminder", "schedule": "0 9 * * *" },
    { "path": "/api/cron/insurance-reminders", "schedule": "0 9 * * *" }
  ]
}
```

This matches the actual `vercel.json` — no `followups` entry exists. See Known Issues #1 for the gap this leaves (no quote follow-ups, no reminder tracking).
