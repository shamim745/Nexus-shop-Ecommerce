export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block size-5 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600 ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function PageLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-gray-500">
      <Spinner />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {description && <p className="max-w-md text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
