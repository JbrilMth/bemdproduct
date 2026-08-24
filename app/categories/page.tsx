import Link from "next/link";
import { getActiveParentCategories } from "@/lib/db/categories";
import { ArrowUpRight, FolderTree } from "lucide-react";
import { CategoryCard } from "@/components/CategoryCard";

export const revalidate = 60;

export default async function CategoriesPage() {
  const categories = await getActiveParentCategories();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="max-w-3xl pb-6 border-b border-neutral-200">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">
          Industry Directory
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
          Product Categories & Manufacturing Sectors
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
          Explore key Chinese manufacturing clusters organized by industry sector. Select any parent or subcategory to browse products available for direct export, private label OEM, or wholesale distribution.
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="border border-neutral-200 bg-white p-12 text-center space-y-3">
          <FolderTree className="mx-auto h-10 w-10 text-neutral-300" />
          <h3 className="text-sm font-bold text-neutral-900">No categories available yet</h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            Categories created in the administration panel will appear here. In the meantime, you can submit a custom product sourcing request.
          </p>
          <div className="pt-2">
            <Link
              href="/sourcing-request"
              className="inline-flex rounded bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition"
            >
              Request Custom Sourcing
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>

          {/* Structured Category Directory Breakdown */}
          <div className="border border-neutral-200 bg-white p-6 sm:p-8 space-y-6">
            <h2 className="text-base font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-3">
              Complete Directory Index
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {categories.map((parent) => (
                <div key={parent.id} className="space-y-3">
                  <Link
                    href={`/products?categorySlug=${parent.slug}`}
                    className="font-bold text-neutral-900 hover:text-neutral-600 text-sm flex items-center justify-between group"
                  >
                    <span>{parent.name}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-neutral-400 group-hover:text-neutral-900 transition" />
                  </Link>

                  {parent.children && parent.children.length > 0 ? (
                    <ul className="space-y-1.5 pl-3 border-l border-neutral-200 text-xs">
                      {parent.children.map((child) => (
                        <li key={child.id}>
                          <Link
                            href={`/products?categorySlug=${child.slug}`}
                            className="text-neutral-600 hover:text-neutral-900 transition block py-0.5"
                          >
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-neutral-400 italic">No subcategories listed</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
