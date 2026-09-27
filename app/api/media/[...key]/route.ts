import { NextRequest, NextResponse } from "next/server";
import { getFileFromR2, isR2Configured } from "@/lib/storage/r2";
import { mediaStreamRateLimiter, getClientIp } from "@/lib/rate-limit";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

interface MediaRouteProps {
  params: Promise<{
    key: string[];
  }>;
}

// Strict whitelist pattern for application-generated storage keys
// e.g., products/general/c18fb907-7ae3-4e5c-bd89-8d7694380eb9.webp
const SAFE_MEDIA_KEY_REGEX =
  /^(products|categories|requests|general)\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|gif)$/i;

export async function GET(req: NextRequest, { params }: MediaRouteProps) {
  try {
    // 1. Rate Limiting (150 requests/min per IP)
    const clientIp = await getClientIp();
    const rateCheck = mediaStreamRateLimiter.check(clientIp);
    if (!rateCheck.allowed) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: { "Retry-After": rateCheck.resetInSeconds.toString() },
      });
    }

    const resolvedParams = await params;
    const keyArray = resolvedParams?.key;

    if (!keyArray || keyArray.length === 0) {
      return new NextResponse("Invalid media key", { status: 400 });
    }

    // Safely decode components
    let storageKey = "";
    try {
      storageKey = keyArray.map((segment) => decodeURIComponent(segment)).join("/");
    } catch {
      return new NextResponse("Malformed media key", { status: 400 });
    }

    // 2. Strict Traversal & Structure Validation
    if (
      storageKey.includes("..") ||
      storageKey.includes("\\") ||
      storageKey.includes("\0") ||
      storageKey.startsWith("/")
    ) {
      return new NextResponse("Forbidden: Path traversal blocked", { status: 403 });
    }

    if (!SAFE_MEDIA_KEY_REGEX.test(storageKey)) {
      return new NextResponse("Forbidden: Invalid media key structure", { status: 403 });
    }

    // Standard defensive security headers for all media delivery
    const securityHeaders = {
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Referrer-Policy": "no-referrer",
    };

    if (isR2Configured()) {
      const fileData = await getFileFromR2(storageKey);

      if (!fileData || !fileData.body) {
        return new NextResponse("Media Not Found", { status: 404, headers: securityHeaders });
      }

      return new NextResponse(Buffer.from(fileData.body), {
        status: 200,
        headers: {
          ...securityHeaders,
          "Content-Type": fileData.contentType,
          "Content-Length": fileData.contentLength?.toString() || fileData.body.length.toString(),
          "Cache-Control": "public, max-age=31536000, immutable",
          ...(fileData.eTag ? { ETag: fileData.eTag } : {}),
        },
      });
    } else {
      // Local fallback with strict directory boundary containment
      const baseUploadsDir = path.resolve(process.cwd(), "public", "uploads");
      const localPath = path.resolve(baseUploadsDir, storageKey);

      if (!localPath.startsWith(baseUploadsDir)) {
        return new NextResponse("Forbidden", { status: 403, headers: securityHeaders });
      }

      if (!fs.existsSync(localPath)) {
        return new NextResponse("Media Not Found", { status: 404, headers: securityHeaders });
      }

      const fileBuffer = fs.readFileSync(localPath);
      const ext = path.extname(localPath).toLowerCase();
      let contentType = "image/webp";
      if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
      else if (ext === ".png") contentType = "image/png";
      else if (ext === ".gif") contentType = "image/gif";

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          ...securityHeaders,
          "Content-Type": contentType,
          "Content-Length": fileBuffer.length.toString(),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  } catch (err: any) {
    console.error("Media delivery error:", err);
    return new NextResponse("Internal server error delivering media", { status: 500 });
  }
}
