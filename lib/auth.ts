import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const ADMIN_COOKIE_NAME = "csh_admin_session";

const SESSION_SECRET =
  process.env.AUTH_SECRET ||
  process.env.SESSION_SECRET ||
  "csh_secure_admin_secret_key_2026_b2b_trade_production";

export interface AdminSessionData {
  id: string;
  email: string;
  name: string;
  exp: number;
}

/**
 * Creates a cryptographically signed HMAC-SHA256 session token.
 */
export function createSessionToken(user: { id: string; email: string; name: string }): string {
  const payload: AdminSessionData = {
    id: user.id,
    email: user.email,
    name: user.name,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  const payloadString = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadString, "utf8").toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies a cryptographically signed session token.
 */
export function verifySessionToken(token: string): AdminSessionData | null {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payloadB64, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(payloadB64)
      .digest("base64url");

    // Timing-safe comparison to prevent timing attacks
    const sigBuffer = Buffer.from(signature, "utf8");
    const expBuffer = Buffer.from(expectedSignature, "utf8");
    if (sigBuffer.length !== expBuffer.length) return null;
    if (!crypto.timingSafeEqual(sigBuffer, expBuffer)) return null;

    const payloadJson = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload = JSON.parse(payloadJson) as AdminSessionData;

    // Check expiration
    if (!payload.exp || payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Retrieves and validates the current admin session from request cookies.
 */
export async function getAdminSession(): Promise<AdminSessionData | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);
    if (!sessionCookie?.value) return null;

    const session = verifySessionToken(sessionCookie.value);
    if (!session) return null;

    return session;
  } catch {
    return null;
  }
}

/**
 * Retrieves the server-configured private secret admin path.
 * Never exposed to client-side code.
 */
export function getAdminSecretPath(): string {
  const secretPath = process.env.ADMIN_SECRET_PATH;
  if (!secretPath) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Security Error: ADMIN_SECRET_PATH is not configured in environment variables.");
    }
    return "adm-9f82c417b03e";
  }
  return secretPath.replace(/^\/+|\/+$/g, "");
}

/**
 * Validates whether a given URL path segment matches the secret admin path.
 */
export function isValidAdminSecretPath(candidate: string): boolean {
  if (!candidate || typeof candidate !== "string") return false;
  const configured = getAdminSecretPath();
  const cleanCandidate = candidate.replace(/^\/+|\/+$/g, "");
  
  if (cleanCandidate.length !== configured.length) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(cleanCandidate, "utf8"),
      Buffer.from(configured, "utf8")
    );
  } catch {
    return cleanCandidate === configured;
  }
}

/**
 * Strictly requires an authenticated admin session for Server Actions and APIs.
 * Throws an Error if unauthenticated.
 */
export async function requireAdminSession(): Promise<AdminSessionData> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("Unauthorized: Valid Administrator session is required for this operation.");
  }

  // Verify that the admin user exists in the database
  const user = await prisma.adminUser.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    throw new Error("Unauthorized: Administrator account not found or revoked.");
  }

  // Authorization check: If ADMIN_AUTHORIZED_EMAIL is set, verify email matches
  const authorizedEmail = process.env.ADMIN_AUTHORIZED_EMAIL;
  if (authorizedEmail && user.email.toLowerCase() !== authorizedEmail.toLowerCase()) {
    throw new Error("Forbidden: This administrator account is not authorized.");
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    exp: session.exp,
  };
}

/**
 * Sets the secure HTTP-only admin session cookie.
 */
export async function setAdminSessionCookie(user: {
  id: string;
  email: string;
  name: string;
}): Promise<void> {
  const token = createSessionToken(user);
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
    sameSite: "lax",
  });
}

/**
 * Destroys the admin session cookie.
 */
export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  // Also set expired cookie for maximum browser compatibility
  cookieStore.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
    sameSite: "lax",
  });
}
