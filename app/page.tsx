import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { getActiveParentCategories } from "@/lib/db/categories";
import {
  getFeaturedProducts,
  getTrendingProducts,
  getNewArrivalProducts,
  getProducts,
} from "@/lib/db/products";
import { ProductCard } from "@/components/ProductCard";
import { CategoryCard } from "@/components/CategoryCard";

export const revalidate = 60;

export default async function HomePage() {
  const [categories, featuredProducts, trendingProducts, newProducts, businessIdeaResult] =
    await Promise.all([
      getActiveParentCategories(),
      getFeaturedProducts(4),
      getTrendingProducts(4),
      getNewArrivalProducts(4),
      getProducts({ tag: "business-idea", pageSize: 4 }),
    ]);

  const businessProducts = businessIdeaResult.products;

  return (
    <div className="space-y-16 pb-20">
      {/* 1. HERO SECTION */}
      <section className="border-b border-neutral-200 bg-neutral-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 block mb-3">
              Direct China Sourcing & Export Operations
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 leading-tight">
              Discover Products <br />From China.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-neutral-600 leading-relaxed max-w-2xl font-normal">
              Discover manufactured products directly from China for e-commerce, retail distribution, wholesale import, and new business opportunities. Request tailored factory quotations or submit custom sourcing projects.
            </p>

            {/* Direct Search Bar */}
            <form
              action="/products"
              method="GET"
              className="mt-8 flex max-w-xl items-center border border-neutral-300 bg-white p-1.5 focus-within:border-neutral-900 focus-within:ring-1 focus-within:ring-neutral-900 transition"
            >
              <Search className="ml-3 h-4 w-4 text-neutral-400 flex-shrink-0" />
              <input
                type="text"
                name="search"
                placeholder="Search products, machinery, electronics, vehicles..."
                className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 border-0 outline-none focus:outline-none focus:ring-0 shadow-none"
              />
              <button
                type="submit"
                className="rounded bg-neutral-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-neutral-800 transition"
              >
                Search
              </button>
            </form>

            {/* Dual CTAs */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/products"
                className="inline-flex items-center gap-1.5 rounded bg-neutral-900 px-6 py-3 text-xs font-bold text-white hover:bg-neutral-800 transition"
              >
                <span>Explore Products</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/sourcing-request"
                className="inline-flex items-center gap-1.5 rounded border border-neutral-300 bg-white px-6 py-3 text-xs font-bold text-neutral-800 hover:bg-neutral-100 transition"
              >
                <span>Request a Product</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORIES OVERVIEW */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-3 border-b border-neutral-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Directory
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mt-0.5">
              Product Categories
            </h2>
          </div>
          <Link
            href="/categories"
            className="text-xs font-semibold text-neutral-900 hover:text-neutral-600 flex items-center gap-1 transition"
          >
            All Categories <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        ) : (
          <div className="border border-neutral-200 bg-white p-8 text-center">
            <p className="text-xs text-neutral-500">
              No categories available yet. Products and industry categories will appear here once published.
            </p>
          </div>
        )}
      </section>

      {/* 3. FEATURED PRODUCTS */}
      {featuredProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-3 border-b border-neutral-200">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Curated
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mt-0.5">
                Featured Products
              </h2>
            </div>
            <Link
              href="/products?isFeatured=true"
              className="text-xs font-semibold text-neutral-900 hover:text-neutral-600 flex items-center gap-1 transition"
            >
              View All Featured <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 4. SOURCING CTA BANNER */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="border border-neutral-200 bg-neutral-900 p-8 sm:p-12 text-white">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-400 block mb-2">
              Custom Sourcing Service
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Can&apos;t Find What You&apos;re Looking For?
            </h2>
            <p className="mt-3 text-neutral-300 text-xs sm:text-sm leading-relaxed">
              Send us the product you&apos;re looking for. Our China-based sourcing team will research suitable options, verify manufacturing capacity, and contact you with the available details and export quotation.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/sourcing-request"
                className="inline-flex items-center gap-2 rounded bg-white px-5 py-2.5 text-xs font-bold text-neutral-900 hover:bg-neutral-100 transition"
              >
                <span>Request a Product</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 rounded border border-neutral-700 px-5 py-2.5 text-xs font-semibold text-neutral-300 hover:text-white hover:border-neutral-500 transition"
              >
                <span>How We Source</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TRENDING PRODUCTS */}
      {trendingProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-3 border-b border-neutral-200">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Demand
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mt-0.5">
                Trending Sourcing Items
              </h2>
            </div>
            <Link
              href="/products?isTrending=true"
              className="text-xs font-semibold text-neutral-900 hover:text-neutral-600 flex items-center gap-1 transition"
            >
              View All Trending <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 6. NEW ARRIVALS */}
      {newProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-3 border-b border-neutral-200">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Catalog Updates
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mt-0.5">
                New Arrivals
              </h2>
            </div>
            <Link
              href="/products?isNew=true"
              className="text-xs font-semibold text-neutral-900 hover:text-neutral-600 flex items-center gap-1 transition"
            >
              View All New <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 7. BUSINESS OPPORTUNITIES */}
      {businessProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-3 border-b border-neutral-200">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Opportunities
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mt-0.5">
                Business Ideas & Commercial Equipment
              </h2>
            </div>
            <Link
              href="/products?tag=business-idea"
              className="text-xs font-semibold text-neutral-900 hover:text-neutral-600 flex items-center gap-1 transition"
            >
              View All Business Ideas <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {businessProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 8. SOURCING CAPABILITIES (SOBER B2B WORKFLOW) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
        <div className="border border-neutral-200 bg-neutral-50 p-8 sm:p-10">
          <div className="max-w-xl mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block">
              Trading Company Operations
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mt-1">
              How We Support Overseas Importers
            </h2>
            <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
              We operate directly on the ground in China to bridge language, quality, and logistics requirements between international buyers and Chinese manufacturing clusters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="border border-neutral-200 bg-white p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">01</div>
              <h4 className="text-sm font-bold text-neutral-900">Direct Sourcing</h4>
              <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                Identifying verified factories and equipment manufacturers directly across Zhejiang, Guangdong, Jiangsu, and Shandong.
              </p>
            </div>

            <div className="border border-neutral-200 bg-white p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">02</div>
              <h4 className="text-sm font-bold text-neutral-900">Quotation & OEM</h4>
              <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                Negotiating volume pricing, organizing sample evaluation, and coordinating custom branding, specifications, and packaging.
              </p>
            </div>

            <div className="border border-neutral-200 bg-white p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">03</div>
              <h4 className="text-sm font-bold text-neutral-900">Quality Inspection</h4>
              <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                Conducting pre-shipment inspections following international standards with detailed photo and video documentation.
              </p>
            </div>

            <div className="border border-neutral-200 bg-white p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">04</div>
              <h4 className="text-sm font-bold text-neutral-900">Export Logistics</h4>
              <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                Managing customs clearance, container loading, and international sea/air freight shipping to destination ports.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
