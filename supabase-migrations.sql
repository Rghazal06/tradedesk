-- ============================================================
-- TradeDesk — All SQL migrations for new features
-- Run these in order in your Supabase SQL editor
-- ============================================================

-- -------------------------------------------------------
-- Feature 2: Receipt Scanning
-- -------------------------------------------------------
create table if not exists receipts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  image_url text,
  merchant text,
  amount numeric,
  date date,
  category text,
  notes text,
  raw_text text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table receipts enable row level security;
create policy "Users can manage own receipts" on receipts
  for all using (auth.uid() = user_id);

-- Supabase Storage bucket: create "receipts" bucket (private) in the Supabase dashboard

-- -------------------------------------------------------
-- Feature 3: Apprenticeship Hour Tracker
-- -------------------------------------------------------
create table if not exists apprenticeship_hours (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  work_date date,
  hours numeric,
  trade_category text,
  employer_name text,
  supervisor_name text,
  task_description text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table apprenticeship_hours enable row level security;
create policy "Users can manage own hours" on apprenticeship_hours
  for all using (auth.uid() = user_id);

-- -------------------------------------------------------
-- Feature 5: Public Contractor Profiles
-- -------------------------------------------------------
alter table profiles add column if not exists public_slug text unique;
alter table profiles add column if not exists is_public boolean default false;
alter table profiles add column if not exists bio text;
alter table profiles add column if not exists services text[];

-- -------------------------------------------------------
-- Feature 6: Referral Program
-- -------------------------------------------------------
alter table profiles add column if not exists referral_code text unique;
alter table profiles add column if not exists referred_by uuid references profiles(id);
alter table profiles add column if not exists referral_count integer default 0;

-- -------------------------------------------------------
-- Feature 7: Onboarding Email Sequence
-- -------------------------------------------------------
create table if not exists onboarding_emails (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  email text not null,
  full_name text,
  day integer not null,  -- 0, 1, 2, 4, 7
  sent boolean default false,
  sent_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table onboarding_emails enable row level security;
create policy "Service role only" on onboarding_emails
  for all using (false);  -- only accessible via service role key

-- -------------------------------------------------------
-- Feature 8: Subscription Gating
-- -------------------------------------------------------
-- Set trial_ends_at for any existing users who don't have it
update profiles
set trial_ends_at = now() + interval '14 days'
where trial_ends_at is null;

-- -------------------------------------------------------
-- Feature 9: Photo Attachments on Jobs
-- -------------------------------------------------------
alter table jobs add column if not exists photos text[] default '{}';

-- Supabase Storage bucket: create "job-photos" bucket (private) in the Supabase dashboard

-- -------------------------------------------------------
-- Notifications table: add quote_request type if not exists
-- (no schema change needed — type is a text field)
-- -------------------------------------------------------

-- -------------------------------------------------------
-- Feature 10: Real Stripe webhook + referral credit tracking
-- Fixes: subscription_status was never set to 'active' anywhere
-- (no webhook existed), and referrals showed a fake "1 month free"
-- notification with no actual credit applied.
-- -------------------------------------------------------
alter table profiles add column if not exists referral_reward_granted boolean not null default false;

-- -------------------------------------------------------
-- Feature 11: Quote deposits + invoice tips
-- Deposits: contractor sets an optional deposit_amount on a quote; customer
-- pays it via the portal before the quote counts as approved.
-- Tips: customers can add a tip when paying an invoice through the new
-- token-based /pay page (replaces raw Stripe Payment Links, which couldn't
-- support a customer-chosen amount).
-- -------------------------------------------------------
alter table quotes add column if not exists deposit_amount numeric;
alter table quotes add column if not exists deposit_paid boolean not null default false;
alter table invoices add column if not exists payment_token uuid;
alter table invoices add column if not exists tip_amount numeric;

-- -------------------------------------------------------
-- Feature 12: Job checklists
-- -------------------------------------------------------
alter table jobs add column if not exists checklist jsonb default '[]';

-- -------------------------------------------------------
-- Feature 14: Stop invoice reminders from re-sending every single day
-- Previously /api/cron/invoice-reminders had no tracking column, so once
-- an unpaid invoice crossed 7 days old it got re-emailed on every daily
-- cron run forever. Now it only re-sends once a week after the first one.
-- -------------------------------------------------------
alter table invoices add column if not exists last_reminder_sent_at timestamp with time zone;

-- -------------------------------------------------------
-- Feature 13: Two-way texting for existing clients
-- Separate from sms_leads (missed-call AI qualification bot).
-- Contractor-initiated conversations with known customers, sent from
-- their own profiles.twilio_phone (same number leads already use).
-- -------------------------------------------------------
create table if not exists sms_conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  customer_phone text not null,
  customer_name text,
  messages jsonb default '[]',
  last_message_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique (user_id, customer_phone)
);
alter table sms_conversations enable row level security;
create policy "Users can manage own sms conversations" on sms_conversations
  for all using (auth.uid() = user_id);
