import { z } from "zod";

/**
 * Validates that a URL is safe for rendering and navigation.
 * Strictly forbids javascript:, data:, vbscript: and illegal control characters.
 */
export const safeUrlSchema = z
  .string()
  .trim()
  .max(1000, "URL exceeds maximum permitted length")
  .refine(
    (val) => {
      if (!val) return true;
      const lower = val.toLowerCase();
      // Block pseudo-protocols and script execution vectors
      if (
        lower.startsWith("javascript:") ||
        lower.startsWith("vbscript:") ||
        lower.startsWith("data:") ||
        lower.includes("<script") ||
        lower.includes("onload=") ||
        lower.includes("onerror=")
      ) {
        return false;
      }
      // Must be a relative path or standard HTTP/HTTPS URL
      return lower.startsWith("/") || lower.startsWith("http://") || lower.startsWith("https://");
    },
    { message: "Invalid URL: Must be a valid relative path or HTTP/HTTPS web address." }
  );

// Safe Slug Schema
export const safeSlugSchema = z
  .string()
  .trim()
  .min(2, "Slug must be at least 2 characters")
  .max(220, "Slug cannot exceed 220 characters")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug may only contain lowercase letters, numbers, and single hyphens"
  );

// Customer Quotation Request Schema
export const quotationRequestSchema = z.object({
  productId: z.string().max(100).optional().nullable().or(z.literal("")),
  customerName: z.string().trim().min(1, "Full name is required").max(100),
  companyName: z.string().max(150).optional().nullable().or(z.literal("")),
  country: z.string().trim().min(1, "Destination country or port is required").max(100),
  whatsapp: z
    .string()
    .trim()
    .min(3, "Valid phone or WhatsApp number is required")
    .max(50)
    .regex(/^[0-9+()\-.\s]+$/, "Please enter a valid phone or WhatsApp number format"),
  email: z.string().trim().email("Valid email address is required").max(150),
  quantity: z.string().trim().min(1, "Please specify estimated quantity required").max(100),
  message: z.string().trim().min(1, "Please describe your specifications or requirements").max(4000),
});

// Customer Sourcing Request Schema
export const sourcingRequestSchema = z.object({
  productName: z.string().trim().min(1, "Product name is required").max(200),
  customerName: z.string().trim().min(1, "Full name is required").max(100),
  companyName: z.string().max(150).optional().nullable().or(z.literal("")),
  country: z.string().trim().min(1, "Destination country or port is required").max(100),
  whatsapp: z
    .string()
    .trim()
    .min(3, "Valid phone or WhatsApp number is required")
    .max(50)
    .regex(/^[0-9+()\-.\s]+$/, "Please enter a valid phone or WhatsApp number format"),
  email: z.string().trim().email("Valid email address is required").max(150),
  quantity: z.string().trim().min(1, "Please specify estimated quantity or annual volume").max(100),
  message: z.string().trim().min(1, "Please provide product details or target specifications").max(4000),
  imageUrls: z
    .array(
      z.union([
        safeUrlSchema,
        z.object({
          imageUrl: safeUrlSchema,
          storageKey: z.string().max(250).optional().nullable(),
        }),
      ])
    )
    .max(10, "A maximum of 10 reference images are allowed per inquiry")
    .optional(),
});

// Category Form Schema
export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, "Category name is required").max(100),
  slug: safeSlugSchema,
  description: z.string().max(1000).optional().nullable().or(z.literal("")),
  imageUrl: safeUrlSchema.optional().nullable().or(z.literal("")),
  storageKey: z.string().max(250).optional().nullable(),
  parentId: z.string().max(100).optional().nullable().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  sortOrder: z.coerce.number().int().min(0).max(100000).default(0),
});

// Product Form Schema
export const productFormSchema = z.object({
  name: z.string().trim().min(2, "Product title is required").max(200),
  slug: safeSlugSchema,
  shortDescription: z.string().max(300).optional().nullable().or(z.literal("")),
  description: z.string().trim().min(5, "Detailed product description is required").max(30000),
  categoryId: z.string().min(1, "Category is required").max(100),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  images: z
    .array(
      z.object({
        imageUrl: safeUrlSchema,
        storageKey: z.string().max(250).optional().nullable(),
        sortOrder: z.coerce.number().int().min(0).max(100000).default(0),
      })
    )
    .min(1, "At least one product image is required")
    .max(25, "Maximum 25 images per product"),
  specifications: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Specification name required").max(100),
        value: z.string().trim().min(1, "Specification value required").max(500),
        sortOrder: z.coerce.number().int().min(0).max(100000).default(0),
      })
    )
    .max(50, "Maximum 50 specifications per product")
    .default([]),
  tagIds: z.array(z.string().max(100)).max(30, "Maximum 30 tags per product").default([]),
});

// Admin Login Schema
export const adminLoginSchema = z.object({
  email: z.string().trim().email("Invalid email format").max(150),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password exceeds maximum permitted length"),
});

// Request Status Update Schema
export const updateRequestStatusSchema = z.object({
  status: z.enum(["NEW", "REVIEWING", "PROCESSING", "COMPLETED", "CANCELLED"]),
});

// Request Internal Notes Schema
export const updateRequestInternalNotesSchema = z.object({
  requestId: z.string().min(1, "Request ID is required").max(100),
  internalNotes: z.string().max(10000, "Internal notes cannot exceed 10,000 characters"),
});
