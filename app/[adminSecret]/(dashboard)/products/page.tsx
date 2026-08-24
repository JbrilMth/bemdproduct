import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Plus, Search, Package } from "lucide-react";
import { ProductListRow } from "@/components/admin/ProductListRow";
import { ProductStatus } from "@prisma/client";

interface AdminProductsPageProps {
  params: Promise<{
    adminSecret: string;
  }>;
  searchParams: Promise<{
    search?: string;
    status?: string;
    categoryId?: string;
  }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminProductsPage({ params, searchParams }: AdminProductsPageProps) {
  const { adminSecret } = await params;
  const basePath = `/${adminSecret}`;
  const { search, status, categoryId } = await searchParams;

  const where: any = {};
  if (status && status !== "ALL") {
    where.status = status as ProductStatus;
  }
  if (categoryId) {
    where.categoryId = categoryId;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
      { shortDescription: { contains: search, mode: "insensitive" } },
    ];
  }

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        specifications: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.category.findMany({
      where: { parentId: null },
      include: { children: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">
            Catalog Inventory
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">
            Products Management
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage showcase products, image galleries, technical specifications, and publication status.
          </p>
        </div>

        <Link
          href={`${basePath}/products/new`}
          className="inline-flex items-center gap-1.5 rounded bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition"
        >
          <Plus className="h-3.5 w-3.5" /> Add Product
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 border border-neutral-200 bg-white p-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto">
          {[
            { label: "All Products", value: "ALL" },
            { label: "Published", value: "PUBLISHED" },
            { label: "Drafts", value: "DRAFT" },
            { label: "Archived", value: "ARCHIVED" },
          ].map((tab) => {
            const isActive = (status || "ALL") === tab.value;
            return (
              <Link
                key={tab.value}
                href={`${basePath}/products?status=${tab.value}${search ? `&search=${search}` : ""}${
                  categoryId ? `&categoryId=${categoryId}` : ""
                }`}
                className={`rounded px-2.5 py-1 text-xs font-semibold transition whitespace-nowrap uppercase tracking-wider ${
                  isActive
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Search & Category Filter */}
        <form method="GET" action={`${basePath}/products`} className="flex items-center gap-2 w-full md:w-auto">
          {status && <input type="hidden" name="status" value={status} />}
          
          <select
            name="categoryId"
            defaultValue={categoryId || ""}
            className="rounded border border-neutral-300 bg-white px-2 py-1.5 text-xs text-neutral-800 focus:border-neutral-900 focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-400" />
            <input
              type="text"
              name="search"
              defaultValue={search || ""}
              placeholder="Search title/slug..."
              className="w-full rounded border border-neutral-300 py-1.5 pl-8 pr-3 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="rounded bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Products Table */}
      <div className="border border-neutral-200 bg-white overflow-hidden">
        {products.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="h-8 w-8 text-neutral-300 mx-auto" />
            <h3 className="text-sm font-bold text-neutral-700">No products found</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              No catalog items match your filter criteria.
            </p>
            <Link
              href={`${basePath}/products/new`}
              className="inline-flex items-center gap-1 rounded bg-neutral-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-neutral-800"
            >
              <Plus className="h-3.5 w-3.5" /> Add Product
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-700 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Product</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Flags</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Updated</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {products.map((product) => (
                  <ProductListRow key={product.id} product={product} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
