"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProductAction, updateProductAction } from "@/actions/products";
import { slugify } from "@/lib/utils";
import { ProductStatus } from "@prisma/client";
import {
  Plus,
  Trash2,
  Loader2,
  Save,
  ArrowLeft,
  AlertCircle,
  FolderPlus,
} from "lucide-react";
import Link from "next/link";
import { ImageUploader, UploadedImageItem } from "@/components/admin/ImageUploader";
import { useAdminPath } from "@/components/admin/AdminPathContext";

interface ProductFormProps {
  initialData?: {
    id: string;
    name: string;
    slug: string;
    shortDescription: string | null;
    description: string;
    categoryId: string;
    status: ProductStatus;
    isFeatured: boolean;
    isNew: boolean;
    isTrending: boolean;
    images: { id?: string; imageUrl: string; storageKey?: string | null; sortOrder: number }[];
    specifications: { name: string; value: string; sortOrder: number }[];
    tags: { tagId: string }[];
  };
  categories: { id: string; name: string; parentId: string | null }[];
  availableTags: { id: string; name: string }[];
}

export function ProductForm({
  initialData,
  categories,
  availableTags,
}: ProductFormProps) {
  const router = useRouter();
  const { path } = useAdminPath();
  const isEditing = Boolean(initialData?.id);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    shortDescription: initialData?.shortDescription || "",
    description: initialData?.description || "",
    categoryId: initialData?.categoryId || (categories[0]?.id || ""),
    status: initialData?.status || ("PUBLISHED" as ProductStatus),
    isFeatured: initialData?.isFeatured ?? false,
    isNew: initialData?.isNew ?? false,
    isTrending: initialData?.isTrending ?? false,
    specifications: initialData?.specifications?.length ? initialData.specifications : [],
    tagIds: initialData?.tags?.map((t) => t.tagId) || [],
  });

  const [uploadedImages, setUploadedImages] = useState<UploadedImageItem[]>(
    initialData?.images?.length
      ? initialData.images.map((img, idx) => ({
          id: img.id,
          imageUrl: img.imageUrl,
          storageKey: img.storageKey,
          sortOrder: img.sortOrder ?? idx,
        }))
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

  // Spec helpers
  const addSpec = () => {
    setFormData((prev) => ({
      ...prev,
      specifications: [
        ...prev.specifications,
        { name: "", value: "", sortOrder: prev.specifications.length + 1 },
      ],
    }));
  };

  const removeSpec = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== idx),
    }));
  };

  const updateSpec = (idx: number, field: "name" | "value", val: string) => {
    const updated = [...formData.specifications];
    updated[idx] = { ...updated[idx], [field]: val };
    setFormData((prev) => ({ ...prev, specifications: updated }));
  };

  // Tag helper
  const toggleTag = (tagId: string) => {
    setFormData((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (!formData.categoryId) {
      setErrorMsg("Please select or create a category for this product.");
      setLoading(false);
      return;
    }

    // Validate uploaded images
    if (uploadedImages.length === 0) {
      setErrorMsg("Please upload at least one product image from your device.");
      setLoading(false);
      return;
    }

    const payload = {
      ...formData,
      images: uploadedImages.map((img, i) => ({
        imageUrl: img.imageUrl,
        storageKey: img.storageKey,
        sortOrder: i,
      })),
      specifications: formData.specifications.filter(
        (s) => s.name.trim().length > 0 && s.value.trim().length > 0
      ),
    };

    const res = isEditing && initialData?.id
      ? await updateProductAction(initialData.id, payload)
      : await createProductAction(payload);

    setLoading(false);

    if (res.success) {
      router.push(path("/products"));
      router.refresh();
    } else {
      setErrorMsg(res.message || "Failed to save product.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl pb-16">
      {/* Header Actions */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
        <Link
          href={path("/products")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Products List
        </Link>

        <button
          type="submit"
          disabled={loading || categories.length === 0}
          className="inline-flex items-center gap-1.5 rounded bg-neutral-900 px-5 py-2 text-xs font-bold text-white hover:bg-neutral-800 transition disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          <span>{isEditing ? "Update Product" : "Publish Product"}</span>
        </button>
      </div>

      {categories.length === 0 && (
        <div className="flex items-center justify-between border border-neutral-300 bg-neutral-50 p-4 text-xs font-medium text-neutral-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-neutral-900" />
            <span>No categories exist yet. You must create at least one category before publishing products.</span>
          </div>
          <Link
            href={path("/categories/new")}
            className="inline-flex items-center gap-1 bg-neutral-900 text-white px-3 py-1.5 rounded font-semibold text-xs hover:bg-neutral-800"
          >
            <FolderPlus className="h-3.5 w-3.5" /> Create Category
          </Link>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 border border-neutral-300 bg-neutral-50 p-3 text-xs font-medium text-neutral-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-neutral-900" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. Basic Information */}
      <div className="border border-neutral-200 bg-white p-5 sm:p-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-2">
          Basic Product Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="sm:col-span-2">
            <label className="block font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Product Title <span className="text-neutral-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={handleNameChange}
              placeholder="e.g. 50HP Compact 4WD Agricultural Farm Tractor"
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
              Category <span className="text-neutral-400">*</span>
            </label>
            {categories.length > 0 ? (
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full rounded border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.parentId ? `↳ ${c.name}` : c.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-xs text-neutral-500 py-2">
                No categories available. Please create a category first.
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Publication Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ProductStatus })}
              className="w-full rounded border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none bg-white"
            >
              <option value="PUBLISHED">PUBLISHED (Live on Website)</option>
              <option value="DRAFT">DRAFT (Internal Review)</option>
              <option value="ARCHIVED">ARCHIVED (Hidden)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Short Summary (For Catalog Cards)
            </label>
            <textarea
              rows={2}
              value={formData.shortDescription}
              onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
              placeholder="1-2 sentences highlighting core parameters..."
              className="w-full rounded border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Full Manufacturing Overview <span className="text-neutral-400">*</span>
            </label>
            <textarea
              rows={5}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="In-depth details on manufacturing capabilities, applications, OEM options, and export standards..."
              className="w-full rounded border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Discovery Flags */}
        <div className="pt-3 border-t border-neutral-100 flex flex-wrap gap-6 text-xs">
          <label className="flex items-center gap-2 font-semibold text-neutral-700 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isFeatured}
              onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
              className="h-3.5 w-3.5 text-neutral-900 rounded border-neutral-300"
            />
            Featured on Homepage
          </label>

          <label className="flex items-center gap-2 font-semibold text-neutral-700 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isTrending}
              onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })}
              className="h-3.5 w-3.5 text-neutral-900 rounded border-neutral-300"
            />
            Trending Sourcing Item
          </label>

          <label className="flex items-center gap-2 font-semibold text-neutral-700 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isNew}
              onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
              className="h-3.5 w-3.5 text-neutral-900 rounded border-neutral-300"
            />
            New Arrival Tag
          </label>
        </div>
      </div>

      {/* 2. Product Images (Real Device Upload) */}
      <div className="border border-neutral-200 bg-white p-5 sm:p-6 space-y-4">
        <ImageUploader
          images={uploadedImages}
          onChange={setUploadedImages}
          multiple={true}
          folder="products"
          label="Product Gallery Images"
          description="Upload high-resolution photos from your device. Drag to reorder, set primary cover photo."
          maxFiles={10}
        />
      </div>

      {/* 3. Specifications */}
      <div className="border border-neutral-200 bg-white p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Technical Specifications & Parameters
            </h3>
            <p className="text-[11px] text-neutral-500">
              Add custom key-value attributes (e.g. Capacity, Material, Voltage, Rated Power).
            </p>
          </div>
          <button
            type="button"
            onClick={addSpec}
            className="inline-flex items-center gap-1 text-xs font-bold text-neutral-900 hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> Add Row
          </button>
        </div>

        {formData.specifications.length === 0 ? (
          <div className="text-center py-4 text-xs text-neutral-400">
            No specifications added yet. Click &ldquo;Add Row&rdquo; to add technical parameters.
          </div>
        ) : (
          <div className="space-y-2.5">
            {formData.specifications.map((spec, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs">
                <input
                  type="text"
                  value={spec.name}
                  onChange={(e) => updateSpec(idx, "name", e.target.value)}
                  placeholder="Parameter (e.g. Motor Speed)"
                  className="sm:col-span-5 rounded border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none"
                />
                <input
                  type="text"
                  value={spec.value}
                  onChange={(e) => updateSpec(idx, "value", e.target.value)}
                  placeholder="Value (e.g. 22,000 RPM)"
                  className="sm:col-span-6 rounded border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none"
                />
                <div className="sm:col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => removeSpec(idx)}
                    className="p-1.5 text-neutral-400 hover:text-neutral-900 transition"
                    title="Remove parameter"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Sourcing Tags */}
      {availableTags.length > 0 && (
        <div className="border border-neutral-200 bg-white p-5 sm:p-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-2">
            Product Discovery Tags
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {availableTags.map((tag) => {
              const isSelected = formData.tagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`rounded px-3 py-1 text-xs font-semibold uppercase tracking-wider transition ${
                    isSelected
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  }`}
                >
                  {isSelected ? "✓ " : "+ "}
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </form>
  );
}
