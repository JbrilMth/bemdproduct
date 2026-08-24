import Link from "next/link";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { getProducts } from "@/lib/db/products";
import { getActiveParentCategories } from "@/lib/db/categories";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/ProductCard";

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string;
    categorySlug?: string;
    tag?: string;
    isFeatured?: string;
    isTrending?: string;
    isNew?: string;
    page?: string;
  }>;
}

export const revalidate = 60;

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const currentPage = params.page ? parseInt(params.page, 10) : 1;
  const currentCategorySlug = params.categorySlug;
  const currentTag = params.tag;
  const searchQuery = params.search;
  const isFeatured = params.isFeatured === "true";
  const isTrending = params.isTrending === "true";
  const isNew = params.isNew === "true";

  const [categories, productResult, dbTags] = await Promise.all([
    getActiveParentCategories(),
    getProducts({
      search: searchQuery,
      categorySlug: currentCategorySlug,
      tag: currentTag,
      isFeatured: isFeatured ? true : undefined,
      isTrending: isTrending ? true : undefined,
      isNew: isNew ? true : undefined,
      page: currentPage,
      pageSize: 12,
    }),
    prisma.tag.findMany({
      orderBy: { name: "asc" },
      where: {
        products: {
          some: {
            product: {
              status: "PUBLISHED",
            },
          },
        },
      },
    }),
  ]);

  const { products, total, totalPages } = productResult;

  // Build filter tabs: core flags + dynamic tags from DB
  const filterTabs = [
    { label: "All Items", key: "all", href: "/products" },
    { label: "Featured", key: "featured", href: "/products?isFeatured=true" },
    { label: "Trending", key: "trending", href: "/products?isTrending=true" },
    { label: "New", key: "new", href: "/products?isNew=true" },
    ...dbTags.map((t) => ({
      label: t.name,
      key: `tag-${t.slug}`,
      href: `/products?tag=${t.slug}`,
    })),
  ];

  const hasActiveFilters = Boolean(
    searchQuery ||
      currentCategorySlug ||
      currentTag ||
      isFeatured ||
      isTrending ||
      isNew
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Catalog Library
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mt-1">
            China Product Catalog
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Browse manufactured products, review specifications, and request direct export quotations.
          </p>
        </div>

        {/* Search */}
        <form method="GET" action="/products" className="relative max-w-sm w-full">
          {currentCategorySlug && <input type="hidden" name="categorySlug" value={currentCategorySlug} />}
          {currentTag && <input type="hidden" name="tag" value={currentTag} />}
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
          <input
            type="text"
            name="search"
            defaultValue={searchQuery || ""}
            placeholder="Search keywords or specs..."
            className="w-full rounded border border-neutral-300 bg-white py-2 pl-9 pr-16 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none"
          />
          <button
            type="submit"
            className="absolute right-1 top-1 rounded bg-neutral-900 px-3 py-1 text-xs font-semibold text-white hover:bg-neutral-800"
          >
            Search
          </button>
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filterTabs.map((t) => {
          let isActive = false;
          if (t.key === "all" && !hasActiveFilters) isActive = true;
          if (t.key === "featured" && isFeatured) isActive = true;
          if (t.key === "trending" && isTrending) isActive = true;
          if (t.key === "new" && isNew) isActive = true;
          if (t.key.startsWith("tag-") && currentTag === t.key.replace("tag-", "")) isActive = true;

          return (
            <Link
              key={t.key}
              href={t.href}
              className={`flex-shrink-0 rounded px-3 py-1 text-xs font-semibold uppercase tracking-wider transition ${
                isActive
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar: Categories Navigation */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="border border-neutral-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                Categories
              </span>
              {currentCategorySlug && (
                <Link
                  href="/products"
                  className="text-[11px] text-neutral-500 hover:text-neutral-900 flex items-center gap-0.5"
                >
                  Clear <X className="h-3 w-3" />
                </Link>
              )}
            </div>

            <ul className="space-y-1 text-xs">
              <li>
                <Link
                  href="/products"
                  className={`block px-2.5 py-1.5 rounded font-medium transition ${
                    !currentCategorySlug
                      ? "bg-neutral-900 text-white font-semibold"
                      : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  All Categories ({total})
                </Link>
              </li>

              {categories.map((cat) => {
                const isParentActive = currentCategorySlug === cat.slug;
                return (
                  <li key={cat.id} className="space-y-0.5">
                    <Link
                      href={`/products?categorySlug=${cat.slug}`}
                      className={`block px-2.5 py-1.5 rounded font-medium transition ${
                        isParentActive
                          ? "bg-neutral-900 text-white font-semibold"
                          : "text-neutral-800 hover:bg-neutral-100"
                      }`}
                    >
                      {cat.name}
                    </Link>

                    {/* Subcategories */}
                    {cat.children && cat.children.length > 0 && (
                      <ul className="pl-3 space-y-0.5 border-l border-neutral-200 ml-2.5 my-0.5">
                        {cat.children.map((sub) => {
                          const isSubActive = currentCategorySlug === sub.slug;
                          return (
                            <li key={sub.id}>
                              <Link
                                href={`/products?categorySlug=${sub.slug}`}
                                className={`block px-2 py-1 text-[11px] rounded transition ${
                                  isSubActive
                                    ? "text-neutral-900 font-bold bg-neutral-200/70"
                                    : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                                }`}
                              >
                                {sub.name}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Sourcing Request Sidebar Box */}
          <div className="border border-neutral-200 bg-neutral-50 p-4 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Custom Sourcing
            </h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              If the specific model or product you need is not listed, our team will research and source it for you.
            </p>
            <Link
              href="/sourcing-request"
              className="block text-center rounded bg-neutral-900 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition"
            >
              Request a Product
            </Link>
          </div>
        </aside>

        {/* Right Main Grid: Products */}
        <main className="lg:col-span-3 space-y-6">
          {products.length === 0 ? (
            <div className="border border-neutral-200 bg-neutral-50 p-12 text-center space-y-3">
              <h3 className="text-sm font-bold text-neutral-900">
                {hasActiveFilters ? "No products found" : "No products available yet"}
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                {hasActiveFilters
                  ? "No catalog items match your search or filter criteria. You can clear filters or submit a custom sourcing request."
                  : "Products created in the administration panel will appear here. In the meantime, you can submit a custom sourcing request."}
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                {hasActiveFilters && (
                  <Link
                    href="/products"
                    className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                  >
                    Clear Filters
                  </Link>
                )}
                <Link
                  href="/sourcing-request"
                  className="rounded bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800"
                >
                  Request a Product
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-neutral-500 px-0.5">
                <span>Showing {products.length} of {total} products</span>
                {currentCategorySlug && (
                  <span className="font-medium text-neutral-900">
                    Category: {currentCategorySlug}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-8">
                  {currentPage > 1 && (
                    <Link
                      href={`/products?page=${currentPage - 1}${
                        currentCategorySlug ? `&categorySlug=${currentCategorySlug}` : ""
                      }${currentTag ? `&tag=${currentTag}` : ""}${
                        searchQuery ? `&search=${searchQuery}` : ""
                      }`}
                      className="inline-flex items-center gap-1 rounded border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" /> Previous
                    </Link>
                  )}

                  <span className="text-xs font-medium text-neutral-600 px-3">
                    Page {currentPage} of {totalPages}
                  </span>

                  {currentPage < totalPages && (
                    <Link
                      href={`/products?page=${currentPage + 1}${
                        currentCategorySlug ? `&categorySlug=${currentCategorySlug}` : ""
                      }${currentTag ? `&tag=${currentTag}` : ""}${
                        searchQuery ? `&search=${searchQuery}` : ""
                      }`}
                      className="inline-flex items-center gap-1 rounded border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      Next <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              )}
            </>
          )}

          {/* Sourcing Banner at bottom of listing */}
          <div className="border border-neutral-200 bg-neutral-900 p-6 text-white mt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="max-w-xl">
              <h3 className="text-sm font-bold text-white">Can&apos;t find what you are looking for?</h3>
              <p className="text-xs text-neutral-300 mt-1">
                Our China-based sourcing team can identify manufacturers and provide formal export quotations for custom products.
              </p>
            </div>
            <Link
              href="/sourcing-request"
              className="flex-shrink-0 rounded bg-white px-4 py-2 text-xs font-bold text-neutral-900 hover:bg-neutral-100 transition"
            >
              Request a Product
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
