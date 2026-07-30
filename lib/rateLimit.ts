const requests = new Map<string, { count: number; resetTime: number }>();

// Purge expired entries every 5 minutes to prevent unbounded memory growth.
// Without this, every unique IP/user key accumulates forever in a long-running process.
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

function maybeCleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, record] of requests.entries()) {
    if (now > record.resetTime) requests.delete(key);
  }
}

export function rateLimit(key: string, limit = 20, windowMs = 60000): boolean {
  const now = Date.now();
  maybeCleanup(now);

  const record = requests.get(key);

  if (!record || now > record.resetTime) {
    requests.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) return false;

  record.count++;
  return true;
}
