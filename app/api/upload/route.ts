import { NextRequest, NextResponse } from "next/server";
import { uploadToStorage, UploadResult } from "@/lib/storage";
import { getAdminSession } from "@/lib/auth";
import { uploadRateLimiter, getClientIp } from "@/lib/rate-limit";

// Maximum upload sizes
const MAX_SINGLE_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_BATCH_TOTAL_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_BATCH_FILES = 10;
const ALLOWED_FOLDERS = ["products", "categories", "sourcing", "general"] as const;

export async function POST(req: NextRequest) {
  try {
    // 1. CSRF / Origin Verification
    const origin = req.headers.get("origin");
    const host = req.headers.get("host") || req.headers.get("x-forwarded-host");
    const secFetchSite = req.headers.get("sec-fetch-site");

    if (secFetchSite === "cross-site") {
      return NextResponse.json(
        { success: false, error: "Cross-site request blocked." },
        { status: 403 }
      );
    }

    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return NextResponse.json(
            { success: false, error: "Forbidden: Cross-origin uploads are not permitted." },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { success: false, error: "Malformed origin header." },
          { status: 400 }
        );
      }
    }

    // 2. IP-based Rate Limiting (15 uploads / minute)
    const clientIp = await getClientIp();
    const rateCheck = uploadRateLimiter.check(clientIp);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Upload rate limit exceeded. Please wait ${rateCheck.resetInSeconds} seconds before uploading more files.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": rateCheck.resetInSeconds.toString(),
          },
        }
      );
    }

    // 3. Parse and Validate Multipart Form Data
    const formData = await req.formData();
    const rawFolder = formData.get("folder") as string;
    const folder = ALLOWED_FOLDERS.includes(rawFolder as any)
      ? (rawFolder as (typeof ALLOWED_FOLDERS)[number])
      : "products";

    const rawScopeId =
      (formData.get("scopeId") as string) ||
      (formData.get("productId") as string) ||
      (formData.get("categoryId") as string) ||
      null;

    const scopeId = rawScopeId ? rawScopeId.slice(0, 100).replace(/[^a-zA-Z0-9_-]/g, "") : null;

    // 4. Authorization: Sourcing folder is public for customer requests. Catalog folders require valid admin session.
    if (folder !== "sourcing") {
      const session = await getAdminSession();
      if (!session) {
        return NextResponse.json(
          { success: false, error: "Unauthorized: Valid administrator session required for catalog uploads." },
          { status: 401 }
        );
      }
    }

    const files = formData.getAll("files") as File[];
    const singleFile = formData.get("file") as File | null;

    const fileList: File[] = [];
    if (files && files.length > 0) {
      fileList.push(...files);
    } else if (singleFile) {
      fileList.push(singleFile);
    }

    if (fileList.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided in upload payload." },
        { status: 400 }
      );
    }

    if (fileList.length > MAX_BATCH_FILES) {
      return NextResponse.json(
        { success: false, error: `Maximum ${MAX_BATCH_FILES} files allowed per upload batch.` },
        { status: 400 }
      );
    }

    // Check total batch size
    const totalBatchSize = fileList.reduce((acc, f) => acc + (f.size || 0), 0);
    if (totalBatchSize > MAX_BATCH_TOTAL_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `Total upload batch size exceeds the limit of ${(MAX_BATCH_TOTAL_SIZE / 1024 / 1024).toFixed(0)} MB.`,
        },
        { status: 400 }
      );
    }

    const uploadedResults: UploadResult[] = [];

    for (const file of fileList) {
      // Validate individual file size
      if (file.size > MAX_SINGLE_FILE_SIZE) {
        return NextResponse.json(
          {
            success: false,
            error: `File "${file.name.slice(0, 50)}" exceeds the 10MB limit.`,
          },
          { status: 400 }
        );
      }

      // Sanitize filename against path traversal and null bytes
      const sanitizedName = file.name
        .replace(/\0/g, "")
        .replace(/[\/\\]/g, "")
        .slice(0, 100);

      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // uploadToStorage performs magic byte validation and safe key generation
      const result = await uploadToStorage(buffer, sanitizedName, file.type, folder, scopeId);
      uploadedResults.push(result);
    }

    return NextResponse.json({
      success: true,
      files: uploadedResults,
      file: uploadedResults[0],
    });
  } catch (err: any) {
    console.error("Upload API Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to process image upload.",
      },
      { status: 500 }
    );
  }
}
