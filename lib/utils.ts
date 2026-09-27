import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { RequestStatus, ProductStatus, CategoryStatus } from "@prisma/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/&/g, "-and-") // Replace & with 'and'
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function getRequestStatusBadgeClass(status: RequestStatus | string): string {
  switch (status) {
    case "NEW":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "REVIEWING":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "PROCESSING":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "CANCELLED":
      return "bg-zinc-100 text-zinc-600 border-zinc-200";
    default:
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
  }
}

export function getProductStatusBadgeClass(status: ProductStatus | string): string {
  switch (status) {
    case "PUBLISHED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "DRAFT":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "ARCHIVED":
      return "bg-zinc-100 text-zinc-600 border-zinc-200";
    default:
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
  }
}

export function getCategoryStatusBadgeClass(status: CategoryStatus | string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "INACTIVE":
      return "bg-zinc-100 text-zinc-600 border-zinc-200";
    default:
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
  }
}

/**
 * Resolves a stored image URL or storage key to an accessible, sanitized URL.
 * Routes R2 storage keys to /api/media/... unless a full CDN URL is provided.
 * Strictly blocks malicious pseudo-protocols like javascript: or vbscript:.
 */
export function resolveImageUrl(url?: string | null): string {
  if (!url || typeof url !== "string") return "";

  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();

  // Defend against XSS vectors in image sources
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("data:text/html") ||
    lower.startsWith("data:application") ||
    lower.includes("<script")
  ) {
    return "";
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:image/")) {
    return trimmed;
  }

  if (trimmed.startsWith("/api/media/") || trimmed.startsWith("/uploads/") || trimmed.startsWith("/images/")) {
    return trimmed;
  }

  const cleanKey = trimmed.replace(/^\/+/, "");
  if (
    cleanKey.startsWith("categories/") ||
    cleanKey.startsWith("products/") ||
    cleanKey.startsWith("requests/") ||
    cleanKey.startsWith("general/")
  ) {
    return `/api/media/${cleanKey}`;
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

