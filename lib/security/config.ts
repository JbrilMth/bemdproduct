/**
 * Centralized, pure-string security configuration validator.
 * Safe for both Edge/Middleware and Node.js runtimes (zero database/fs dependencies).
 */

export const FORBIDDEN_SESSION_SECRET_PLACEHOLDER =
  "csh_secure_admin_secret_key_2026_b2b_trade_production";

export const FORBIDDEN_DEFAULT_ADMIN_PATH = "adm-9f82c417b03e";

export const FORBIDDEN_ROUTE_COLLISIONS = new Set([
  "admin",
  "api",
  "products",
  "categories",
  "quote",
  "sourcing-request",
  "services",
  "_next",
  "favicon.ico",
  "uploads",
  "images",
  "login",
  "dashboard",
  "public",
  "static",
]);

// Conservative URL-segment format: 16-128 chars, alphanumeric + hyphens + underscores
const ADMIN_PATH_FORMAT_REGEX = /^[A-Za-z0-9_-]{16,128}$/;

/**
 * Validates the session signing secret for authentication and middleware.
 * Fails closed in production if missing, empty, default placeholder, or < 32 characters.
 */
export function validateSessionSecret(
  secret: string | undefined,
  isProduction: boolean
): string {
  const trimmed = secret?.trim() || "";

  const isDefaultOrEmpty =
    !trimmed || trimmed === FORBIDDEN_SESSION_SECRET_PLACEHOLDER;

  if (isDefaultOrEmpty) {
    if (isProduction) {
      throw new Error(
        "CRITICAL SECURITY CONFIGURATION ERROR: AUTH_SECRET or SESSION_SECRET environment variable is missing, empty, or set to the forbidden placeholder in production. The system must fail closed."
      );
    }
    return "dev_local_only_insecure_secret_key_never_use_in_prod";
  }

  if (trimmed.length < 32) {
    if (isProduction) {
      throw new Error(
        "CRITICAL SECURITY CONFIGURATION ERROR: AUTH_SECRET / SESSION_SECRET must be at least 32 characters long in production."
      );
    }
  }

  return trimmed;
}

/**
 * Validates the secret administrative route path segment.
 * Ensures the path:
 * 1. Is not empty or missing in production.
 * 2. Does not use the publicly known seed default in production.
 * 3. Does not contain traversal or special characters (/, \, .., ?, #, %).
 * 4. Does not collide with public top-level application routes.
 * 5. Matches strict length and character set bounds (16-128 chars).
 */
export function validateAdminSecretPath(
  pathSegment: string | undefined,
  isProduction: boolean
): string {
  const clean = pathSegment?.trim() || "";

  if (!clean) {
    if (isProduction) {
      throw new Error(
        "CRITICAL SECURITY CONFIGURATION ERROR: ADMIN_SECRET_PATH is not configured in production environment variables."
      );
    }
    return FORBIDDEN_DEFAULT_ADMIN_PATH;
  }

  // Prevent path traversal and special characters
  if (
    clean.includes("/") ||
    clean.includes("\\") ||
    clean.includes("..") ||
    clean.includes("?") ||
    clean.includes("#") ||
    clean.includes("%")
  ) {
    throw new Error(
      "CRITICAL SECURITY CONFIGURATION ERROR: ADMIN_SECRET_PATH contains illegal path traversal or query characters."
    );
  }

  // Reject collisions with existing public and framework routes
  const lowerClean = clean.toLowerCase();
  if (FORBIDDEN_ROUTE_COLLISIONS.has(lowerClean)) {
    throw new Error(
      `CRITICAL SECURITY CONFIGURATION ERROR: ADMIN_SECRET_PATH collides with protected public route "${lowerClean}". Choose an unguessable unique path.`
    );
  }

  // Reject the known default path in production
  if (isProduction && lowerClean === FORBIDDEN_DEFAULT_ADMIN_PATH.toLowerCase()) {
    throw new Error(
      `CRITICAL SECURITY CONFIGURATION ERROR: ADMIN_SECRET_PATH cannot use the forbidden default seed value "${FORBIDDEN_DEFAULT_ADMIN_PATH}" in production. Generate a new high-entropy secret path.`
    );
  }

  // Validate format and entropy bounds (16-128 chars)
  if (!ADMIN_PATH_FORMAT_REGEX.test(clean)) {
    throw new Error(
      "CRITICAL SECURITY CONFIGURATION ERROR: ADMIN_SECRET_PATH must be 16-128 characters consisting only of alphanumeric characters, hyphens, and underscores."
    );
  }

  return clean;
}
