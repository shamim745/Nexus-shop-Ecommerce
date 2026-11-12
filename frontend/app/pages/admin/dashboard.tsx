import { Link } from "react-router";
import { AlertTriangle, Boxes, IndianRupee, Package, ShoppingBag, Users } from "lucide-react";
import { useAdminDashboardQuery } from "~/redux/api";
import { PageLoader } from "~/components";
import { StatusBadge } from "~/components";
import { AdminPageHeader } from "./layout";
import { formatDateTime, formatPrice } from "~/utils/format";

const STATUS_LABELS: Array<{ key: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED"; label: string }> = [
  { key: "PENDING", label: "Pending" },
  { key: "PROCESSING", label: "Processing" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "CANCELLED", label: "Cancelled" },
];

export default function AdminDashboardPage() {
  const { data, isLoading } = useAdminDashboardQuery();

  if (isLoading || !data) return <PageLoader label="Loading dashboard..." />;

  const maxRevenue = Math.max(1, ...data.revenueChart.map((r) => r.revenue));

  const stats = [
    { label: "Total sales", value: formatPrice(data.totals.sales), icon: IndianRupee, tint: "bg-green-50 text-green-600" },
    { label: "Orders", value: data.totals.orders, icon: ShoppingBag, tint: "bg-blue-50 text-blue-600" },
    { label: "Customers", value: data.totals.customers, icon: Users, tint: "bg-indigo-50 text-indigo-600" },
    { label: "Products", value: data.totals.products, icon: Boxes, tint: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Dashboard" description="Store performance at a glance" />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card flex items-center gap-3 p-4">
            <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${s.tint}`}>
              <s.icon size={18} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs text-gray-500">{s.label}</p>
              <p className="truncate text-lg font-semibold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* Revenue chart */}
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Revenue (last 12 months)
            </h2>
            <span className="text-xs text-gray-400">BDT</span>
          </div>
          <div className="mt-5 flex h-44 items-end gap-2">
            {data.revenueChart.length === 0 && (
              <p className="self-center text-sm text-gray-400">No sales data yet.</p>
            )}
            {data.revenueChart.map((r) => (
              <div key={r.month} className="group flex flex-1 flex-col items-center gap-1">
                <div className="relative w-full flex-1">
                  <div
                    className="absolute bottom-0 w-full rounded-t bg-indigo-500 transition-all group-hover:bg-indigo-600"
                    style={{ height: `${Math.max(3, (r.revenue / maxRevenue) * 100)}%` }}
                  />
                  <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-1.5 py-0.5 text-[10px] text-white group-hover:block">
                    {formatPrice(r.revenue)} · {r.orders} orders
                  </span>
                </div>
                <span className="text-[10px] text-gray-400">{r.month}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Status counts */}
        <section className="card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Orders by status
          </h2>
          <ul className="mt-4 space-y-3">
            {STATUS_LABELS.map(({ key, label }) => {
              const count = data.statusCounts[key] ?? 0;
              const pct = data.totals.orders > 0 ? (count / data.totals.orders) * 100 : 0;
              return (
                <li key={key}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${
                        key === "DELIVERED"
                          ? "bg-green-500"
                          : key === "CANCELLED"
                            ? "bg-red-400"
                            : "bg-indigo-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* Recent orders */}
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Recent orders
            </h2>
            <Link to="/admin/orders" className="text-xs font-medium text-indigo-600 hover:underline">
              View all
            </Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <p className="mt-4 text-sm text-gray-400">No orders yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-gray-100">
              {data.recentOrders.map((o) => (
                <li key={o.id}>
                  <Link
                    to={`/admin/orders/${o.id}`}
                    className="flex items-center justify-between gap-3 py-2.5 hover:bg-gray-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{o.orderNumber}</p>
                      <p className="truncate text-xs text-gray-500">
                        {o.user?.name ?? "Customer"} · {formatDateTime(o.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-sm font-semibold">{formatPrice(o.total)}</span>
                      <StatusBadge status={o.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Low stock */}
        <section className="card p-5">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-gray-500">
            <AlertTriangle size={14} className="text-amber-500" /> Low stock
          </h2>
          {data.lowStock.length === 0 ? (
            <p className="mt-4 flex items-center gap-1.5 text-sm text-green-700">
              <Package size={14} /> All products sufficiently stocked.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-gray-100">
              {data.lowStock.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2.5">
                  <span className="size-9 shrink-0 overflow-hidden rounded bg-gray-100">
                    {p.images[0] && (
                      <img src={p.images[0].url} alt="" className="size-full object-cover" />
                    )}
                  </span>
                  <Link
                    to={`/admin/products/${p.id}`}
                    className="min-w-0 flex-1 truncate text-sm font-medium hover:text-indigo-600"
                  >
                    {p.name}
                  </Link>
                  <span className="shrink-0 rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                    {p.stock} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
