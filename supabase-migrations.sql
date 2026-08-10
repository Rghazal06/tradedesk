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
