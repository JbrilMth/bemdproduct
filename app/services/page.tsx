import Link from "next/link";

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <div className="max-w-3xl pb-6 border-b border-neutral-200">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">
          Trading & Sourcing Scope
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
          How We Source in China
        </h1>
        <p className="mt-3 text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
          We operate as a China-based trading company assisting international importers, brands, and wholesalers. Our on-ground team manages factory identification, volume quotation negotiations, OEM customization, quality inspection, and international export logistics.
        </p>
      </div>

      {/* 4-Step Process Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-neutral-200 bg-white p-6 sm:p-8 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Phase 01
          </div>
          <h3 className="text-lg font-bold text-neutral-900">
            Factory Identification & Background Verification
          </h3>
          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
            We identify manufacturing facilities directly in specialized industrial clusters across China (such as Ningbo, Shenzhen, Dongguan, Changzhou, and Weifang). We inspect business registration, export qualifications, and tooling capabilities.
          </p>
        </div>

        <div className="border border-neutral-200 bg-white p-6 sm:p-8 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Phase 02
          </div>
          <h3 className="text-lg font-bold text-neutral-900">
            Quotation Negotiation & OEM Customization
          </h3>
          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
            Our procurement team communicates directly with manufacturers to negotiate export pricing based on your required volume. We coordinate sample production, custom logo laser engraving, Pantone color matching, and export retail packaging.
          </p>
        </div>

        <div className="border border-neutral-200 bg-white p-6 sm:p-8 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Phase 03
          </div>
          <h3 className="text-lg font-bold text-neutral-900">
            Pre-Shipment Quality Inspection
          </h3>
          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
            Before finished goods leave the manufacturing floor, on-site inspections verify physical dimensions, cosmetic finish, electrical parameters, functional operation, drop resistance, and packaging integrity with photo and video reporting.
          </p>
        </div>

        <div className="border border-neutral-200 bg-white p-6 sm:p-8 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Phase 04
          </div>
          <h3 className="text-lg font-bold text-neutral-900">
            Customs Clearance & International Logistics
          </h3>
          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
            We coordinate export declaration paperwork at Chinese ports and organize FCL full-container or LCL consolidated sea freight, air shipping, or rail transport to your destination port or warehouse.
          </p>
        </div>
      </div>

      {/* CTA Box */}
      <div className="border border-neutral-200 bg-neutral-900 p-8 sm:p-12 text-white">
        <div className="max-w-xl space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Direct Inquiries
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Ready to request a quotation or source a product?
          </h2>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Submit your product specifications or browse our active catalog to begin.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/sourcing-request"
              className="rounded bg-white px-5 py-2.5 text-xs font-bold text-neutral-900 hover:bg-neutral-100 transition"
            >
              Request a Product
            </Link>
            <Link
              href="/products"
              className="rounded border border-neutral-700 px-5 py-2.5 text-xs font-semibold text-neutral-300 hover:text-white transition"
            >
              Browse Catalog
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
