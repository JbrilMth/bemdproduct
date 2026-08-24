"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteCategoryAction } from "@/actions/categories";
import { Edit2, Trash2, Loader2 } from "lucide-react";
import { CategoryStatus } from "@prisma/client";
import { resolveImageUrl } from "@/lib/utils";
import { useAdminPath } from "@/components/admin/AdminPathContext";

interface CategoryListRowProps {
  category: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    parentId: string | null;
    status: CategoryStatus;
    sortOrder: number;
    parent?: { name: string } | null;
    _count?: {
      products?: number;
      children?: number;
    };
  };
}

export function CategoryListRow({ category }: CategoryListRowProps) {
  const { path } = useAdminPath();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete category "${category.name}"? This action cannot be undone.`)) {
      setLoading(true);
      await deleteCategoryAction(category.id);
      setLoading(false);
    }
  };

  const isChild = Boolean(category.parentId);

  return (
    <tr className="hover:bg-neutral-50/70 transition text-xs">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          {category.imageUrl && (
            <img
              src={resolveImageUrl(category.imageUrl)}
              alt={category.name}
              className="h-9 w-9 object-cover border border-neutral-200 flex-shrink-0"
            />
          )}
          <div>
            <div className={`font-bold text-neutral-900 ${isChild ? "pl-3 text-xs" : "text-xs font-extrabold"}`}>
              {isChild && <span className="text-neutral-400 font-normal mr-1.5">↳</span>}
              {category.name}
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">/{category.slug}</span>
          </div>
        </div>
      </td>

      <td className="py-3 px-4">
        {category.parent ? (
          <span className="rounded bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-700 font-medium">
            {category.parent.name}
          </span>
        ) : (
          <span className="rounded bg-neutral-900 px-2 py-0.5 text-[10px] text-white font-bold uppercase tracking-wider">
            Parent Category
          </span>
        )}
      </td>

      <td className="py-3 px-4 text-xs font-semibold text-neutral-800">
        {category._count?.products || 0} products
      </td>

      <td className="py-3 px-4 text-xs text-neutral-500 font-mono">
        #{category.sortOrder}
      </td>

      <td className="py-3 px-4 text-right">
        <div className="flex items-center justify-end gap-1">
          <Link
            href={path(`/categories/${category.id}/edit`)}
            title="Edit Category"
            className="p-1 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded transition"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            disabled={loading}
            onClick={handleDelete}
            title="Delete Category"
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
