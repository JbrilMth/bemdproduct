import { SourcingRequestForm } from "@/components/SourcingRequestForm";

export default function SourcingRequestPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-200 pb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">
          Custom Sourcing Request
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
          Request a Custom Product Sourcing
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 mt-1 leading-relaxed">
          If the specific product or machine you need is not listed in our catalog, provide your target specifications, reference images, and estimated volume below. Our China team will identify suitable manufacturers and provide available details.
        </p>
      </div>

      {/* Form Container */}
      <div className="border border-neutral-200 bg-white p-6 sm:p-8">
        <SourcingRequestForm />
      </div>
    </div>
  );
}
