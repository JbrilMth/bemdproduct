import { prisma } from "@/lib/prisma";
import { QuotationForm } from "@/components/QuotationForm";
import { ProductWithDetails } from "@/types";

interface QuotePageProps {
  searchParams: Promise<{
    productId?: string;
  }>;
}

export const revalidate = 0;

export default async function RequestQuotePage({ searchParams }: QuotePageProps) {
  const { productId } = await searchParams;

  const [product, availableProducts] = await Promise.all([
    productId
      ? (prisma.product.findUnique({
          where: { id: productId },
          include: {
            category: {
              include: { parent: true },
            },
            images: { orderBy: { sortOrder: "asc" } },
            specifications: true,
            tags: { include: { tag: true } },
          },
        }) as Promise<ProductWithDetails | null>)
      : Promise.resolve(null),
    prisma.product.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        name: true,
        slug: true,
        category: {
          select: { name: true },
        },
        images: {
          take: 1,
          orderBy: { sortOrder: "asc" },
          select: { imageUrl: true },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-200 pb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">
          Direct Export Quotation
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
          Request Product Quotation
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 mt-1 leading-relaxed">
          Provide your target quantity, customization requirements, and destination port. Our China sourcing desk will prepare a formal export quotation including shipping terms and OEM options.
        </p>
      </div>

      {/* Form Container */}
      <div className="border border-neutral-200 bg-white p-6 sm:p-8">
        <QuotationForm initialProduct={product} availableProducts={availableProducts} />
      </div>
    </div>
  );
}
