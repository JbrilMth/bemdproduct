import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";
import { ProductWithDetails } from "@/types";
import { resolveImageUrl } from "@/lib/utils";

interface ProductCardProps {
  product: ProductWithDetails;
}

export function ProductCard({ product }: ProductCardProps) {
  const rawImage = product.images && product.images.length > 0 ? product.images[0].imageUrl : null;
  const primaryImage = resolveImageUrl(rawImage);

  return (
    <div className="group flex flex-col border border-neutral-200 bg-white transition hover:border-neutral-400">
      {/* Product Image */}
      <Link
        href={`/products/${product.slug}`}
        className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100 block"
      >
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.name}
            className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-103"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-neutral-100 text-neutral-400">
            <Package className="h-10 w-10 stroke-[1.2]" />
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">No Image</span>
          </div>
        )}

        {/* Minimal Category & Discovery Flags */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
          {product.isNew && (
            <span className="bg-neutral-900 text-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
              New
            </span>
          )}
          {product.isFeatured && (
            <span className="bg-neutral-900 text-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
              Featured
            </span>
          )}
          {product.isTrending && !product.isFeatured && (
            <span className="bg-neutral-900 text-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
              Trending
            </span>
          )}
        </div>
      </Link>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Category Link */}
        <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">
          {product.category?.name}
        </div>

        {/* Product Title */}
        <Link href={`/products/${product.slug}`} className="block group-hover:text-neutral-600 transition-colors">
          <h3 className="text-sm font-bold text-neutral-900 line-clamp-2 leading-snug">
            {product.name}
          </h3>
        </Link>

        {/* Short description */}
        <p className="mt-1.5 text-xs text-neutral-500 line-clamp-2 leading-relaxed">
          {product.shortDescription || product.description}
        </p>

        {/* Key Specs Preview (Clean Row) */}
        {product.specifications && product.specifications.length > 0 && (
          <div className="mt-3 pt-3 border-t border-neutral-100 grid grid-cols-2 gap-2 text-[11px]">
            {product.specifications.slice(0, 2).map((spec) => (
              <div key={spec.id} className="truncate">
                <span className="text-neutral-400 block text-[10px] uppercase font-medium">{spec.name}</span>
                <span className="font-semibold text-neutral-800 truncate block">{spec.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action Button Row */}
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-neutral-100">
          <Link
            href={`/products/${product.slug}`}
            className="text-xs font-semibold text-neutral-900 hover:text-neutral-600 inline-flex items-center gap-1 transition"
          >
            View Details <ArrowRight className="h-3 w-3" />
          </Link>
          <Link
            href={`/quote?productId=${product.id}`}
            className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded transition"
          >
            Request Quote
          </Link>
        </div>
      </div>
    </div>
  );
}
