"use client";

import { useState } from "react";
import { submitQuotationRequestAction } from "@/actions/requests";
import Link from "next/link";
import { Check, AlertCircle, Loader2, Package, Layers } from "lucide-react";
import { ProductWithDetails } from "@/types";

export interface AvailableProductOption {
  id: string;
  name: string;
  slug: string;
  category: {
    name: string;
  };
  images: {
    imageUrl: string;
  }[];
}

interface QuotationFormProps {
  initialProduct?: ProductWithDetails | null;
  availableProducts?: AvailableProductOption[];
}

export function QuotationForm({
  initialProduct,
  availableProducts = [],
}: QuotationFormProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProduct?.id || ""
  );
  const [customProductName, setCustomProductName] = useState<string>(
    initialProduct ? "" : ""
  );
  const [isCustomMode, setIsCustomMode] = useState<boolean>(
    !initialProduct && availableProducts.length === 0
  );

  const [formData, setFormData] = useState({
    customerName: "",
    companyName: "",
    country: "",
    whatsapp: "",
    email: "",
    quantity: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitted, setSubmitted] = useState(false);

  // Find currently selected product (either initial or chosen from list)
  const currentProduct = selectedProductId
    ? (initialProduct?.id === selectedProductId
        ? initialProduct
        : availableProducts.find((p) => p.id === selectedProductId))
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setFieldErrors({});

    // Validate product selection or custom name
    if (!selectedProductId && !customProductName.trim()) {
      setLoading(false);
      setErrorMsg("Please select a catalog product or enter a product name to quote.");
      return;
    }

    const payload = {
      ...formData,
      productId: selectedProductId || null,
      productName: currentProduct?.name || customProductName.trim() || null,
    };

    const res = await submitQuotationRequestAction(payload);
    setLoading(false);

    if (res.success) {
      setSubmitted(true);
    } else {
      setErrorMsg(res.message || "Please fill all required fields correctly.");
      if (res.errors) {
        setFieldErrors(res.errors);
      }
    }
  };

  if (submitted) {
    const displayItemName =
      currentProduct?.name || customProductName || "your requested product";

    return (
      <div className="border border-neutral-200 bg-neutral-50 p-8 sm:p-10 text-center space-y-4">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white">
          <Check className="h-5 w-5" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h2 className="text-xl font-bold text-neutral-900">
            Quotation Request Submitted
          </h2>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Thank you, <span className="font-semibold text-neutral-900">{formData.customerName}</span>. Our China sourcing desk has received your quotation inquiry for <span className="font-semibold text-neutral-900">&ldquo;{displayItemName}&rdquo;</span> and will prepare pricing & shipping terms to contact you via WhatsApp (<span className="font-semibold text-neutral-900">{formData.whatsapp}</span>) and email shortly.
          </p>
        </div>

        <div className="pt-3 flex items-center justify-center gap-3">
          <Link
            href="/products"
            className="rounded bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition"
          >
            Browse Catalog
          </Link>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setFormData({
                customerName: "",
                companyName: "",
                country: "",
                whatsapp: "",
                email: "",
                quantity: "",
                message: "",
              });
            }}
            className="rounded border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Product Selection Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
            Target Product to Quote <span className="text-neutral-400">*</span>
          </label>
          {availableProducts.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setIsCustomMode(!isCustomMode);
                if (!isCustomMode) {
                  setSelectedProductId("");
                } else if (availableProducts.length > 0) {
                  setSelectedProductId(availableProducts[0].id);
                  setCustomProductName("");
                }
              }}
              className="text-[11px] font-semibold text-neutral-600 hover:text-neutral-900 underline"
            >
              {isCustomMode
                ? "← Pick from Catalog"
                : "+ Enter Custom Product Name"}
            </button>
          )}
        </div>

        {/* Option A: Product is Selected from Catalog */}
        {!isCustomMode && currentProduct ? (
          <div className="flex items-center justify-between gap-3 border border-neutral-300 bg-neutral-50 p-3.5">
            <div className="flex items-center gap-3 min-w-0">
              {currentProduct.images && currentProduct.images.length > 0 ? (
                <img
                  src={currentProduct.images[0].imageUrl}
                  alt={currentProduct.name}
                  className="h-12 w-12 object-cover border border-neutral-200 bg-white flex-shrink-0"
                />
              ) : (
                <div className="h-12 w-12 bg-neutral-200 border border-neutral-300 flex items-center justify-center flex-shrink-0 text-neutral-500">
                  <Package className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Selected Catalog Item
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                  {currentProduct.name}
                </h4>
                <span className="text-[11px] text-neutral-500">
                  Category: {currentProduct.category.name}
                </span>
              </div>
            </div>

            {availableProducts.length > 1 && (
              <button
                type="button"
                onClick={() => setSelectedProductId("")}
                className="flex-shrink-0 text-[11px] font-semibold text-neutral-600 hover:text-neutral-900 border border-neutral-300 bg-white px-2.5 py-1 rounded transition"
              >
                Change Item
              </button>
            )}
          </div>
        ) : !isCustomMode && availableProducts.length > 0 ? (
          /* Option B: Choose from Dropdown list */
          <div className="space-y-1">
            <select
              value={selectedProductId}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "__custom__") {
                  setIsCustomMode(true);
                  setSelectedProductId("");
                  setCustomProductName("");
                } else {
                  setSelectedProductId(val);
                  const found = availableProducts.find((p) => p.id === val);
                  setCustomProductName(found?.name || "");
                }
              }}
              className="w-full rounded border border-neutral-300 bg-white px-3 py-2.5 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none"
            >
              <option value="">-- Select a product from catalog ({availableProducts.length} available) --</option>
              {availableProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} [{p.category.name}]
                </option>
              ))}
              <option value="__custom__">+ Item not in catalog (Enter custom name)</option>
            </select>
            <p className="text-[11px] text-neutral-500">
              Select which product from our China catalog you would like an export quotation for.
            </p>
          </div>
        ) : (
          /* Option C: Custom Product Name Text Input */
          <div className="space-y-1">
            <input
              type="text"
              required
              value={customProductName}
              onChange={(e) => setCustomProductName(e.target.value)}
              placeholder="e.g. CE Certified Container House Modular Cabin, CNC Machine, Solar Battery..."
              className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none"
            />
            <p className="text-[11px] text-neutral-500">
              Enter the name or type of product you want our China procurement team to quote.
            </p>
          </div>
        )}

        {/* Custom Sourcing Callout */}
        <div className="border border-neutral-200 bg-neutral-50 p-3 flex items-start gap-2.5 text-xs text-neutral-600">
          <Layers className="h-4 w-4 text-neutral-900 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-neutral-900">Custom Sourcing Needed?</span>{" "}
            If you need complete factory research, technical blueprints, or want to upload reference photos,{" "}
            <Link
              href="/sourcing-request"
              className="text-neutral-900 font-bold underline hover:text-neutral-700"
            >
              Submit a Custom Sourcing Request &rarr;
            </Link>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        {/* Name */}
        <div>
          <label className="block font-bold uppercase tracking-wider text-neutral-700 mb-1">
            Full Name <span className="text-neutral-400">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            placeholder="e.g. Johnathan Smith"
            className={`w-full rounded border bg-white px-3 py-2 text-xs text-neutral-900 focus:outline-none ${
              fieldErrors.customerName ? "border-red-400 focus:border-red-500" : "border-neutral-300 focus:border-neutral-900"
            }`}
          />
          {fieldErrors.customerName && (
            <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.customerName[0]}</p>
          )}
        </div>

        {/* Company Name */}
        <div>
          <label className="block font-bold uppercase tracking-wider text-neutral-700 mb-1">
            Company / Business Name (Optional)
          </label>
          <input
            type="text"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            placeholder="e.g. Apex Global Trading LLC"
            className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none"
          />
        </div>

        {/* Country */}
        <div>
          <label className="block font-bold uppercase tracking-wider text-neutral-700 mb-1">
            Destination Country / Port <span className="text-neutral-400">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            placeholder="e.g. Germany / Hamburg Port"
            className={`w-full rounded border bg-white px-3 py-2 text-xs text-neutral-900 focus:outline-none ${
              fieldErrors.country ? "border-red-400 focus:border-red-500" : "border-neutral-300 focus:border-neutral-900"
            }`}
          />
          {fieldErrors.country && (
            <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.country[0]}</p>
          )}
        </div>

        {/* Estimated Quantity */}
        <div>
          <label className="block font-bold uppercase tracking-wider text-neutral-700 mb-1">
            Estimated Target Quantity <span className="text-neutral-400">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            placeholder="e.g. 500 units / 1 20ft container"
            className={`w-full rounded border bg-white px-3 py-2 text-xs text-neutral-900 focus:outline-none ${
              fieldErrors.quantity ? "border-red-400 focus:border-red-500" : "border-neutral-300 focus:border-neutral-900"
            }`}
          />
          {fieldErrors.quantity && (
            <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.quantity[0]}</p>
          )}
        </div>

        {/* WhatsApp */}
        <div>
          <label className="block font-bold uppercase tracking-wider text-neutral-700 mb-1">
            WhatsApp / Phone (with Country Code) <span className="text-neutral-400">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.whatsapp}
            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
            placeholder="e.g. +49 152 12345678"
            className={`w-full rounded border bg-white px-3 py-2 text-xs text-neutral-900 focus:outline-none ${
              fieldErrors.whatsapp ? "border-red-400 focus:border-red-500" : "border-neutral-300 focus:border-neutral-900"
            }`}
          />
          {fieldErrors.whatsapp && (
            <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.whatsapp[0]}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block font-bold uppercase tracking-wider text-neutral-700 mb-1">
            Business Email <span className="text-neutral-400">*</span>
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="e.g. procurement@company.com"
            className={`w-full rounded border bg-white px-3 py-2 text-xs text-neutral-900 focus:outline-none ${
              fieldErrors.email ? "border-red-400 focus:border-red-500" : "border-neutral-300 focus:border-neutral-900"
            }`}
          />
          {fieldErrors.email && (
            <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.email[0]}</p>
          )}
        </div>
      </div>

      {/* Message / Requirements */}
      <div className="text-xs">
        <label className="block font-bold uppercase tracking-wider text-neutral-700 mb-1">
          Custom Requirements & Delivery Terms <span className="text-neutral-400">*</span>
        </label>
        <textarea
          rows={4}
          required
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Please describe your requirements (e.g. OEM custom logo engraving, custom packaging, target shipping terms like CIF/FOB/DDP, target delivery date)..."
          className={`w-full rounded border bg-white px-3 py-2.5 text-xs text-neutral-900 focus:outline-none ${
            fieldErrors.message ? "border-red-400 focus:border-red-500" : "border-neutral-300 focus:border-neutral-900"
          }`}
        />
        {fieldErrors.message && (
          <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.message[0]}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded bg-neutral-900 py-3 text-xs font-bold text-white hover:bg-neutral-800 transition disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Transmitting Request...</span>
          </>
        ) : (
          <span>Submit Quotation Request</span>
        )}
      </button>

      <p className="text-center text-[11px] text-neutral-500">
        Inquiries are reviewed by our China trade desk. No account or registration required.
      </p>
    </form>
  );
}
