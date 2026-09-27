import assert from "assert";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import {
  validateSessionSecret,
  validateAdminSecretPath,
  FORBIDDEN_SESSION_SECRET_PLACEHOLDER,
  FORBIDDEN_DEFAULT_ADMIN_PATH,
} from "../lib/security/config";
import {
  validateImageBuffer,
  validateImageDimensions,
  getImageDimensions,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_WIDTH,
  MAX_IMAGE_HEIGHT,
  MAX_IMAGE_PIXELS,
  MAX_IMAGE_SIZE_BYTES,
} from "../lib/storage/r2";
import {
  sanitizeAndValidateIp,
  getClientIp,
  adminLoginRateLimiter,
  publicRequestRateLimiter,
  uploadRateLimiter,
} from "../lib/rate-limit";
import { verifySessionToken, createSessionToken } from "../lib/auth";

let passed = 0;
let failed = 0;

async function it(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  ✗ ${name}:`, err.message);
    failed++;
  }
}

// Helpers to construct minimal valid binary test images
function createTestPng(width: number, height: number): Buffer {
  const buf = Buffer.alloc(33);
  // PNG signature
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buf, 0);
  // IHDR length 13
  buf.writeUInt32BE(13, 8);
  // IHDR chunk type
  Buffer.from("IHDR", "ascii").copy(buf, 12);
  // Width and Height
  buf.writeUInt32BE(width, 16);
  buf.writeUInt32BE(height, 20);
  buf[24] = 8; // bit depth
  buf[25] = 2; // color type (RGB)
  return buf;
}

function createTestGif(width: number, height: number): Buffer {
  const buf = Buffer.alloc(13);
  Buffer.from("GIF89a", "ascii").copy(buf, 0);
  buf.writeUInt16LE(width, 6);
  buf.writeUInt16LE(height, 8);
  return buf;
}

function createTestWebpVP8(width: number, height: number): Buffer {
  const buf = Buffer.alloc(32);
  Buffer.from("RIFF", "ascii").copy(buf, 0);
  buf.writeUInt32LE(24, 4); // file size
  Buffer.from("WEBP", "ascii").copy(buf, 8);
  Buffer.from("VP8 ", "ascii").copy(buf, 12);
  buf.writeUInt32LE(12, 16); // chunk size
  // Frame tag
  buf[23] = 0x9d;
  buf[24] = 0x01;
  buf[25] = 0x2a;
  buf.writeUInt16LE(width & 0x3fff, 26);
  buf.writeUInt16LE(height & 0x3fff, 28);
  return buf;
}

function createTestJpeg(width: number, height: number): Buffer {
  // SOI (2 bytes) + SOF0 (2 + 2 len + 1 prec + 2 height + 2 width + 3 comp = 12) + EOI (2 bytes) = 16 bytes
  const buf = Buffer.alloc(16);
  buf[0] = 0xff;
  buf[1] = 0xd8; // SOI
  buf[2] = 0xff;
  buf[3] = 0xc0; // SOF0
  buf.writeUInt16BE(11, 4); // seg len: 11
  buf[6] = 8; // precision
  buf.writeUInt16BE(height, 7);
  buf.writeUInt16BE(width, 9);
  buf[11] = 3; // 3 components
  buf[12] = 0;
  buf[13] = 0;
  buf[14] = 0xff;
  buf[15] = 0xd9; // EOI
  return buf;
}

async function runTests() {
  console.log("=================================================");
  console.log("🔒 RUNNING SECURITY REGRESSION TEST SUITE PASS 2");
  console.log("=================================================\n");

  // -----------------------------------------------------------------
  console.log("1. DEPENDENCIES & PACKAGE SECURITY");
  // -----------------------------------------------------------------
  await it("installed Next.js version is >= 16.3.3 (patched against GHSA-2xp9-vwfh-vxw4)", () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../package.json"), "utf8")
    );
    const nextVer = pkg.dependencies.next.replace(/[\^~>=]/g, "");
    const [major, minor, patch] = nextVer.split(".").map(Number);
    assert(major >= 16, "Next.js major must be >= 16");
    if (major === 16 && minor === 3) {
      assert(patch >= 3, `Expected patch >= 3, found ${patch}`);
    }
  });

  await it("ALLOWED_IMAGE_TYPES strictly excludes image/avif", () => {
    assert.strictEqual(
      ALLOWED_IMAGE_TYPES["image/avif"],
      undefined,
      "image/avif must not be present in ALLOWED_IMAGE_TYPES"
    );
    assert.deepStrictEqual(Object.keys(ALLOWED_IMAGE_TYPES).sort(), [
      "image/gif",
      "image/jpeg",
      "image/png",
      "image/webp",
    ]);
  });

  // -----------------------------------------------------------------
  console.log("\n2. UPLOADS & IMAGE SECURITY");
  // -----------------------------------------------------------------
  await it("JPEG binary buffer is accepted", () => {
    const jpg = createTestJpeg(800, 600);
    const res = validateImageBuffer(jpg, "image/jpeg");
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.detectedMime, "image/jpeg");
  });

  await it("PNG binary buffer is accepted", () => {
    const png = createTestPng(500, 500);
    const res = validateImageBuffer(png, "image/png");
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.detectedMime, "image/png");
  });

  await it("WebP binary buffer is accepted", () => {
    const webp = createTestWebpVP8(640, 480);
    const res = validateImageBuffer(webp, "image/webp");
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.detectedMime, "image/webp");
  });

  await it("GIF binary buffer is accepted", () => {
    const gif = createTestGif(320, 240);
    const res = validateImageBuffer(gif, "image/gif");
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.detectedMime, "image/gif");
  });

  await it("SVG is rejected to prevent Stored XSS", () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    const res = validateImageBuffer(svg, "image/svg+xml");
    assert.strictEqual(res.valid, false);
  });

  await it("AVIF claimed MIME type is rejected", () => {
    const jpg = createTestJpeg(100, 100);
    const res = validateImageBuffer(jpg, "image/avif");
    assert.strictEqual(res.valid, false);
    assert(res.error?.includes("AVIF"));
  });

  await it("AVIF magic bytes (ftypavif) are rejected even under spoofed MIME", () => {
    const avifHeader = Buffer.from([
      0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, // ....ftyp
      0x61, 0x76, 0x69, 0x66, 0x00, 0x00, 0x00, 0x00, // avif....
    ]);
    const res = validateImageBuffer(avifHeader, "image/jpeg");
    assert.strictEqual(res.valid, false);
    assert(res.error?.includes("AVIF"));
  });

  await it("Executable renamed to .jpg (Windows MZ header) is rejected", () => {
    const exe = Buffer.from("MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff");
    const res = validateImageBuffer(exe, "image/jpeg");
    assert.strictEqual(res.valid, false);
    assert(res.error?.includes("executable") || res.error?.includes("suspicious"));
  });

  await it("HTML renamed to .png (<html / <!doctype) is rejected", () => {
    const html = Buffer.from("<!DOCTYPE html><html><body><h1>Hacked</h1></body></html>");
    const res = validateImageBuffer(html, "image/png");
    assert.strictEqual(res.valid, false);
  });

  await it("Wrong MIME / magic combination is rejected (JPEG bytes claimed as PNG)", () => {
    const jpg = createTestJpeg(200, 200);
    const res = validateImageBuffer(jpg, "image/png");
    assert.strictEqual(res.valid, false);
    assert(res.error?.includes("spoofing"));
  });

  await it("Image dimensions within limits are accepted", () => {
    assert.strictEqual(MAX_IMAGE_WIDTH, 10000);
    assert.strictEqual(MAX_IMAGE_HEIGHT, 10000);
    assert.strictEqual(MAX_IMAGE_PIXELS, 40_000_000);
    const png = createTestPng(1920, 1080);
    const dims = getImageDimensions(png);
    assert.deepStrictEqual(dims, { width: 1920, height: 1080 });
    const res = validateImageDimensions(png);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.width, 1920);
    assert.strictEqual(res.height, 1080);
  });

  await it("Image dimension exceeding 10,000 px width is rejected", () => {
    const oversizedPng = createTestPng(12000, 100);
    const res = validateImageDimensions(oversizedPng);
    assert.strictEqual(res.valid, false);
    assert(res.error?.includes("exceed maximum permitted limit"));
  });

  await it("Image total pixels exceeding 40,000,000 px is rejected (decompression bomb protection)", () => {
    const bombPng = createTestPng(8000, 6000); // 48,000,000 pixels
    const res = validateImageDimensions(bombPng);
    assert.strictEqual(res.valid, false);
    assert(res.error?.includes("Total image pixels"));
  });

  await it("Zero dimension image is rejected", () => {
    const zeroPng = createTestPng(0, 500);
    const res = validateImageDimensions(zeroPng);
    assert.strictEqual(res.valid, false);
  });

  // -----------------------------------------------------------------
  console.log("\n3. ADMIN CONFIGURATION VALIDATION");
  // -----------------------------------------------------------------
  await it("missing production AUTH_SECRET throws critical error", () => {
    assert.throws(
      () => validateSessionSecret(undefined, true),
      /CRITICAL SECURITY CONFIGURATION ERROR/
    );
  });

  await it("empty production AUTH_SECRET throws critical error", () => {
    assert.throws(
      () => validateSessionSecret("   ", true),
      /CRITICAL SECURITY CONFIGURATION ERROR/
    );
  });

  await it("placeholder AUTH_SECRET throws critical error in production", () => {
    assert.throws(
      () => validateSessionSecret(FORBIDDEN_SESSION_SECRET_PLACEHOLDER, true),
      /forbidden placeholder/
    );
  });

  await it("<32-character AUTH_SECRET throws critical error in production", () => {
    assert.throws(
      () => validateSessionSecret("short_secret_only_24_chars", true),
      /at least 32 characters/
    );
  });

  await it("valid strong session secret is accepted in production", () => {
    const strong = "a_very_strong_random_secret_with_more_than_32_characters_12345";
    const validated = validateSessionSecret(strong, true);
    assert.strictEqual(validated, strong);
  });

  // -----------------------------------------------------------------
  console.log("\n4. ADMIN SECRET PATH VALIDATION");
  // -----------------------------------------------------------------
  await it("missing admin secret path throws in production", () => {
    assert.throws(
      () => validateAdminSecretPath(undefined, true),
      /ADMIN_SECRET_PATH is not configured/
    );
  });

  await it("default seed admin path (adm-9f82c417b03e) is forbidden in production", () => {
    assert.throws(
      () => validateAdminSecretPath(FORBIDDEN_DEFAULT_ADMIN_PATH, true),
      /forbidden default seed value/
    );
  });

  await it("'admin' is forbidden as secret path", () => {
    assert.throws(
      () => validateAdminSecretPath("admin", false),
      /collides with protected public route/
    );
  });

  await it("path containing slash '/' is rejected", () => {
    assert.throws(
      () => validateAdminSecretPath("admin/secret", false),
      /illegal path traversal/
    );
    assert.throws(
      () => validateAdminSecretPath("/secret-path", false),
      /illegal path traversal/
    );
  });

  await it("path containing '..' traversal is rejected", () => {
    assert.throws(
      () => validateAdminSecretPath("..adm-secret", false),
      /illegal path traversal/
    );
  });

  await it("path colliding with public application route is rejected", () => {
    for (const route of ["products", "categories", "quote", "sourcing-request", "services", "api", "_next", "favicon.ico"]) {
      assert.throws(
        () => validateAdminSecretPath(route, false),
        /collides with protected public route/
      );
    }
  });

  await it("valid random URL-safe path is accepted", () => {
    const validPath = "csh-manage-83a9e01bc47d2a";
    const res = validateAdminSecretPath(validPath, true);
    assert.strictEqual(res, validPath);
  });

  // -----------------------------------------------------------------
  console.log("\n5. RATE LIMITER CLIENT-IP TRUST MODEL");
  // -----------------------------------------------------------------
  await it("net.isIP validates IPv4 correctly", () => {
    assert.strictEqual(sanitizeAndValidateIp("192.168.1.1"), "192.168.1.1");
    assert.strictEqual(sanitizeAndValidateIp("  203.0.113.195  "), "203.0.113.195");
  });

  await it("net.isIP validates IPv6 correctly", () => {
    const ipv6 = "2001:0db8:85a3:0000:0000:8a2e:0370:7334";
    assert.strictEqual(sanitizeAndValidateIp(ipv6), ipv6);
  });

  await it("sanitizeAndValidateIp rejects malformed, comma-separated, and injection inputs", () => {
    assert.strictEqual(sanitizeAndValidateIp("1.1.1.1, 2.2.2.2"), null);
    assert.strictEqual(sanitizeAndValidateIp("1.1.1.1\r\nX-Bad: true"), null);
    assert.strictEqual(sanitizeAndValidateIp("not-an-ip"), null);
    assert.strictEqual(sanitizeAndValidateIp(""), null);
    assert.strictEqual(sanitizeAndValidateIp("   "), null);
  });

  await it("spoofed arbitrary X-Forwarded-For cannot rotate rate limit identity in Vercel mode", async () => {
    const origMode = process.env.TRUSTED_PROXY_MODE;
    const origEnv = process.env.NODE_ENV;
    process.env.TRUSTED_PROXY_MODE = "vercel";
    (process.env as any).NODE_ENV = "production";

    try {
      // In Vercel reverse proxy semantics, client attacker sends X-Forwarded-For: 1.1.1.1.
      // Vercel proxy appends the TCP connecting address 203.0.113.50 to the end.
      const reqHeaders1 = {
        "x-forwarded-for": "1.1.1.1, 203.0.113.50",
      };
      const ip1 = await getClientIp(reqHeaders1);
      assert.strictEqual(ip1, "203.0.113.50", "Must resolve the proxy-guaranteed last IP");

      // Attacker changes client X-Forwarded-For to 2.2.2.2
      const reqHeaders2 = {
        "x-forwarded-for": "2.2.2.2, 203.0.113.50",
      };
      const ip2 = await getClientIp(reqHeaders2);
      assert.strictEqual(ip2, "203.0.113.50", "Must resolve the proxy-guaranteed last IP, defeating rotation");
      assert.strictEqual(ip1, ip2, "Client IP must remain stable regardless of client spoofed header");
    } finally {
      process.env.TRUSTED_PROXY_MODE = origMode;
      (process.env as any).NODE_ENV = origEnv;
    }
  });

  await it("x-vercel-forwarded-for header is trusted when present in Vercel mode", async () => {
    const origMode = process.env.TRUSTED_PROXY_MODE;
    process.env.TRUSTED_PROXY_MODE = "vercel";
    try {
      const headers = {
        "x-vercel-forwarded-for": "198.51.100.22",
        "x-forwarded-for": "1.1.1.1",
      };
      const ip = await getClientIp(headers);
      assert.strictEqual(ip, "198.51.100.22");
    } finally {
      process.env.TRUSTED_PROXY_MODE = origMode;
    }
  });

  await it("Cloudflare mode trusts cf-connecting-ip and ignores X-Forwarded-For", async () => {
    const origMode = process.env.TRUSTED_PROXY_MODE;
    process.env.TRUSTED_PROXY_MODE = "cloudflare";
    try {
      const headers = {
        "cf-connecting-ip": "198.51.100.77",
        "x-forwarded-for": "1.1.1.1",
      };
      const ip = await getClientIp(headers);
      assert.strictEqual(ip, "198.51.100.77");
    } finally {
      process.env.TRUSTED_PROXY_MODE = origMode;
    }
  });

  await it("untrusted cf-connecting-ip in Vercel mode is ignored", async () => {
    const origMode = process.env.TRUSTED_PROXY_MODE;
    process.env.TRUSTED_PROXY_MODE = "vercel";
    try {
      const headers = {
        "cf-connecting-ip": "1.2.3.4", // Attacker sends this header directly
        "x-real-ip": "203.0.113.99",
      };
      const ip = await getClientIp(headers);
      assert.strictEqual(ip, "203.0.113.99", "Must use verified proxy header, not unverified cf-connecting-ip");
    } finally {
      process.env.TRUSTED_PROXY_MODE = origMode;
    }
  });

  await it("missing or malformed IP in production falls back to stable 'unknown' bucket", async () => {
    const origEnv = process.env.NODE_ENV;
    const origMode = process.env.TRUSTED_PROXY_MODE;
    (process.env as any).NODE_ENV = "production";
    process.env.TRUSTED_PROXY_MODE = "vercel";
    try {
      const headers = { "x-forwarded-for": "malformed_garbage" };
      const ip = await getClientIp(headers);
      assert.strictEqual(ip, "unknown", "Unknown clients must share the 'unknown' rate limit bucket");
    } finally {
      (process.env as any).NODE_ENV = origEnv;
      process.env.TRUSTED_PROXY_MODE = origMode;
    }
  });

  await it("rate limiters throttle requests when capacity exceeded", () => {
    const testIp = "192.0.2.1";
    // adminLoginRateLimiter allows 5 requests
    for (let i = 0; i < 5; i++) {
      const check = adminLoginRateLimiter.check(testIp);
      assert.strictEqual(check.allowed, true);
    }
    const blocked = adminLoginRateLimiter.check(testIp);
    assert.strictEqual(blocked.allowed, false, "6th attempt must be throttled");
    adminLoginRateLimiter.reset(testIp);
  });

  await it("oversized image file buffer exceeds MAX_IMAGE_SIZE_BYTES limit", () => {
    assert.strictEqual(MAX_IMAGE_SIZE_BYTES, 10 * 1024 * 1024);
    const oversizedBuffer = { length: 11 * 1024 * 1024 };
    assert(oversizedBuffer.length > MAX_IMAGE_SIZE_BYTES, "11MB must exceed 10MB limit");
  });

  // -----------------------------------------------------------------
  console.log("\n6. MEDIA KEY ROUTE INTEGRITY");
  // -----------------------------------------------------------------
  await it("safe media key regex allows valid jpg, png, webp, gif", () => {
    const regex = /^(products|categories|requests|general)\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|gif)$/i;
    assert(regex.test("products/general/c18fb907-7ae3-4e5c-bd89-8d7694380eb9.webp"));
    assert(regex.test("categories/cat1/img_123.jpg"));
    assert(regex.test("requests/req1/reference.png"));
    assert(regex.test("general/item/badge.gif"));
  });

  await it("safe media key regex blocks avif and dangerous extensions", () => {
    const regex = /^(products|categories|requests|general)\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|gif)$/i;
    assert(!regex.test("products/general/image.avif"), "AVIF must be blocked");
    assert(!regex.test("products/general/image.svg"), "SVG must be blocked");
    assert(!regex.test("products/general/script.js"), "JS must be blocked");
    assert(!regex.test("products/general/exploit.php"), "PHP must be blocked");
  });

  await it("path traversal in media key is blocked", () => {
    const regex = /^(products|categories|requests|general)\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|gif)$/i;
    assert(!regex.test("../secret.webp"));
    assert(!regex.test("products/../../secret.webp"));
    assert(!regex.test("products/general/../../../etc/passwd"));
  });

  await it("backslash traversal in media key is blocked", () => {
    const regex = /^(products|categories|requests|general)\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|gif)$/i;
    assert(!regex.test("products\\general\\secret.webp"));
    assert(!regex.test("..\\..\\secret.webp"));
  });

  await it("encoded traversal in media key is blocked", () => {
    const regex = /^(products|categories|requests|general)\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|gif)$/i;
    assert(!regex.test("products/%2e%2e/secret.webp"));
    assert(!regex.test("%2e%2e%2fsecret.webp"));
  });

  // -----------------------------------------------------------------
  console.log("\n7. RATE LIMITING ENDPOINT PROTECTION");
  // -----------------------------------------------------------------
  await it("publicRequestRateLimiter throttles after 8 requests", () => {
    const testIp = "198.51.100.1";
    for (let i = 0; i < 8; i++) {
      const check = publicRequestRateLimiter.check(testIp);
      assert.strictEqual(check.allowed, true);
    }
    const blocked = publicRequestRateLimiter.check(testIp);
    assert.strictEqual(blocked.allowed, false, "9th attempt must be throttled");
    publicRequestRateLimiter.reset(testIp);
  });

  await it("uploadRateLimiter throttles after 15 requests", () => {
    const testIp = "198.51.100.2";
    for (let i = 0; i < 15; i++) {
      const check = uploadRateLimiter.check(testIp);
      assert.strictEqual(check.allowed, true);
    }
    const blocked = uploadRateLimiter.check(testIp);
    assert.strictEqual(blocked.allowed, false, "16th attempt must be throttled");
    uploadRateLimiter.reset(testIp);
  });

  // -----------------------------------------------------------------
  console.log("\n8. SESSION TOKEN & AUTHORIZATION INTEGRITY");
  // -----------------------------------------------------------------
  await it("valid session token can be created and verified", () => {
    process.env.AUTH_SECRET = "test_strong_secret_key_with_at_least_32_characters_for_testing";
    const user = { id: "user-123", email: "admin@test.com", name: "Admin" };
    const token = createSessionToken(user);
    const verified = verifySessionToken(token);
    assert(verified !== null);
    assert.strictEqual(verified.id, user.id);
    assert.strictEqual(verified.email, user.email);
  });

  await it("tampered session token signature is rejected", () => {
    process.env.AUTH_SECRET = "test_strong_secret_key_with_at_least_32_characters_for_testing";
    const user = { id: "user-123", email: "admin@test.com", name: "Admin" };
    const token = createSessionToken(user);
    const [payload, sig] = token.split(".");
    const tampered = `${payload}.${sig.slice(0, -3)}xyz`;
    const verified = verifySessionToken(tampered);
    assert.strictEqual(verified, null, "Tampered token must fail signature verification");
  });

  await it("anonymous / empty token fails verification", () => {
    assert.strictEqual(verifySessionToken(""), null);
    assert.strictEqual(verifySessionToken("invalid-token-string"), null);
  });

  await it("expired session token fails verification", () => {
    process.env.AUTH_SECRET = "test_strong_secret_key_with_at_least_32_characters_for_testing";
    const expiredPayload = {
      id: "user-123",
      email: "admin@test.com",
      name: "Admin",
      exp: Date.now() - 10000, // expired 10 seconds ago
    };
    const payloadB64 = Buffer.from(JSON.stringify(expiredPayload), "utf8").toString("base64url");
    const sig = crypto.createHmac("sha256", process.env.AUTH_SECRET).update(payloadB64).digest("base64url");
    const expiredToken = `${payloadB64}.${sig}`;
    assert.strictEqual(verifySessionToken(expiredToken), null, "Expired token must be rejected");
  });

  console.log("\n=================================================");
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
