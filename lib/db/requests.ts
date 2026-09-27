import { prisma } from "@/lib/prisma";
import { RequestType, RequestStatus } from "@prisma/client";
import {
  CreateQuotationRequestInput,
  CreateSourcingRequestInput,
  CustomerRequestWithDetails,
} from "@/types";

export async function createQuotationRequest(data: CreateQuotationRequestInput) {
  return prisma.customerRequest.create({
    data: {
      type: RequestType.QUOTATION_REQUEST,
      productId: data.productId || null,
      customerName: data.customerName,
      companyName: data.companyName || null,
      country: data.country,
      whatsapp: data.whatsapp,
      email: data.email,
      quantity: data.quantity,
      message: data.message,
      status: RequestStatus.NEW,
    },
    include: {
      product: {
        include: {
          images: {
            take: 1,
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });
}

export async function createSourcingRequest(data: CreateSourcingRequestInput) {
  return prisma.customerRequest.create({
    data: {
      type: RequestType.SOURCING_REQUEST,
      productName: data.productName,
      customerName: data.customerName,
      companyName: data.companyName || null,
      country: data.country,
      whatsapp: data.whatsapp,
      email: data.email,
      quantity: data.quantity,
      message: data.message,
      status: RequestStatus.NEW,
      images: data.imageUrls && data.imageUrls.length > 0
        ? {
            create: data.imageUrls.map((img) => {
              if (typeof img === "string") {
                return { imageUrl: img };
              }
              return {
                imageUrl: (img as any).imageUrl || (img as any).url,
                storageKey: (img as any).storageKey || null,
              };
            }),
          }
        : undefined,
    },
    include: {
      images: true,
    },
  });
}

export async function getAllRequests(filters?: {
  type?: RequestType;
  status?: RequestStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  requests: CustomerRequestWithDetails[];
  total: number;
  totalPages: number;
}> {
  const { type, status, search, page = 1, pageSize = 20 } = filters || {};

  const safePage = Math.max(1, Math.min(Number(page) || 1, 1000));
  const safePageSize = Math.max(1, Math.min(Number(pageSize) || 20, 100));
  const safeSearch = search ? search.trim().slice(0, 100) : "";

  const where: any = {};
  if (type) where.type = type;
  if (status) where.status = status;
  if (safeSearch !== "") {
    where.OR = [
      { customerName: { contains: safeSearch, mode: "insensitive" } },
      { companyName: { contains: safeSearch, mode: "insensitive" } },
      { email: { contains: safeSearch, mode: "insensitive" } },
      { productName: { contains: safeSearch, mode: "insensitive" } },
      { message: { contains: safeSearch, mode: "insensitive" } },
    ];
  }

  const [requests, total] = await Promise.all([
    prisma.customerRequest.findMany({
      where,
      include: {
        product: {
          include: {
            images: {
              take: 1,
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        images: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    }),
    prisma.customerRequest.count({ where }),
  ]);

  return {
    requests: requests as CustomerRequestWithDetails[],
    total,
    totalPages: Math.ceil(total / safePageSize),
  };
}

export async function getRequestById(id: string): Promise<CustomerRequestWithDetails | null> {
  const request = await prisma.customerRequest.findUnique({
    where: { id },
    include: {
      product: {
        include: {
          images: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
      images: true,
    },
  });

  return request as CustomerRequestWithDetails | null;
}

export async function updateRequestStatus(id: string, status: RequestStatus) {
  return prisma.customerRequest.update({
    where: { id },
    data: { status },
    include: {
      product: true,
      images: true,
    },
  });
}

export async function updateRequestInternalNotes(id: string, internalNotes: string) {
  return prisma.customerRequest.update({
    where: { id },
    data: { internalNotes },
  });
}
