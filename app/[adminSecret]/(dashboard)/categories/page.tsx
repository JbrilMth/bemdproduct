import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Plus, FolderTree } from "lucide-react";
import { CategoryListRow } from "@/components/admin/CategoryListRow";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface AdminCategoriesPageProps {
  params: Promise<{
    adminSecret: string;
  }>;
}

export default async function AdminCategoriesPage({ params }: AdminCategoriesPageProps) {
  const { adminSecret } = await params;
  const basePath = `/${adminSecret}`;

  const categories = await prisma.category.findMany({
    include: {
      parent: true,
      _count: {
        select: {
          products: true,
          children: true,
        },
      },
    },
    orderBy: [
      { parentId: "asc" },
      { sortOrder: "asc" },
    ],
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">
            Industry Hierarchies
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">
            Categories Management
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Organize 2-level hierarchy: Parent Category &rarr; Child Category &rarr; Products.
          </p>
        </div>

        <Link
          href={`${basePath}/categories/new`}
          className="inline-flex items-center gap-1.5 rounded bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition"
        >
          <Plus className="h-3.5 w-3.5" /> Add Category
        </Link>
      </div>

      {/* Categories Table */}
      <div className="border border-neutral-200 bg-white overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FolderTree className="h-8 w-8 text-neutral-300 mx-auto" />
            <h3 className="text-sm font-bold text-neutral-700">No categories found</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Create your first parent or subcategory.
            </p>
            <Link
              href={`${basePath}/categories/new`}
              className="inline-flex items-center gap-1 rounded bg-neutral-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-neutral-800"
            >
              <Plus className="h-3.5 w-3.5" /> Add Category
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-700 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Category Name & Slug</th>
                  <th className="py-2.5 px-4">Hierarchy Level</th>
                  <th className="py-2.5 px-4">Products</th>
                  <th className="py-2.5 px-4">Sort Order</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {categories.map((category) => (
                  <CategoryListRow key={category.id} category={category} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
