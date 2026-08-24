import { NextRequest, NextResponse } from "next/server";
import { uploadToStorage, UploadResult } from "@/lib/storage";
import { getAdminSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const folder = (formData.get("folder") as "products" | "categories" | "sourcing" | "general") || "products";
    const scopeId = (formData.get("scopeId") as string) || (formData.get("productId") as string) || (formData.get("categoryId") as string) || null;
    
    // Sourcing folder is public for customer requests. All other folders (products, categories, general) require admin auth.
    if (folder !== "sourcing") {
      const session = await getAdminSession();
      if (!session) {
        return NextResponse.json(
          { success: false, error: "Unauthorized: Administrator session required for catalog uploads." },
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

    // Limit max files per upload request
    if (fileList.length > 10) {
      return NextResponse.json(
        { success: false, error: "Maximum 10 files allowed per upload batch." },
        { status: 400 }
      );
    }

    const uploadedResults: UploadResult[] = [];

    for (const file of fileList) {
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: `File "${file.name}" exceeds 10MB limit.` },
          { status: 400 }
        );
      }

      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const result = await uploadToStorage(buffer, file.name, file.type, folder, scopeId);
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
      { success: false, error: err.message || "Failed to process image upload." },
      { status: 500 }
    );
  }
}
