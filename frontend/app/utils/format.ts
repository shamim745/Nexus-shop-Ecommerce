const symbol = import.meta.env.VITE_CURRENCY_SYMBOL ?? "৳";

/** Formats a number as currency, e.g. ৳1,299 */
export function formatPrice(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const formatted = rounded.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(rounded) ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
}

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export function errorMessage(error: unknown): string {
  if (!error) return "Something went wrong";
  const err = error as {
    data?: { message?: string | string[] };
    status?: number | string;
  };
  const msg = err.data?.message;
  if (Array.isArray(msg)) return msg.join(", ");
  if (typeof msg === "string" && msg) return msg;
  if (err.status === "FETCH_ERROR") return "Network error — is the API running?";
  if (err.status === 401) return "Please log in to continue";
  if (err.status === 403) return "You don't have access to this resource";
  if (err.status === 404) return "Not found";
  return "Something went wrong";
}
