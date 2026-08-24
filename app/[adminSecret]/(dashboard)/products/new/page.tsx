import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewProductPage() {
  const [categories, tags] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
      select: { id: true, name: true, parentId: true },
    }),
    prisma.tag.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Create New Product
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Add a new export product with flexible specifications, tags, and gallery images.
        </p>
      </div>

      <ProductForm categories={categories} availableTags={tags} />
    </div>
  );
}
