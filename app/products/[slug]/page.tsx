import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ArrowRight, Check } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/lib/db/products";
import { ImageGallery } from "@/components/ImageGallery";
import { SpecificationTable } from "@/components/SpecificationTable";
import { ProductCard } from "@/components/ProductCard";

interface ProductDetailsPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 60;

export default async function ProductDetailsPage({ params }: ProductDetailsPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product.id, product.categoryId, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-neutral-500 overflow-x-auto">
        <Link href="/" className="hover:text-neutral-900 transition">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 text-neutral-400 flex-shrink-0" />
        <Link href="/categories" className="hover:text-neutral-900 transition">
          Categories
        </Link>
        <ChevronRight className="h-3 w-3 text-neutral-400 flex-shrink-0" />
        {product.category?.parent && (
          <>
            <Link
              href={`/products?categorySlug=${product.category.parent.slug}`}
              className="hover:text-neutral-900 transition"
            >
              {product.category.parent.name}
            </Link>
            <ChevronRight className="h-3 w-3 text-neutral-400 flex-shrink-0" />
          </>
        )}
        <Link
          href={`/products?categorySlug=${product.category.slug}`}
          className="hover:text-neutral-900 transition"
        >
          {product.category.name}
        </Link>
        <ChevronRight className="h-3 w-3 text-neutral-400 flex-shrink-0" />
        <span className="text-neutral-900 font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Hero / Overview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-7">
          <ImageGallery images={product.images} productName={product.name} />
        </div>

        {/* Right Column: Title, Quick Specs & Quotation CTA Box */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-4">
            {/* Category & Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/products?categorySlug=${product.category.slug}`}
                className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 hover:text-neutral-900"
              >
                {product.category.name}
              </Link>
              {product.isFeatured && (
                <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-800 uppercase tracking-wider">
                  Featured Sourcing
                </span>
              )}
              {product.isTrending && (
                <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-800 uppercase tracking-wider">
                  Trending Demand
                </span>
              )}
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight leading-snug">
              {product.name}
            </h1>

            {/* Short Description */}
            {product.shortDescription && (
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                {product.shortDescription}
              </p>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {product.tags.map((pt) => (
                  <span
                    key={pt.id}
                    className="rounded bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600"
                  >
                    #{pt.tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quotation Request CTA Box */}
          <div className="border border-neutral-200 bg-neutral-50 p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Request Export Quotation
              </h3>
              <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                Receive direct export pricing terms, OEM customization options, packaging details, and shipping estimates from our China team.
              </p>
            </div>

            <ul className="space-y-1.5 pt-2 border-t border-neutral-200 text-xs text-neutral-700">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-neutral-900 flex-shrink-0" />
                <span>Custom logo, private labeling & packaging available</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-neutral-900 flex-shrink-0" />
                <span>Pre-shipment quality inspection included</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-neutral-900 flex-shrink-0" />
                <span>FOB, CIF, and door-to-door DDP shipping handled</span>
              </li>
            </ul>

            <div className="pt-2">
              <Link
                href={`/quote?productId=${product.id}`}
                className="w-full flex items-center justify-center gap-2 rounded bg-neutral-900 py-3 text-xs font-bold text-white hover:bg-neutral-800 transition"
              >
                <span>Request Quotation</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Product Overview & Full Specifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-6 border-t border-neutral-200">
        {/* Left Column: Full Detailed Description */}
        <div className="lg:col-span-7 space-y-6">
          <div className="border border-neutral-200 bg-white p-6 space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-2">
              Product Overview & Manufacturing Scope
            </h2>
            <div className="text-xs sm:text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
              {product.description}
            </div>
          </div>
        </div>

        {/* Right Column: Specifications Table */}
        <div className="lg:col-span-5 space-y-6">
          <SpecificationTable specifications={product.specifications} />
        </div>
      </div>

      {/* Sourcing CTA Banner */}
      <div className="border border-neutral-200 bg-neutral-900 p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="max-w-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">
            Custom Manufacturing & Sourcing
          </span>
          <h3 className="text-lg font-bold text-white">
            Looking for custom modifications or alternative models?
          </h3>
          <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
            If you need specific custom specifications, alternative tooling, or bespoke private labeling, submit your requirements to our China team.
          </p>
        </div>
        <Link
          href={`/quote?productId=${product.id}`}
          className="flex-shrink-0 rounded bg-white px-5 py-2.5 text-xs font-bold text-neutral-900 hover:bg-neutral-100 transition"
        >
          Request Product Quotation
        </Link>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="pt-8 border-t border-neutral-200 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Discovery
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900 mt-0.5">
                Related Products in {product.category.name}
              </h2>
            </div>
            <Link
              href={`/products?categorySlug=${product.category.slug}`}
              className="text-xs font-semibold text-neutral-900 hover:text-neutral-600 flex items-center gap-1 transition"
            >
              All in category <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
