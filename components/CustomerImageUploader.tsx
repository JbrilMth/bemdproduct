"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { Upload, X, AlertCircle, Loader2 } from "lucide-react";

export interface CustomerUploadedImage {
  imageUrl: string;
  storageKey?: string | null;
  filename?: string;
}

interface CustomerImageUploaderProps {
  images: CustomerUploadedImage[];
  onChange: (images: CustomerUploadedImage[]) => void;
  maxFiles?: number;
}

export function CustomerImageUploader({
  images,
  onChange,
  maxFiles = 6,
}: CustomerImageUploaderProps) {
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
      const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowed.includes(file.type)) {
        setErrorMessage(`"${file.name}" has an unsupported format. Please upload JPG, PNG, or WebP.`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage(`"${file.name}" is larger than 10MB.`);
        return;
      }
      validFiles.push(file);
    }

    if (images.length + validFiles.length > maxFiles) {
      setErrorMessage(`You can upload a maximum of ${maxFiles} reference images.`);
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("folder", "sourcing");
      validFiles.forEach((file) => formData.append("files", file));

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload reference photos.");
      }

      const newItems: CustomerUploadedImage[] = data.files.map((f: any) => ({
        imageUrl: f.url,
        storageKey: f.storageKey,
        filename: f.filename,
      }));

      onChange([...images, ...newItems]);
    } catch (err: any) {
      console.error("Customer upload error:", err);
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

  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <label className="block font-bold uppercase tracking-wider text-neutral-700">
          Upload Reference Photos (Optional)
        </label>
        <span className="text-[11px] text-neutral-400">
          {images.length} / {maxFiles} images
        </span>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 border border-neutral-300 bg-neutral-50 p-2.5 text-xs text-neutral-800">
          <AlertCircle className="h-4 w-4 text-neutral-900 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={(e: ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)}
        className="hidden"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed p-6 text-center cursor-pointer transition ${
          isDragging
            ? "border-neutral-900 bg-neutral-100"
            : "border-neutral-300 bg-neutral-50 hover:bg-neutral-100 hover:border-neutral-400"
        } ${uploading ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <div className="flex flex-col items-center justify-center gap-1.5">
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-neutral-900" />
              <p className="text-xs font-semibold text-neutral-900">
                Uploading photo from your device...
              </p>
            </>
          ) : (
            <>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-neutral-200 text-neutral-700">
                <Upload className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-neutral-900">
                Click to upload photos from your device or drag & drop
              </p>
              <p className="text-[11px] text-neutral-500">
                Add photos or drawings of the product you are seeking (JPG, PNG up to 10MB)
              </p>
            </>
          )}
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 pt-1">
          {images.map((img, idx) => (
            <div
              key={img.storageKey || img.imageUrl || idx}
              className="relative aspect-square border border-neutral-200 bg-white overflow-hidden group"
            >
              <img
                src={img.imageUrl}
                alt={`Uploaded photo ${idx + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="absolute top-1 right-1 rounded-full bg-black/70 p-1 text-white hover:bg-black transition"
                title="Remove photo"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
