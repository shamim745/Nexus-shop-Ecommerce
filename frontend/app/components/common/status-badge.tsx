const STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  UNPAID: "bg-amber-100 text-amber-800",
  PAID: "bg-green-100 text-green-800",
};

const LABELS: Record<string, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  UNPAID: "Unpaid",
  PAID: "Paid",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[status] ?? "bg-gray-100 text-gray-700"}`}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
