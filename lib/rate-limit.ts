import { headers } from "next/headers";
import net from "net";

interface RateLimitRecord {
  timestamps: number[];
}

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max allowed requests within window
  name?: string; // Optional namespace for rate limiter
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Lightweight, in-memory sliding-window rate limiter.
 * Designed for serverless/Node.js runtimes without external Redis dependencies.
 * Automatically bounds memory with maximum entries and lazy purging.
 */
export class MemoryRateLimiter {
  private store = new Map<string, RateLimitRecord>();
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly name: string;
  private readonly maxEntries: number;
  private lastCleanup: number = Date.now();

  constructor(options: RateLimitOptions, maxEntries = 5000) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
    this.name = options.name || "default";
    this.maxEntries = maxEntries;
  }

  /**
   * Evaluates rate limit for a specific client key.
   */
  public check(key: string): RateLimitResult {
    const now = Date.now();
    this.periodicCleanup(now);

    const record = this.store.get(key) || { timestamps: [] };

    // Filter out timestamps outside the active sliding window
    const recentTimestamps = record.timestamps.filter(
      (ts) => now - ts < this.windowMs
    );

    if (recentTimestamps.length >= this.maxRequests) {
      const oldestInWindow = recentTimestamps[0];
      const resetInSeconds = Math.max(
        1,
        Math.ceil((oldestInWindow + this.windowMs - now) / 1000)
      );

      return {
        allowed: false,
        limit: this.maxRequests,
        remaining: 0,
        resetInSeconds,
      };
    }

    // Add current request timestamp
    recentTimestamps.push(now);
    record.timestamps = recentTimestamps;

    // Bound memory size: evict oldest entry if capacity reached
    if (this.store.size >= this.maxEntries && !this.store.has(key)) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) this.store.delete(oldestKey);
    }

    this.store.set(key, record);

    return {
      allowed: true,
      limit: this.maxRequests,
      remaining: Math.max(0, this.maxRequests - recentTimestamps.length),
      resetInSeconds: Math.ceil(this.windowMs / 1000),
    };
  }

  /**
   * Resets rate limit for a specific key (e.g., upon successful admin login).
   */
  public reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Periodically purges stale entries to prevent memory growth.
   */
  private periodicCleanup(now: number): void {
    if (now - this.lastCleanup < 60000) return; // Clean up at most once per minute
    this.lastCleanup = now;

    for (const [key, record] of this.store.entries()) {
      const validTimestamps = record.timestamps.filter(
        (ts) => now - ts < this.windowMs
      );
      if (validTimestamps.length === 0) {
        this.store.delete(key);
      } else {
        record.timestamps = validTimestamps;
      }
    }
  }
}

/**
 * Validates and normalizes an IP address using Node's standard net.isIP().
 * Rejects:
 * - Empty or whitespace-only strings
 * - Arbitrary text
 * - Comma-separated strings
 * - CR/LF characters
 * - Strings > 45 characters
 * Returns the normalized IP string if valid IPv4 or IPv6, else null.
 */
export function sanitizeAndValidateIp(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;

  // Reject CR/LF characters
  if (raw.includes("\r") || raw.includes("\n")) return null;

  // Reject comma-separated values (must be single IP)
  if (raw.includes(",")) return null;

  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > 45) return null;

  // Built-in validation: returns 4 for IPv4, 6 for IPv6, 0 for invalid
  const family = net.isIP(trimmed);
  if (family === 4 || family === 6) {
    return trimmed;
  }

  return null;
}

export type HeaderSource =
  | Headers
  | Record<string, string | string[] | undefined>
  | { get(name: string): string | null | undefined };

/**
 * Resolves the client IP address according to the configured trusted proxy model.
 *
 * TRUSTED_PROXY_MODE:
 * - "cloudflare": Trusts only 'cf-connecting-ip' as the outer edge connecting address.
 * - "vercel": (Default for Vercel deployment) Evaluates Vercel Edge proxy semantics:
 *   1. 'x-vercel-forwarded-for': Set directly by Vercel edge.
 *   2. 'x-real-ip': Trusted proxy remote address populated by Vercel.
 *   3. 'x-forwarded-for': In reverse proxy semantics, client-supplied headers are at the
 *      START of the list (ips[0] is attacker-controlled). The proxy appends the verified
 *      connecting remote IP to the END of the list (ips[ips.length - 1]). Thus only the
 *      last entry is proxy-guaranteed.
 * - "local": Development mode; accepts local headers or falls back to "127.0.0.1".
 *
 * In production: If no reliable IP can be resolved, returns "unknown" (stable shared bucket).
 * In non-production: Falls back to "127.0.0.1".
 */
export async function getClientIp(
  customHeaders?: HeaderSource
): Promise<string> {
  const isProduction = process.env.NODE_ENV === "production";
  const proxyMode = (
    process.env.TRUSTED_PROXY_MODE ||
    (process.env.VERCEL ? "vercel" : isProduction ? "vercel" : "local")
  ).toLowerCase().trim();

  let getHeader: (name: string) => string | null | undefined;

  if (customHeaders) {
    if (typeof (customHeaders as Headers).get === "function") {
      getHeader = (name: string) => (customHeaders as Headers).get(name);
    } else {
      const rec = customHeaders as Record<string, string | string[] | undefined>;
      getHeader = (name: string) => {
        const val = rec[name] ?? rec[name.toLowerCase()];
        return Array.isArray(val) ? val[0] : val;
      };
    }
  } else {
    try {
      const h = await headers();
      getHeader = (name: string) => h.get(name);
    } catch {
      getHeader = () => null;
    }
  }

  let resolvedIp: string | null = null;

  if (proxyMode === "cloudflare") {
    // Only trust cf-connecting-ip when explicitly configured for Cloudflare
    const cfIp = getHeader("cf-connecting-ip");
    resolvedIp = sanitizeAndValidateIp(cfIp);
  } else if (proxyMode === "vercel") {
    // 1. Edge-injected Vercel client IP header
    const vercelForwarded = getHeader("x-vercel-forwarded-for");
    if (vercelForwarded) {
      // If multiple Vercel proxies chained, the first in this Vercel-internal header is client
      const firstVercel = vercelForwarded.split(",")[0]?.trim();
      resolvedIp = sanitizeAndValidateIp(firstVercel);
    }

    // 2. Vercel / proxy real-ip
    if (!resolvedIp) {
      const realIp = getHeader("x-real-ip");
      resolvedIp = sanitizeAndValidateIp(realIp);
    }

    // 3. Reverse proxy X-Forwarded-For semantics:
    // Attacker client input is at index 0 (left-most).
    // Vercel proxy appends the actual TCP remote address at the end (right-most).
    if (!resolvedIp) {
      const xff = getHeader("x-forwarded-for");
      if (xff) {
        const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
        if (parts.length > 0) {
          resolvedIp = sanitizeAndValidateIp(parts[parts.length - 1]);
        }
      }
    }
  } else if (proxyMode === "local") {
    const realIp = getHeader("x-real-ip");
    resolvedIp = sanitizeAndValidateIp(realIp);
    if (!resolvedIp) {
      const xff = getHeader("x-forwarded-for");
      if (xff) {
        const first = xff.split(",")[0]?.trim();
        resolvedIp = sanitizeAndValidateIp(first);
      }
    }
    if (!resolvedIp) {
      return "127.0.0.1";
    }
  }

  if (resolvedIp) {
    return resolvedIp;
  }

  // Non-production development fallback
  if (!isProduction) {
    return "127.0.0.1";
  }

  // Production failure behavior: stable shared fallback bucket
  return "unknown";
}

// ----------------------------------------------------
// Global Singleton Rate Limiters for Platform Endpoints
// ----------------------------------------------------

// 1. Admin Login: 5 attempts per 60 seconds per IP
export const adminLoginRateLimiter = new MemoryRateLimiter(
  {
    name: "admin-login",
    windowMs: 60 * 1000,
    maxRequests: 5,
  },
  2000
);

// 2. Public Sourcing / Quotation Submission: 8 requests per 60 seconds per IP
export const publicRequestRateLimiter = new MemoryRateLimiter(
  {
    name: "public-request",
    windowMs: 60 * 1000,
    maxRequests: 8,
  },
  5000
);

// 3. File Uploads: 15 uploads per 60 seconds per IP
export const uploadRateLimiter = new MemoryRateLimiter(
  {
    name: "file-upload",
    windowMs: 60 * 1000,
    maxRequests: 15,
  },
  5000
);

// 4. Media Streaming: 150 requests per 60 seconds per IP
export const mediaStreamRateLimiter = new MemoryRateLimiter(
  {
    name: "media-stream",
    windowMs: 60 * 1000,
    maxRequests: 150,
  },
  5000
);
