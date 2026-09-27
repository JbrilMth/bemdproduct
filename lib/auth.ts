import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

import {
  validateSessionSecret,
  validateAdminSecretPath,
} from "@/lib/security/config";

export const ADMIN_COOKIE_NAME = "csh_admin_session";

/**
 * Retrieves the cryptographic session signing secret.
 * Enforces production fail-closed behavior via centralized security validation.
 */
export function getSessionSecret(): string {
  return validateSessionSecret(
    process.env.AUTH_SECRET || process.env.SESSION_SECRET,
    process.env.NODE_ENV === "production"
  );
}

export interface AdminSessionData {
  id: string;
  email: string;
  name: string;
  sessionVersion: number;
  exp: number;
}

/**
 * Creates a cryptographically signed HMAC-SHA256 session token.
 */
export function createSessionToken(user: {
  id: string;
  email: string;
  name: string;
  sessionVersion?: number;
}): string {
  const payload: AdminSessionData = {
    id: user.id,
    email: user.email,
    name: user.name,
    sessionVersion: typeof user.sessionVersion === "number" ? user.sessionVersion : 0,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  const payloadString = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadString, "utf8").toString("base64url");
  const secret = getSessionSecret();
  const signature = crypto
    .createHmac("sha256", secret)
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
    const secret = getSessionSecret();
    const expectedSignature = crypto
      .createHmac("sha256", secret)
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

    if (typeof payload.sessionVersion !== "number") {
      payload.sessionVersion = 0;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Retrieves and validates the current admin session from request cookies.
 * Validates HMAC, expiration, database account existence, and sessionVersion consistency.
 */
export async function getAdminSession(): Promise<AdminSessionData | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);
    if (!sessionCookie?.value) return null;

    const session = verifySessionToken(sessionCookie.value);
    if (!session) return null;

    // Validate account existence and sessionVersion against database
    const user = await prisma.adminUser.findUnique({
      where: { id: session.id },
      select: { id: true, email: true, name: true, sessionVersion: true },
    });

    if (!user) return null;

    // Reject if session version does not match current database sessionVersion
    const tokenVersion = typeof session.sessionVersion === "number" ? session.sessionVersion : 0;
    const dbVersion = typeof user.sessionVersion === "number" ? user.sessionVersion : 0;
    if (tokenVersion !== dbVersion) {
      return null;
    }

    // Check authorized email if configured
    const authorizedEmail = process.env.ADMIN_AUTHORIZED_EMAIL;
    if (authorizedEmail && user.email.toLowerCase() !== authorizedEmail.toLowerCase()) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      sessionVersion: dbVersion,
      exp: session.exp,
    };
  } catch {
    return null;
  }
}

/**
 * Retrieves the server-configured private secret admin path.
 * Never exposed to client-side code.
 */
export function getAdminSecretPath(): string {
  return validateAdminSecretPath(
    process.env.ADMIN_SECRET_PATH,
    process.env.NODE_ENV === "production"
  );
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
 * Throws an Error if unauthenticated or revoked.
 */
export async function requireAdminSession(): Promise<AdminSessionData> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("Unauthorized: Valid Administrator session is required for this operation.");
  }
  return session;
}

/**
 * Sets the secure HTTP-only admin session cookie.
 */
export async function setAdminSessionCookie(user: {
  id: string;
  email: string;
  name: string;
  sessionVersion?: number;
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
  try {
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
  } catch {
    // If invoked outside an active request scope (e.g., test runner), safely handle
  }
}
