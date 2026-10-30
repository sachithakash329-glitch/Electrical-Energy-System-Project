// This API is used through Vite's same-origin /api proxy. Do not enable wildcard CORS.
export function protectWrites(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origins = (process.env.CLIENT_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',').map(value => value.trim()).filter(Boolean);
  const origin = req.get('origin');
  if (req.get('X-Energy-Client') !== 'web' || (origin && !origins.includes(origin)) ||
      req.get('sec-fetch-site') === 'cross-site') {
    return res.status(403).json({ message: 'Request blocked. Open the application from its normal website address and try again.' });
  }
  next();
}

// A small single-process limiter for the local course project, not a distributed service.
export function loginLimiter({ limit = 30, windowMs = 15 * 60 * 1000 } = {}) {
  const entries = new Map();
  let nextCleanup = 0;
  return (req, res, next) => {
    const now = Date.now();
    if (now >= nextCleanup) {
      for (const [key, value] of entries) if (value.until <= now) entries.delete(key);
      nextCleanup = now + 60_000;
    }
    const key = req.ip;
    let entry = entries.get(key);
    if (!entry || entry.until <= now) {
      if (entries.size >= 10_000) return res.status(503).json({ message: 'Sign-in is busy. Please try again shortly.' });
      entry = { count: 0, until: now + windowMs };
      entries.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > limit) {
      res.set('Retry-After', String(Math.ceil((entry.until - now) / 1000)));
      return res.status(429).json({ message: 'Too many sign-in attempts. Please wait 15 minutes before trying again.' });
    }
    next();
  };
}
