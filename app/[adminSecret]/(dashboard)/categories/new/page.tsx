import { prisma } from "@/lib/prisma";
import { CategoryForm } from "@/components/admin/CategoryForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewCategoryPage() {
  const parentCategories = await prisma.category.findMany({
    where: { parentId: null },
    select: { id: true, name: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Create New Category
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Add a top-level parent industry category or a specialized subcategory.
        </p>
      </div>

      <CategoryForm parentCategories={parentCategories} />
    </div>
  );
}
