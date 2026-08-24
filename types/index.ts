import type {
  Category,
  Product,
  ProductImage,
  ProductSpecification,
  Tag,
  ProductTag,
  CustomerRequest,
  RequestImage,
  AdminUser,
  CategoryStatus,
  ProductStatus,
  RequestType,
  RequestStatus,
} from "@prisma/client";

export type {
  Category,
  Product,
  ProductImage,
  ProductSpecification,
  Tag,
  ProductTag,
  CustomerRequest,
  RequestImage,
  AdminUser,
  CategoryStatus,
  ProductStatus,
  RequestType,
  RequestStatus,
};

// Extended types for Categories
export type CategoryWithChildren = Category & {
  children?: Category[];
  parent?: Category | null;
  _count?: {
    products?: number;
    children?: number;
  };
};

// Extended types for Products
export type ProductWithDetails = Product & {
  category: Category & { parent?: Category | null };
  images: ProductImage[];
  specifications: ProductSpecification[];
  tags: (ProductTag & { tag: Tag })[];
};

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  images: {
    imageUrl: string;
    storageKey?: string | null;
    sortOrder: number;
  }[];
  isFeatured: boolean;
  isNew: boolean;
  isTrending: boolean;
  createdAt: Date;
};

// Extended types for Customer Requests
export type CustomerRequestWithDetails = CustomerRequest & {
  product?: (Product & { images: ProductImage[] }) | null;
  images: RequestImage[];
};

// Product Search & Filter Params
export type ProductFilterParams = {
  search?: string;
  categorySlug?: string;
  tag?: string;
  isFeatured?: boolean;
  isNew?: boolean;
  isTrending?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: "newest" | "name" | "trending";
};

// Admin Dashboard Summary Metrics
export type DashboardMetrics = {
  totalProducts: number;
  publishedProducts: number;
  draftProducts: number;
  totalCategories: number;
  newRequestsCount: number;
  pendingRequestsCount: number;
  totalRequestsCount: number;
  recentRequests: CustomerRequestWithDetails[];
};

// Form Input DTOs
export type CreateQuotationRequestInput = {
  productId?: string | null;
  customerName: string;
  companyName?: string | null;
  country: string;
  whatsapp: string;
  email: string;
  quantity: string;
  message: string;
};

export type CreateSourcingRequestInput = {
  productName: string;
  customerName: string;
  companyName?: string | null;
  country: string;
  whatsapp: string;
  email: string;
  quantity: string;
  message: string;
  imageUrls?: (string | { imageUrl: string; storageKey?: string | null })[];
};

export type CreateProductInput = {
  name: string;
  slug: string;
  shortDescription?: string | null;
  description: string;
  categoryId: string;
  status: ProductStatus;
  isFeatured?: boolean;
  isNew?: boolean;
  isTrending?: boolean;
  images: { imageUrl: string; storageKey?: string | null; sortOrder: number }[];
  specifications: { name: string; value: string; sortOrder: number }[];
  tagIds: string[];
};

export type CreateCategoryInput = {
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  storageKey?: string | null;
  parentId?: string | null;
  status?: CategoryStatus;
  sortOrder?: number;
};
