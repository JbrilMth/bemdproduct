import { z } from "zod";

// Customer Quotation Request Schema
export const quotationRequestSchema = z.object({
  productId: z.string().optional().nullable().or(z.literal("")),
  customerName: z.string().trim().min(1, "Full name is required").max(100),
  companyName: z.string().max(150).optional().nullable().or(z.literal("")),
  country: z.string().trim().min(1, "Destination country or port is required").max(100),
  whatsapp: z
    .string()
    .trim()
    .min(3, "Valid phone or WhatsApp number is required")
    .max(50),
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
    .max(50),
  email: z.string().trim().email("Valid email address is required").max(150),
  quantity: z.string().trim().min(1, "Please specify estimated quantity or annual volume").max(100),
  message: z.string().trim().min(1, "Please provide product details or target specifications").max(4000),
  imageUrls: z
    .array(
      z.union([
        z.string(),
        z.object({
          imageUrl: z.string(),
          storageKey: z.string().optional().nullable(),
        }),
      ])
    )
    .optional(),
});

// Category Form Schema
export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, "Category name is required").max(100),
  slug: z.string().trim().min(2, "Slug is required").max(120),
  description: z.string().max(1000).optional().nullable().or(z.literal("")),
  imageUrl: z.string().optional().nullable().or(z.literal("")),
  storageKey: z.string().optional().nullable(),
  parentId: z.string().optional().nullable().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

// Product Form Schema
export const productFormSchema = z.object({
  name: z.string().trim().min(2, "Product title is required").max(200),
  slug: z.string().trim().min(2, "Slug is required").max(220),
  shortDescription: z.string().max(300).optional().nullable().or(z.literal("")),
  description: z.string().trim().min(5, "Detailed product description is required"),
  categoryId: z.string().min(1, "Category is required"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  images: z
    .array(
      z.object({
        imageUrl: z.string().min(1, "Valid image path or URL required"),
        storageKey: z.string().optional().nullable(),
        sortOrder: z.number().int().default(0),
      })
    )
    .min(1, "At least one product image is required"),
  specifications: z
    .array(
      z.object({
        name: z.string().min(1, "Specification name required"),
        value: z.string().min(1, "Specification value required"),
        sortOrder: z.number().int().default(0),
      })
    )
    .default([]),
  tagIds: z.array(z.string()).default([]),
});

// Admin Login Schema
export const adminLoginSchema = z.object({
  email: z.string().trim().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Request Status Update Schema
export const updateRequestStatusSchema = z.object({
  status: z.enum(["NEW", "REVIEWING", "PROCESSING", "COMPLETED", "CANCELLED"]),
});
