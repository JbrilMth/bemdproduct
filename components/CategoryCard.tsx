import Link from "next/link";
import { ArrowRight, FolderTree } from "lucide-react";
import { CategoryWithChildren } from "@/types";
import { resolveImageUrl } from "@/lib/utils";

interface CategoryCardProps {
  category: CategoryWithChildren;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const imageUrl = resolveImageUrl(category.imageUrl);

  return (
    <div className="group flex flex-col border border-neutral-200 bg-white hover:border-neutral-400 transition">
      {/* Category Image or Placeholder Banner */}
      <Link
        href={`/products?categorySlug=${category.slug}`}
        className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-900 block"
      >
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={category.name}
              className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-103"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          </>
        ) : (
          <div className="flex h-full w-full flex-col justify-between p-4 bg-gradient-to-br from-neutral-800 to-neutral-950 text-white">
            <FolderTree className="h-6 w-6 text-neutral-400" />
            <div />
          </div>
        )}
        
        <div className="absolute bottom-3 left-4 right-4 text-white">
          <h3 className="text-base font-bold text-white tracking-tight">
            {category.name}
          </h3>
          {category.description && (
            <p className="text-xs text-neutral-200 line-clamp-1 mt-0.5 font-light">
              {category.description}
            </p>
          )}
        </div>
      </Link>

      {/* Subcategories list */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        {category.children && category.children.length > 0 ? (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Subcategories
            </div>
            <div className="flex flex-wrap gap-1.5">
              {category.children.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/products?categorySlug=${sub.slug}`}
                  className="rounded border border-neutral-200 bg-neutral-50 px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition"
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-neutral-500">
            Browse all products in this category.
          </p>
        )}

        <div className="mt-4 pt-3 border-t border-neutral-100">
          <Link
            href={`/products?categorySlug=${category.slug}`}
            className="text-xs font-semibold text-neutral-900 hover:text-neutral-600 inline-flex items-center gap-1 transition"
          >
            Explore Category <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
