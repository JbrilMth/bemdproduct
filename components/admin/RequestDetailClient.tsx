"use client";

import { useState } from "react";
import { updateRequestInternalNotesAction } from "@/actions/requests";
import { RequestStatusSelect } from "@/components/admin/RequestStatusSelect";
import { CustomerRequestWithDetails } from "@/types";
import { formatDate } from "@/lib/utils";
import {
  MessageSquare,
  Mail,
  ArrowLeft,
  X,
  ExternalLink,
  Download,
  Save,
  Loader2,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useAdminPath } from "@/components/admin/AdminPathContext";

interface RequestDetailClientProps {
  request: CustomerRequestWithDetails;
}

export function RequestDetailClient({ request }: RequestDetailClientProps) {
  const { path } = useAdminPath();
  const [internalNotes, setInternalNotes] = useState(request.internalNotes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [activeImageModal, setActiveImageModal] = useState<string | null>(null);

  const cleanPhone = request.whatsapp.replace(/[^0-9+]/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone.replace("+", "")}`;

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNotes(true);
    setNotesSaved(false);

    const res = await updateRequestInternalNotesAction(request.id, internalNotes);
    setSavingNotes(false);
    if (res.success) {
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <Link
            href={path("/requests")}
            className="p-1 text-neutral-500 hover:text-neutral-900 rounded transition"
            title="Back to Requests List"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Inquiry Detail
              </span>
              <span className="text-neutral-300">•</span>
              <span className="text-[10px] text-neutral-400 font-mono">
                {request.id}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">
              {request.customerName}
            </h1>
          </div>
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-500">Status:</span>
          <RequestStatusSelect requestId={request.id} initialStatus={request.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Request Scope, Message, Reference Images & Internal Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Inquiry Details Box */}
          <div className="border border-neutral-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                Request Specifications
              </h3>
              <span className="text-[10px] font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded uppercase">
                {request.type === "QUOTATION_REQUEST" ? "Quotation Request" : "Custom Sourcing Request"}
              </span>
            </div>

            {/* Target Product */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                Requested Item / Product
              </span>
              {request.product ? (
                <div className="flex items-center gap-3 border border-neutral-200 bg-neutral-50 p-3">
                  {request.product.images && request.product.images.length > 0 && (
                    <img
                      src={request.product.images[0].imageUrl}
                      alt={request.product.name}
                      className="h-12 w-12 object-cover border border-neutral-200 flex-shrink-0"
                    />
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900">{request.product.name}</h4>
                    <Link
                      href={`/products/${request.product.slug}`}
                      target="_blank"
                      className="text-[11px] text-neutral-600 hover:text-neutral-900 inline-flex items-center gap-1 font-semibold"
                    >
                      View Live Product Page <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-sm font-bold text-neutral-900">
                  {request.productName || "Custom Sourcing Item"}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-neutral-100 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Target Quantity
                </span>
                <span className="font-semibold text-neutral-800">{request.quantity}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Submitted On
                </span>
                <span className="font-semibold text-neutral-800">{formatDate(request.createdAt)}</span>
              </div>
            </div>

            {/* Customer Message */}
            <div className="pt-2 border-t border-neutral-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                Customer Message & Custom Requirements
              </span>
              <div className="bg-neutral-50 border border-neutral-200 p-3.5 text-xs text-neutral-800 leading-relaxed whitespace-pre-wrap">
                {request.message}
              </div>
            </div>
          </div>

          {/* Uploaded Reference Images Gallery */}
          {request.images && request.images.length > 0 && (
            <div className="border border-neutral-200 bg-white p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Customer Uploaded Reference Photos ({request.images.length})
                </h3>
                <span className="text-[10px] text-neutral-400">Click photo to zoom</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                {request.images.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    onClick={() => setActiveImageModal(img.imageUrl)}
                    className="group relative aspect-square border border-neutral-200 bg-neutral-50 overflow-hidden cursor-pointer hover:border-neutral-900 transition"
                  >
                    <img
                      src={img.imageUrl}
                      alt={`Reference photo ${idx + 1}`}
                      className="h-full w-full object-cover group-hover:scale-103 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-semibold gap-1">
                      <span>View Full</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Internal Notes (Admin-Only) */}
          <div className="border border-neutral-200 bg-white p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Internal Operational Notes
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Private desk notes. Only visible to company administrators.
                </p>
              </div>
              {notesSaved && (
                <span className="text-[11px] font-semibold text-neutral-900 flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Saved
                </span>
              )}
            </div>

            <form onSubmit={handleSaveNotes} className="space-y-3">
              <textarea
                rows={4}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="e.g. Contacted customer via WhatsApp on Aug 23. Negotiating with Ningbo factory for 500 unit trial batch with custom silk-printed logo..."
                className="w-full rounded border border-neutral-300 p-3 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none font-sans leading-relaxed"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingNotes}
                  className="inline-flex items-center gap-1.5 rounded bg-neutral-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800 transition disabled:opacity-50"
                >
                  {savingNotes ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  <span>Save Notes</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Customer Contact & Direct WhatsApp Action */}
        <div className="space-y-6">
          {/* Direct Communication Box */}
          <div className="border border-neutral-200 bg-white p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-2">
              Buyer Contact Details
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Customer Name
                </span>
                <span className="font-bold text-neutral-900 text-sm block">
                  {request.customerName}
                </span>
              </div>

              {request.companyName && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                    Company Name
                  </span>
                  <span className="font-semibold text-neutral-800 block">
                    {request.companyName}
                  </span>
                </div>
              )}

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Destination Country / Port
                </span>
                <span className="font-semibold text-neutral-800 block">
                  {request.country}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  WhatsApp / Phone
                </span>
                <span className="font-mono font-semibold text-neutral-900 block">
                  {request.whatsapp}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Email
                </span>
                <a
                  href={`mailto:${request.email}`}
                  className="font-medium text-neutral-900 hover:underline block truncate"
                >
                  {request.email}
                </a>
              </div>
            </div>

            {/* 1-Click WhatsApp Button */}
            <div className="pt-2 border-t border-neutral-100 space-y-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 rounded bg-neutral-900 py-2.5 text-xs font-bold text-white hover:bg-neutral-800 transition"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Contact via WhatsApp</span>
              </a>

              <a
                href={`mailto:${request.email}?subject=China Sourcing Inquiry: ${encodeURIComponent(
                  request.productName || request.product?.name || "Product Quotation"
                )}`}
                className="w-full flex items-center justify-center gap-2 rounded border border-neutral-300 bg-white py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Send Direct Email</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Full Image Zoom Modal */}
      {activeImageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setActiveImageModal(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white border border-neutral-700 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-neutral-200 bg-neutral-50">
              <span className="text-xs font-bold text-neutral-800">
                Customer Reference Photo
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={activeImageModal}
                  target="_blank"
                  download
                  className="p-1.5 text-neutral-600 hover:text-neutral-900 rounded"
                  title="Open / Download Original"
                >
                  <Download className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setActiveImageModal(null)}
                  className="p-1.5 text-neutral-600 hover:text-neutral-900 rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-2 flex items-center justify-center bg-neutral-900 max-h-[80vh] overflow-auto">
              <img
                src={activeImageModal}
                alt="Enlarged Reference"
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
