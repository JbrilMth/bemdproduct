"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteProductAction, toggleProductStatusAction } from "@/actions/products";
import type { ProductStatus } from "@prisma/client";
import { Edit2, Trash2, Eye, Loader2, Package } from "lucide-react";
import { formatDate, resolveImageUrl } from "@/lib/utils";
import { useAdminPath } from "@/components/admin/AdminPathContext";

interface ProductListRowProps {
  product: {
    id: string;
    name: string;
    slug: string;
    status: ProductStatus;
    isFeatured: boolean;
    isTrending: boolean;
    isNew: boolean;
    updatedAt?: Date;
    createdAt: Date;
    category: { name: string };
    images: { imageUrl: string }[];
    specifications: { id: string }[];
  };
}

export function ProductListRow({ product }: ProductListRowProps) {
  const { path } = useAdminPath();
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<ProductStatus>(product.status);

  const handleStatusChange = async (newStatus: ProductStatus) => {
    setLoading(true);
    const res = await toggleProductStatusAction(product.id, newStatus);
    setLoading(false);
    if (res.success) {
      setCurrentStatus(newStatus);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      setLoading(true);
      await deleteProductAction(product.id);
      setLoading(false);
    }
  };

  const primaryImage = product.images[0]?.imageUrl;

  return (
    <tr className="hover:bg-neutral-50/70 transition">
      {/* Product Image & Title */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          {primaryImage ? (
            <img
              src={resolveImageUrl(primaryImage)}
              alt={product.name}
              className="h-10 w-10 object-cover border border-neutral-200 flex-shrink-0"
            />
          ) : (
            <div className="h-10 w-10 flex items-center justify-center bg-neutral-100 border border-neutral-200 text-neutral-400 flex-shrink-0">
              <Package className="h-5 w-5 stroke-[1.5]" />
            </div>
          )}
          <div className="min-w-0">
            <Link
              href={`/products/${product.slug}`}
              target="_blank"
              className="font-bold text-neutral-900 hover:text-neutral-600 truncate block max-w-xs sm:max-w-sm"
            >
              {product.name}
            </Link>
            <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-mono mt-0.5">
              <span>/{product.slug}</span>
              <span>•</span>
              <span>{product.specifications.length} specs</span>
            </div>
          </div>
        </div>
      </td>

      {/* Category */}
      <td className="py-3 px-4 text-neutral-700 font-medium">
        {product.category.name}
      </td>

      {/* Flags */}
      <td className="py-3 px-4">
        <div className="flex flex-wrap gap-1">
          {product.isFeatured && (
            <span className="bg-neutral-100 text-neutral-800 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded">
              Featured
            </span>
          )}
          {product.isTrending && (
            <span className="bg-neutral-100 text-neutral-800 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded">
              Trending
            </span>
          )}
          {product.isNew && (
            <span className="bg-neutral-100 text-neutral-800 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded">
              New
            </span>
          )}
        </div>
      </td>

      {/* Status Selector */}
      <td className="py-3 px-4">
        <select
          disabled={loading}
          value={currentStatus}
          onChange={(e) => handleStatusChange(e.target.value as ProductStatus)}
          className={`rounded border px-2 py-1 text-[11px] font-semibold focus:outline-none bg-white ${
            currentStatus === "PUBLISHED"
              ? "border-neutral-900 text-neutral-900 bg-neutral-50"
              : currentStatus === "DRAFT"
              ? "border-neutral-300 text-neutral-700 bg-white"
              : "border-neutral-200 text-neutral-400 bg-neutral-50"
          }`}
        >
          <option value="PUBLISHED">PUBLISHED</option>
          <option value="DRAFT">DRAFT</option>
          <option value="ARCHIVED">ARCHIVED</option>
        </select>
      </td>

      {/* Updated / Created At */}
      <td className="py-3 px-4 text-neutral-500 text-[11px] whitespace-nowrap">
        {formatDate(product.updatedAt || product.createdAt)}
      </td>

      {/* Action Buttons */}
      <td className="py-3 px-4 text-right">
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/products/${product.slug}`}
            target="_blank"
            title="View Live Page"
            className="p-1 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded transition"
          >
            <Eye className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={path(`/products/${product.id}/edit`)}
            title="Edit Product"
            className="p-1 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded transition"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            disabled={loading}
            onClick={handleDelete}
            title="Delete Product"
            className="p-1 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded transition disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}
