"use client";

import { useState } from "react";
import Link from "next/link";
import { submitSourcingRequestAction } from "@/actions/requests";
import { Check, AlertCircle, Loader2 } from "lucide-react";
import { CustomerImageUploader, CustomerUploadedImage } from "@/components/CustomerImageUploader";

export function SourcingRequestForm() {
  const [formData, setFormData] = useState({
    productName: "",
    customerName: "",
    companyName: "",
    country: "",
    whatsapp: "",
    email: "",
    quantity: "",
    message: "",
  });

  const [uploadedImages, setUploadedImages] = useState<CustomerUploadedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setFieldErrors({});

    const res = await submitSourcingRequestAction({
      ...formData,
      imageUrls: uploadedImages.map((img) => ({
        imageUrl: img.imageUrl,
        storageKey: img.storageKey,
      })),
    });
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
    return (
      <div className="border border-neutral-200 bg-neutral-50 p-8 sm:p-10 text-center space-y-4">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white">
          <Check className="h-5 w-5" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h2 className="text-xl font-bold text-neutral-900">
            Sourcing Request Submitted
          </h2>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Thank you, <span className="font-semibold text-neutral-900">{formData.customerName}</span>. Our China procurement team is researching manufacturing options for <span className="font-semibold text-neutral-900">&ldquo;{formData.productName}&rdquo;</span> and will contact you via WhatsApp (<span className="font-semibold text-neutral-900">{formData.whatsapp}</span>) and email within 24 hours.
          </p>
        </div>

        <div className="pt-3 flex items-center justify-center gap-3">
          <Link
            href="/products"
            className="rounded bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition"
          >
            Explore Catalog
          </Link>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setFormData({
                productName: "",
                customerName: "",
                companyName: "",
                country: "",
                whatsapp: "",
                email: "",
                quantity: "",
                message: "",
              });
              setUploadedImages([]);
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
      {errorMsg && (
        <div className="flex items-center gap-2 border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Product Name */}
      <div className="text-xs">
        <label className="block font-bold uppercase tracking-wider text-neutral-700 mb-1">
          Product / Machinery Name to Source <span className="text-neutral-400">*</span>
        </label>
        <input
          type="text"
          required
          value={formData.productName}
          onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
          placeholder="e.g. Automatic Paper Cup Machine, Portable Energy Storage Station, Electric Mini UTV"
          className={`w-full rounded border bg-white px-3 py-2 text-xs text-neutral-900 focus:outline-none ${
            fieldErrors.productName ? "border-red-400 focus:border-red-500" : "border-neutral-300 focus:border-neutral-900"
          }`}
        />
        {fieldErrors.productName && (
          <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.productName[0]}</p>
        )}
      </div>

      {/* Contact Grid */}
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
            placeholder="e.g. Carlos Mendoza"
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
            Company Name (Optional)
          </label>
          <input
            type="text"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            placeholder="e.g. Apex Import Corp"
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
            placeholder="e.g. Morocco / Port of Casablanca"
            className={`w-full rounded border bg-white px-3 py-2 text-xs text-neutral-900 focus:outline-none ${
              fieldErrors.country ? "border-red-400 focus:border-red-500" : "border-neutral-300 focus:border-neutral-900"
            }`}
          />
          {fieldErrors.country && (
            <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.country[0]}</p>
          )}
        </div>

        {/* Quantity */}
        <div>
          <label className="block font-bold uppercase tracking-wider text-neutral-700 mb-1">
            Estimated Target Quantity <span className="text-neutral-400">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            placeholder="e.g. 1,000 pcs trial / 5,000 annual"
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
            placeholder="e.g. +212 600 000000"
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

      {/* Real Device Image Upload */}
      <CustomerImageUploader
        images={uploadedImages}
        onChange={setUploadedImages}
        maxFiles={6}
      />

      {/* Message / Specifications */}
      <div className="text-xs">
        <label className="block font-bold uppercase tracking-wider text-neutral-700 mb-1">
          Detailed Requirements, Specifications & Target Application <span className="text-neutral-400">*</span>
        </label>
        <textarea
          rows={5}
          required
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Specify: 1. Material or dimension requirements; 2. Target certifications; 3. OEM custom packaging or branding needed; 4. Target delivery timeline..."
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
          <span>Submit Custom Sourcing Request</span>
        )}
      </button>

      <p className="text-center text-[11px] text-neutral-500">
        Inquiries are reviewed by our China trade desk. No account or registration required.
      </p>
    </form>
  );
}
