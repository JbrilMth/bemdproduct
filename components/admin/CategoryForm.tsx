"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCategoryAction, updateCategoryAction } from "@/actions/categories";
import { slugify } from "@/lib/utils";
import type { CategoryStatus } from "@prisma/client";
import { Loader2, Save, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { ImageUploader, UploadedImageItem } from "@/components/admin/ImageUploader";
import { useAdminPath } from "@/components/admin/AdminPathContext";

interface CategoryFormProps {
  initialData?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    storageKey?: string | null;
    parentId: string | null;
    status: CategoryStatus;
    sortOrder: number;
  };
  parentCategories: { id: string; name: string }[];
}

export function CategoryForm({ initialData, parentCategories }: CategoryFormProps) {
  const router = useRouter();
  const { path } = useAdminPath();
  const isEditing = Boolean(initialData?.id);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    description: initialData?.description || "",
    parentId: initialData?.parentId || "",
    status: initialData?.status || ("ACTIVE" as CategoryStatus),
    sortOrder: initialData?.sortOrder ?? 0,
  });

  const [uploadedImages, setUploadedImages] = useState<UploadedImageItem[]>(
    initialData?.imageUrl
      ? [
          {
            imageUrl: initialData.imageUrl,
            storageKey: initialData.storageKey,
            sortOrder: 0,
          },
        ]
      : []
  );

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name: val,
      slug: isEditing ? prev.slug : slugify(val),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const primaryImage = uploadedImages[0];

    const payload = {
      ...formData,
      parentId: formData.parentId ? formData.parentId : null,
      description: formData.description || null,
      imageUrl: primaryImage ? primaryImage.imageUrl : null,
      storageKey: primaryImage ? primaryImage.storageKey : null,
    };

    const res = isEditing && initialData?.id
      ? await updateCategoryAction(initialData.id, payload)
      : await createCategoryAction(payload);

    setLoading(false);

    if (res.success) {
      router.push(path("/categories"));
      router.refresh();
    } else {
      setErrorMsg(res.message || "Failed to save category.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
        <Link
          href={path("/categories")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Categories List
        </Link>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded bg-neutral-900 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 transition disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          <span>{isEditing ? "Update Category" : "Create Category"}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 border border-neutral-300 bg-neutral-50 p-3 text-xs font-medium text-neutral-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-neutral-900" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="border border-neutral-200 bg-white p-5 sm:p-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-2">
          Category Parameters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Category Name <span className="text-neutral-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={handleNameChange}
              placeholder="e.g. Agricultural Tractors"
              className="w-full rounded border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-neutral-700 mb-1">
              URL Slug <span className="text-neutral-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full rounded border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Parent Category (Optional)
            </label>
            <select
              value={formData.parentId}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
              className="w-full rounded border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none bg-white"
            >
              <option value="">None (Top-Level Parent Category)</option>
              {parentCategories
                .filter((p) => !initialData?.id || p.id !== initialData.id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    Parent: {p.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Sort Order
            </label>
            <input
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value, 10) || 0 })}
              className="w-full rounded border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Short description of this product industry sector..."
              className="w-full rounded border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Real Device Category Image Upload */}
      <div className="border border-neutral-200 bg-white p-5 sm:p-6">
        <ImageUploader
          images={uploadedImages}
          onChange={setUploadedImages}
          multiple={false}
          folder="categories"
          label="Category Cover Image"
          description="Upload an authentic category banner image from your device."
          maxFiles={1}
        />
      </div>
    </form>
  );
}
