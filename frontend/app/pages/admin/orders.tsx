import { useState } from "react";
import { Link } from "react-router";
import { Search } from "lucide-react";
import { useAdminOrdersQuery } from "~/redux/api";
import { EmptyState, PageLoader } from "~/components";
import { Pagination } from "~/components";
import { StatusBadge } from "~/components";
import { AdminPageHeader } from "./layout";
import { formatDateTime, formatPrice } from "~/utils/format";

const STATUSES = [
  "ALL",
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("ALL");
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");

  const { data, isLoading, isFetching } = useAdminOrdersQuery({
    page,
    limit: 20,
    status: status === "ALL" ? undefined : status,
    search: search || undefined,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(input.trim());
  };

  return (
    <div>
      <AdminPageHeader
        title="Orders"
        description={data ? `${data.meta.total} total order(s)` : undefined}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <form onSubmit={submit} className="relative flex-1 sm:max-w-xs">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            className="input pl-9"
            placeholder="Order #, name, phone, email..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </form>
        <select
          className="input w-auto"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as (typeof STATUSES)[number]);
            setPage(1);
          }}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "ALL" ? "All statuses" : s}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <PageLoader label="Loading orders..." />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="No orders found"
          description={search ? `Nothing matches "${search}".` : "Orders will appear here."}
        />
      ) : (
        <>
          <div className={`card overflow-x-auto ${isFetching ? "opacity-60" : ""}`}>
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Placed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="font-medium text-indigo-600 hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{order.shippingName}</p>
                      <p className="text-xs text-gray-500">{order.shippingPhone}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{order.itemCount}</td>
                    <td className="px-4 py-3 font-semibold">{formatPrice(order.total)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDateTime(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={data.meta} onChange={setPage} />
        </>
      )}
    </div>
  );
}
