import { Link } from "react-router";
import { Package } from "lucide-react";
import { useGetMyOrdersQuery } from "~/redux/api";
import { EmptyState, PageLoader } from "~/components";
import { Pagination } from "~/components";
import { StatusBadge } from "~/components";
import { formatDateTime, formatPrice } from "~/utils/format";
import { useState } from "react";

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetMyOrdersQuery({ page, limit: 10 });

  if (isLoading) return <PageLoader label="Loading orders..." />;

  if (!data || data.items.length === 0) {
    return (
      <EmptyState
        title="No orders yet"
        description="When you place an order it will show up here with live tracking."
        action={
          <Link to="/products" className="btn-primary">
            Start shopping
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {data.items.map((order) => (
          <li key={order.id}>
            <Link
              to={`/account/orders/${order.id}`}
              className="card flex flex-wrap items-center justify-between gap-4 p-4 transition hover:border-indigo-300 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Package size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold">{order.orderNumber}</p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(order.createdAt)} ·{" "}
                    {order.itemCount ?? order.items.length} item(s)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold">{formatPrice(order.total)}</span>
                <StatusBadge status={order.status} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <Pagination meta={data.meta} onChange={setPage} />
    </div>
  );
}
