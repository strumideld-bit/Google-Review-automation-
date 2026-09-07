import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let limiter: Ratelimit | null = null;

function getLimiter(): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (!limiter) {
    limiter = new Ratelimit({
      redis: Redis.fromEnv(),
      // 5 submissions per client+IP per 10 minutes — generous for a real
      // customer, tight enough to blunt a script hammering the endpoint.
      limiter: Ratelimit.slidingWindow(5, "10 m"),
      prefix: "review-automation",
    });
  }
  return limiter;
}

/** Returns true if the request should be allowed through. */
export async function checkRateLimit(identifier: string): Promise<boolean> {
  const rl = getLimiter();
  if (!rl) {
    console.warn(
      "[ratelimit] UPSTASH_REDIS_REST_URL/TOKEN not set — skipping rate limiting."
    );
    return true;
  }
  const { success } = await rl.limit(identifier);
  return success;
}
