interface SpecificationItem {
  id: string;
  name: string;
  value: string;
  sortOrder?: number;
}

interface SpecificationTableProps {
  specifications: SpecificationItem[];
}

export function SpecificationTable({ specifications }: SpecificationTableProps) {
  if (!specifications || specifications.length === 0) {
    return (
      <div className="border border-neutral-200 bg-neutral-50 p-5 text-center text-xs text-neutral-500">
        Detailed technical specifications and custom OEM parameters are available upon quotation request.
      </div>
    );
  }

  return (
    <div className="border border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-2.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
          Technical Specifications
        </h4>
      </div>
      <dl className="divide-y divide-neutral-100 text-xs">
        {specifications.map((spec, idx) => (
          <div
            key={spec.id || idx}
            className={`grid grid-cols-1 sm:grid-cols-3 gap-2 px-4 py-3 ${
              idx % 2 === 0 ? "bg-white" : "bg-neutral-50/50"
            }`}
          >
            <dt className="font-semibold text-neutral-900 sm:col-span-1">{spec.name}</dt>
            <dd className="text-neutral-600 sm:col-span-2 font-normal">{spec.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
