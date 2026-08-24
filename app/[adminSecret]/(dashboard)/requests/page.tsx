import Link from "next/link";
import { getAllRequests } from "@/lib/db/requests";
import { RequestStatusSelect } from "@/components/admin/RequestStatusSelect";
import { RequestType, RequestStatus } from "@prisma/client";
import { formatDate } from "@/lib/utils";
import { Inbox, Search } from "lucide-react";

interface AdminRequestsPageProps {
  params: Promise<{
    adminSecret: string;
  }>;
  searchParams: Promise<{
    type?: string;
    status?: string;
    search?: string;
    page?: string;
  }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminRequestsPage({ params, searchParams }: AdminRequestsPageProps) {
  const { adminSecret } = await params;
  const basePath = `/${adminSecret}`;
  const { type, status, search, page } = await searchParams;

  const filters: any = {};
  if (type && type !== "ALL") filters.type = type as RequestType;
  if (status && status !== "ALL") filters.status = status as RequestStatus;
  if (search) filters.search = search;
  if (page) filters.page = parseInt(page, 10);

  const { requests } = await getAllRequests(filters);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-neutral-200">
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">
          Inquiries Inbox
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">
          Customer Quotations & Sourcing Requests
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Review buyer inquiries, inspect uploaded reference photos, update status, and manage direct communications.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 border border-neutral-200 bg-white p-3">
        {/* Type Filter */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto">
          {[
            { label: "All Inquiries", value: "ALL" },
            { label: "Quotation Requests", value: "QUOTATION_REQUEST" },
            { label: "Sourcing Requests", value: "SOURCING_REQUEST" },
          ].map((tab) => {
            const isActive = (type || "ALL") === tab.value;
            return (
              <Link
                key={tab.value}
                href={`${basePath}/requests?type=${tab.value}${status ? `&status=${status}` : ""}${
                  search ? `&search=${search}` : ""
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

        {/* Status Dropdown & Search */}
        <form method="GET" action={`${basePath}/requests`} className="flex items-center gap-2 w-full md:w-auto">
          {type && <input type="hidden" name="type" value={type} />}

          <select
            name="status"
            defaultValue={status || "ALL"}
            className="rounded border border-neutral-300 bg-white px-2 py-1.5 text-xs text-neutral-800 focus:border-neutral-900 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">NEW</option>
            <option value="REVIEWING">REVIEWING</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-400" />
            <input
              type="text"
              name="search"
              defaultValue={search || ""}
              placeholder="Search customer, email, port..."
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

      {/* Requests Table */}
      <div className="border border-neutral-200 bg-white overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Inbox className="h-8 w-8 text-neutral-300 mx-auto" />
            <h3 className="text-sm font-bold text-neutral-700">No requests found</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              No buyer inquiries match your current filter settings.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-700 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Customer Details</th>
                  <th className="py-2.5 px-4">Destination</th>
                  <th className="py-2.5 px-4">Requested Item</th>
                  <th className="py-2.5 px-4">Quantity</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Submitted</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-neutral-50/70 transition">
                    <td className="py-3 px-4">
                      {req.type === "QUOTATION_REQUEST" ? (
                        <span className="text-[10px] font-bold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded uppercase tracking-wider">
                          Quotation
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-neutral-900 bg-neutral-200 px-2 py-0.5 rounded uppercase tracking-wider">
                          Sourcing
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-neutral-900">{req.customerName}</div>
                      <div className="text-[11px] text-neutral-500">{req.email}</div>
                      {req.companyName && (
                        <div className="text-[10px] text-neutral-400 font-medium">
                          {req.companyName}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-neutral-700">
                      <div className="font-medium text-neutral-900">{req.country}</div>
                    </td>

                    <td className="py-3 px-4 max-w-xs truncate">
                      {req.product ? (
                        <span className="font-semibold text-neutral-900 truncate block">
                          {req.product.name}
                        </span>
                      ) : (
                        <span className="font-semibold text-neutral-900 truncate block">
                          {req.productName || req.message}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-semibold text-neutral-800">{req.quantity}</td>

                    <td className="py-3 px-4">
                      <RequestStatusSelect requestId={req.id} initialStatus={req.status} />
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
    </div>
  );
}
