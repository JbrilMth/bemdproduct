"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { Upload, X, Star, AlertCircle, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { resolveImageUrl } from "@/lib/utils";

export interface UploadedImageItem {
  id?: string;
  imageUrl: string;
  storageKey?: string | null;
  sortOrder: number;
}

interface ImageUploaderProps {
  images: UploadedImageItem[];
  onChange: (images: UploadedImageItem[]) => void;
  multiple?: boolean;
  folder?: "products" | "categories" | "sourcing" | "general";
  label?: string;
  description?: string;
  maxFiles?: number;
}

export function ImageUploader({
  images,
  onChange,
  multiple = true,
  folder = "products",
  label = "Upload Images",
  description = "Select JPG, PNG, or WebP images from your device (Max 10MB per file)",
  maxFiles = 10,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMessage(null);

    const validFiles: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      // Validate MIME type
      const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowed.includes(file.type)) {
        setErrorMessage(`"${file.name}" has an unsupported format. Use JPG, PNG, or WebP.`);
        return;
      }
      // Validate size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage(`"${file.name}" exceeds 10MB size limit.`);
        return;
      }
      validFiles.push(file);
    }

    if (!multiple && validFiles.length > 1) {
      setErrorMessage("Please select a single image.");
      return;
    }

    if (images.length + validFiles.length > maxFiles) {
      setErrorMessage(`Maximum ${maxFiles} images allowed.`);
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("folder", folder);
      validFiles.forEach((file) => formData.append("files", file));

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Image upload failed.");
      }

      const newUploadedItems: UploadedImageItem[] = data.files.map((f: any, idx: number) => ({
        imageUrl: f.url,
        storageKey: f.storageKey,
        sortOrder: multiple ? images.length + idx : 0,
      }));

      if (!multiple) {
        onChange(newUploadedItems.slice(0, 1));
      } else {
        onChange([...images, ...newUploadedItems]);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setErrorMessage(err.message || "Failed to upload image.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleRemoveImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    // Re-index sortOrder
    const reindexed = updated.map((img, i) => ({
      ...img,
      sortOrder: i,
    }));
    onChange(reindexed);
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    const selected = images[index];
    const remaining = images.filter((_, i) => i !== index);
    const reordered = [selected, ...remaining].map((img, i) => ({
      ...img,
      sortOrder: i,
    }));
    onChange(reordered);
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const copy = [...images];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    const reordered = copy.map((img, i) => ({
      ...img,
      sortOrder: i,
    }));
    onChange(reordered);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-800">
            {label}
          </label>
          <p className="text-[11px] text-neutral-500">{description}</p>
        </div>
        {images.length > 0 && multiple && (
          <span className="text-[11px] font-semibold text-neutral-500">
            {images.length} / {maxFiles} images
          </span>
        )}
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 border border-neutral-300 bg-neutral-50 p-2.5 text-xs text-neutral-800">
          <AlertCircle className="h-4 w-4 text-neutral-900 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={(e: ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)}
        className="hidden"
      />

      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed p-6 text-center cursor-pointer transition ${
          isDragging
            ? "border-neutral-900 bg-neutral-100"
            : "border-neutral-300 bg-neutral-50 hover:bg-neutral-100/70 hover:border-neutral-400"
        } ${uploading ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          {uploading ? (
            <>
              <Loader2 className="h-7 w-7 animate-spin text-neutral-900" />
              <p className="text-xs font-semibold text-neutral-900">
                Uploading from device...
              </p>
            </>
          ) : (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-neutral-200 text-neutral-700">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-900">
                  Click to select files or drag and drop
                </p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  JPG, PNG, WebP up to 10MB
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
          {images.map((img, idx) => (
            <div
              key={img.id || img.imageUrl || idx}
              className="group relative border border-neutral-200 bg-white overflow-hidden"
            >
              <div className="aspect-square w-full overflow-hidden bg-neutral-100 relative">
                <img
                  src={resolveImageUrl(img.imageUrl)}
                  alt={`Preview ${idx + 1}`}
                  className="h-full w-full object-cover"
                />

                {/* Primary Badge */}
                {idx === 0 && multiple && (
                  <span className="absolute top-1.5 left-1.5 bg-neutral-900 text-white text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider flex items-center gap-0.5 z-10">
                    <Star className="h-2.5 w-2.5 fill-current" /> Primary
                  </span>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="p-1.5 bg-white border-t border-neutral-100 flex items-center justify-between gap-1 text-xs">
                {multiple && idx > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetPrimary(idx);
                    }}
                    title="Set as primary image"
                    className="text-[10px] font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-0.5"
                  >
                    <Star className="h-3 w-3" /> Set Primary
                  </button>
                )}

                {multiple && (
                  <div className="flex items-center gap-0.5 ml-auto">
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMove(idx, "up");
                        }}
                        title="Move image left"
                        className="p-1 text-neutral-500 hover:text-neutral-900"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                    )}
                    {idx < images.length - 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMove(idx, "down");
                        }}
                        title="Move image right"
                        className="p-1 text-neutral-500 hover:text-neutral-900"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage(idx);
                  }}
                  title="Remove image"
                  className="p-1 text-neutral-400 hover:text-neutral-900 ml-auto"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
