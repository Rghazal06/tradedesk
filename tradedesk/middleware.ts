import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Routes that are always accessible (no auth required)
const PUBLIC_ROUTES = ['/', '/login', '/signup', '/portal', '/contractors', '/share', '/book'];

// Routes that require Pro plan
const PRO_ONLY_ROUTES = ['/assistant', '/profit'];

// Routes that require at least Starter (blocked after trial)
const PREMIUM_ROUTES = [
  '/dashboard', '/quotes', '/invoices', '/jobs', '/wsib',
  '/appointments', '/clients', '/assistant', '/profit',
  '/receipts', '/apprenticeship', '/settings',
  '/pricebook', '/leads', '/crew', '/insurance',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes and API routes
  if (
    PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/')) ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/icons/') ||
    pathname === '/sw.js' ||
    pathname === '/manifest.webmanifest'
  ) {
    return NextResponse.next();
  }

  // Check if this is a protected route
  const isPremiumRoute = PREMIUM_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));
  if (!isPremiumRoute) return NextResponse.next();

  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Fetch subscription status
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, subscription_plan, trial_ends_at')
    .eq('id', user.id)
    .single();

  if (!profile) return res;

  const now = new Date();
  const trialEnd = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const isOnTrial = trialEnd && trialEnd > now;
  const isActive = profile.subscription_status === 'active';
  const isPro = isActive && profile.subscription_plan === 'pro';

  // Pro-only routes
  if (PRO_ONLY_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))) {
    if (!isPro && !isOnTrial) {
      const url = new URL('/settings', req.url);
      url.searchParams.set('upgrade', 'pro');
      return NextResponse.redirect(url);
    }
  }

  // Any premium route blocked after trial expiry with no active subscription
  if (!isOnTrial && !isActive) {
    // Allow /settings so they can upgrade
    if (!pathname.startsWith('/settings')) {
      const url = new URL('/settings', req.url);
      url.searchParams.set('upgrade', 'required');
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|sw.js|manifest.webmanifest).*)',
  ],
};
