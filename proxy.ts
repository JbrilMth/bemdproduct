import { NextRequest, NextResponse } from "next/server";

const ADMIN_COOKIE_NAME = "csh_admin_session";
const SESSION_SECRET =
  process.env.AUTH_SECRET ||
  process.env.SESSION_SECRET ||
  "csh_secure_admin_secret_key_2026_b2b_trade_production";

function getSecretPrefix(): string {
  const raw = process.env.ADMIN_SECRET_PATH || "adm-9f82c417b03e";
  return `/${raw.replace(/^\/+|\/+$/g, "")}`;
}

/**
 * Web Crypto HMAC-SHA256 signature verifier (compatible with Edge and Node.js runtimes)
 */
async function verifyToken(token: string): Promise<boolean> {
  try {
    if (!token || typeof token !== "string") return false;
    const parts = token.split(".");
    if (parts.length !== 2) return false;

    const [payloadB64, signature] = parts;

    // Decode and parse payload
    const payloadJson = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson);

    // Check expiration
    if (!payload.exp || payload.exp < Date.now()) {
      return false;
    }

    // Import secret key for HMAC
    const encoder = new TextEncoder();
    const keyData = encoder.encode(SESSION_SECRET);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );

    // Compute expected signature
    const dataToSign = encoder.encode(payloadB64);
    const sigArrayBuffer = await crypto.subtle.sign("HMAC", key, dataToSign);

    // Convert to base64url
    const sigBytes = new Uint8Array(sigArrayBuffer);
    let binary = "";
    for (let i = 0; i < sigBytes.byteLength; i++) {
      binary += String.fromCharCode(sigBytes[i]);
    }
    const expectedSigB64 = btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    return signature === expectedSigB64;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const secretPrefix = getSecretPrefix();

  // 1. Obvious /admin and /admin/* probing -> completely mask with standard 404
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const notFoundUrl = new URL("/_not-found", request.url);
    return NextResponse.rewrite(notFoundUrl, { status: 404 });
  }

  // 2. Intercept secret admin path
  const isSecretAdminRoute =
    pathname === secretPrefix || pathname.startsWith(`${secretPrefix}/`);

  if (!isSecretAdminRoute) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME);
  const isValidSession = sessionCookie?.value
    ? await verifyToken(sessionCookie.value)
    : false;

  const loginPath = `${secretPrefix}/login`;

  // Case A: Accessing the Secret Login page
  if (pathname === loginPath) {
    // If already authenticated, redirect to the secret dashboard
    if (isValidSession) {
      const dashboardUrl = new URL(secretPrefix, request.url);
      return NextResponse.redirect(dashboardUrl);
    }
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    return response;
  }

  // Case B: Accessing protected secret admin subpaths without a valid session
  if (!isValidSession) {
    const redirectLoginUrl = new URL(loginPath, request.url);
    const response = NextResponse.redirect(redirectLoginUrl);

    // Clear any stale or invalid cookies
    response.cookies.set(ADMIN_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
      path: "/",
      sameSite: "lax",
    });

    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    return response;
  }

  // Case C: Authenticated session accessing secret admin routes
  const response = NextResponse.next();
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/media (image streaming)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/media|_next/static|_next/image|favicon.ico).*)",
  ],
};

export default proxy;
