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
 * Resolves a stored image URL or storage key to an accessible URL.
 * Routes R2 storage keys to /api/media/... unless a full CDN URL is provided.
 */
export function resolveImageUrl(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  if (url.startsWith("/api/media/") || url.startsWith("/uploads/") || url.startsWith("/images/")) {
    return url;
  }

  const cleanKey = url.replace(/^\/+/, "");
  if (
    cleanKey.startsWith("categories/") ||
    cleanKey.startsWith("products/") ||
    cleanKey.startsWith("requests/") ||
    cleanKey.startsWith("general/")
  ) {
    return `/api/media/${cleanKey}`;
  }

  return url.startsWith("/") ? url : `/${url}`;
}

