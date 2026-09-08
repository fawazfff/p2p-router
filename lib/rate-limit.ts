type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  limit: number;
  windowMs?: number;
};

const buckets = new Map<string, Bucket>();

function clientAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
}

export function enforceRateLimit(
  request: Request,
  { limit, windowMs = 60_000 }: RateLimitOptions,
) {
  const now = Date.now();
  const path = new URL(request.url).pathname;
  const key = `${path}:${clientAddress(request)}`;
  const current = buckets.get(key);
  const bucket = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + windowMs }
    : current;

  bucket.count += 1;
  buckets.set(key, bucket);

  if (buckets.size > 1_000) {
    for (const [bucketKey, value] of buckets) {
      if (value.resetAt <= now) buckets.delete(bucketKey);
    }
  }

  const remaining = Math.max(0, limit - bucket.count);
  const resetSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1_000));
  const headers = {
    "Cache-Control": "no-store",
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(bucket.resetAt / 1_000)),
  };

  if (bucket.count <= limit) return null;

  return Response.json(
    { ok: false, code: "RATE_LIMITED", message: "Too many requests. Try again shortly." },
    { status: 429, headers: { ...headers, "Retry-After": String(resetSeconds) } },
  );
}
