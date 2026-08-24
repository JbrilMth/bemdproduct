"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import { resolveImageUrl } from "@/lib/utils";

interface ImageGalleryProps {
  images: { id?: string; imageUrl: string; sortOrder: number }[];
  productName: string;
}

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="relative flex aspect-[4/3] w-full flex-col items-center justify-center border border-neutral-200 bg-neutral-100 text-neutral-400">
        <Package className="h-16 w-16 stroke-[1.2]" />
        <span className="mt-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          No Images Available
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Featured Primary Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden border border-neutral-200 bg-neutral-50">
        <img
          src={resolveImageUrl(images[selectedIndex]?.imageUrl)}
          alt={`${productName} view ${selectedIndex + 1}`}
          className="h-full w-full object-cover object-center"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`relative h-18 w-18 flex-shrink-0 overflow-hidden border transition ${
                selectedIndex === idx
                  ? "border-neutral-900 ring-1 ring-neutral-900"
                  : "border-neutral-200 opacity-60 hover:opacity-100"
              }`}
            >
              <img
                src={resolveImageUrl(img.imageUrl)}
                alt={`${productName} thumbnail ${idx + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
