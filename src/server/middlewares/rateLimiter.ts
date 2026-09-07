import express from 'express';

// --- IP/User Rate Limiting Middleware for Critical Resource Protection ---
export const routeRateLimiter = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, number[]>();

  // Memory leak protection - clean up stale entries every 5 minutes
  const pruneInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of requests.entries()) {
      const active = timestamps.filter(t => now - t < windowMs);
      if (active.length === 0) {
        requests.delete(key);
      } else {
        requests.set(key, active);
      }
    }
  }, 5 * 60 * 1000);

  // Safely prevent keeping Node process alive in local/CLI development
  if (pruneInterval.unref) {
    pruneInterval.unref();
  }

  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const id = (req as any).user?.uid || req.ip || 'anonymous_ip';
    const now = Date.now();
    let timestamps = requests.get(id) || [];
    timestamps = timestamps.filter(t => now - t < windowMs);
    if (timestamps.length >= maxRequests) {
      console.warn(`[RATE LIMIT EXCEEDED] User/IP ${id} throttled on ${req.originalUrl}. limit: ${maxRequests} requests per ${windowMs / 1000}s`);
      return res.status(429).json({
        error: 'Resource rate limit exceeded. Please wait a moment before executing this heavy command again.',
        retryAfterMs: windowMs - (now - timestamps[0])
      });
    }
    timestamps.push(now);
    requests.set(id, timestamps);
    next();
  };
};
