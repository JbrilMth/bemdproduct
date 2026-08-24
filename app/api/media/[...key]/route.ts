import { NextRequest, NextResponse } from "next/server";
import { getFileFromR2, isR2Configured } from "@/lib/storage/r2";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

interface MediaRouteProps {
  params: Promise<{
    key: string[];
  }>;
}

export async function GET(req: NextRequest, { params }: MediaRouteProps) {
  try {
    const resolvedParams = await params;
    const keyArray = resolvedParams?.key;

    if (!keyArray || keyArray.length === 0) {
      return new NextResponse("Invalid media key", { status: 400 });
    }

    const storageKey = keyArray.join("/");

    // Prevent path traversal
    if (storageKey.includes("..")) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    if (isR2Configured()) {
      const fileData = await getFileFromR2(storageKey);

      if (!fileData || !fileData.body) {
        return new NextResponse("File Not Found in Cloudflare R2", { status: 404 });
      }

      return new NextResponse(Buffer.from(fileData.body), {
        status: 200,
        headers: {
          "Content-Type": fileData.contentType,
          "Content-Length": fileData.contentLength?.toString() || fileData.body.length.toString(),
          "Cache-Control": "public, max-age=31536000, immutable",
          ...(fileData.eTag ? { ETag: fileData.eTag } : {}),
        },
      });
    } else {
      // Local fallback
      const localPath = path.join(process.cwd(), "public", "uploads", storageKey);
      if (!fs.existsSync(localPath)) {
        return new NextResponse("File Not Found locally", { status: 404 });
      }

      const fileBuffer = fs.readFileSync(localPath);
      const ext = path.extname(localPath).toLowerCase();
      let contentType = "image/webp";
      if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
      else if (ext === ".png") contentType = "image/png";
      else if (ext === ".gif") contentType = "image/gif";
      else if (ext === ".svg") contentType = "image/svg+xml";

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
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
