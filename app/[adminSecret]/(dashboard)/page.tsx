import Link from "next/link";
import {
  Package,
  FolderTree,
  Inbox,
  Clock,
  ArrowRight,
  Plus,
  CheckCircle,
} from "lucide-react";
import { getDashboardMetrics } from "@/lib/db/metrics";
import { getAllProductsForAdmin } from "@/lib/db/products";
import { RequestStatusBadge } from "@/components/RequestStatusBadge";
import { formatDate, resolveImageUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface AdminDashboardPageProps {
  params: Promise<{
    adminSecret: string;
  }>;
}

export default async function AdminDashboardPage({ params }: AdminDashboardPageProps) {
  const { adminSecret } = await params;
  const basePath = `/${adminSecret}`;

  const [metrics, recentProductsData] = await Promise.all([
    getDashboardMetrics(),
    getAllProductsForAdmin({ pageSize: 5 }),
  ]);

  const recentProducts = recentProductsData.products;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">
            Operational Overview
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">
            Business Dashboard
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Overview of sourcing inquiries, products catalog, and category status.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`${basePath}/products/new`}
            className="inline-flex items-center gap-1.5 rounded bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Product</span>
          </Link>
          <Link
            href={`${basePath}/categories/new`}
            className="inline-flex items-center gap-1.5 rounded border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Category</span>
          </Link>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Products */}
        <div className="border border-neutral-200 bg-white p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Total Products
            </span>
            <Package className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">{metrics.totalProducts}</div>
          <div className="text-[11px] text-neutral-500">
            {metrics.publishedProducts} published
          </div>
        </div>

        {/* Published Products */}
        <div className="border border-neutral-200 bg-white p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Published
            </span>
            <CheckCircle className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">{metrics.publishedProducts}</div>
          <div className="text-[11px] text-neutral-500">
            {metrics.draftProducts} in draft
          </div>
        </div>

        {/* Total Categories */}
        <div className="border border-neutral-200 bg-white p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Categories
            </span>
            <FolderTree className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">{metrics.totalCategories}</div>
          <div className="text-[11px] text-neutral-500">Industry sectors</div>
        </div>

        {/* New Requests */}
        <div className="border border-neutral-200 bg-white p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-900 font-extrabold">
              New Inquiries
            </span>
            <Clock className="h-4 w-4 text-neutral-900" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">{metrics.newRequestsCount}</div>
          <div className="text-[11px] text-neutral-500">Awaiting review</div>
        </div>

        {/* Pending Requests */}
        <div className="border border-neutral-200 bg-white p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              In Processing
            </span>
            <Inbox className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">{metrics.pendingRequestsCount}</div>
          <div className="text-[11px] text-neutral-500">Active pipelines</div>
        </div>
      </div>

      {/* Recent Requests Section */}
      <div className="border border-neutral-200 bg-white">
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-neutral-50/50">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Recent Customer Inquiries & Sourcing Requests
            </h2>
            <p className="text-[11px] text-neutral-500">
              Latest quotation requests and custom product sourcing submissions.
            </p>
          </div>
          <Link
            href={`${basePath}/requests`}
            className="text-xs font-semibold text-neutral-900 hover:text-neutral-600 flex items-center gap-1 transition"
          >
            All Requests ({metrics.totalRequestsCount}) <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {metrics.recentRequests.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-500">
            No customer inquiries received yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-700 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Country</th>
                  <th className="py-2.5 px-4">Requested Item</th>
                  <th className="py-2.5 px-4">Quantity</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {metrics.recentRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-neutral-50/70 transition">
                    <td className="py-3 px-4 font-semibold text-neutral-900">
                      {req.type === "QUOTATION_REQUEST" ? (
                        <span className="text-[11px] font-semibold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded">
                          Quotation
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-neutral-900 bg-neutral-200 px-2 py-0.5 rounded">
                          Sourcing
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-neutral-900">{req.customerName}</div>
                      {req.companyName && (
                        <div className="text-[11px] text-neutral-500 truncate max-w-xs">
                          {req.companyName}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-neutral-700">{req.country}</td>
                    <td className="py-3 px-4 max-w-xs truncate">
                      {req.product ? (
                        <span className="font-medium text-neutral-900 truncate block">
                          {req.product.name}
                        </span>
                      ) : (
                        <span className="font-medium text-neutral-900 truncate block">
                          {req.productName || req.message}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-neutral-800">{req.quantity}</td>
                    <td className="py-3 px-4">
                      <RequestStatusBadge status={req.status} />
                    </td>
                    <td className="py-3 px-4 text-neutral-500 whitespace-nowrap">
                      {formatDate(req.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`${basePath}/requests/${req.id}`}
                        className="rounded border border-neutral-300 bg-white hover:bg-neutral-50 px-2.5 py-1 font-semibold text-neutral-800 transition"
                      >
                        View &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recently Added Products Section */}
      <div className="border border-neutral-200 bg-white">
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-neutral-50/50">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Recently Added Products
            </h2>
            <p className="text-[11px] text-neutral-500">
              Quick access to recently updated or created catalog items.
            </p>
          </div>
          <Link
            href={`${basePath}/products`}
            className="text-xs font-semibold text-neutral-900 hover:text-neutral-600 flex items-center gap-1 transition"
          >
            All Products ({metrics.totalProducts}) <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {recentProducts.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-500">
            No products added yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-700 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Product</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Updated</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {recentProducts.map((prod) => {
                  const rawThumb = prod.images?.[0]?.imageUrl;
                  const thumb = resolveImageUrl(rawThumb);
                  return (
                    <tr key={prod.id} className="hover:bg-neutral-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={prod.name}
                              className="h-10 w-10 object-cover border border-neutral-200 flex-shrink-0"
                            />
                          ) : (
                            <div className="h-10 w-10 flex items-center justify-center bg-neutral-100 border border-neutral-200 text-neutral-400 flex-shrink-0">
                              <Package className="h-5 w-5 stroke-[1.5]" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-bold text-neutral-900 block truncate max-w-xs sm:max-w-md">
                              {prod.name}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              /{prod.slug}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-neutral-700 font-medium">
                        {prod.category?.name}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            prod.status === "PUBLISHED"
                              ? "bg-neutral-900 text-white"
                              : prod.status === "DRAFT"
                              ? "bg-neutral-200 text-neutral-800"
                              : "bg-neutral-100 text-neutral-400"
                          }`}
                        >
                          {prod.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-neutral-500 whitespace-nowrap">
                        {formatDate(prod.updatedAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`${basePath}/products/${prod.id}/edit`}
                          className="rounded border border-neutral-300 bg-white hover:bg-neutral-50 px-2.5 py-1 font-semibold text-neutral-800 transition"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
