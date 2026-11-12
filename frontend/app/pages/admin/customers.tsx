import { useState } from "react";
import { Link } from "react-router";
import { Ban, CheckCircle, Search, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  useAdminCustomerQuery,
  useAdminCustomersQuery,
  useAdminSetCustomerBlockedMutation,
} from "~/redux/api";
import { EmptyState, PageLoader } from "~/components";
import { Pagination } from "~/components";
import { StatusBadge } from "~/components";
import { AdminPageHeader } from "./layout";
import { errorMessage, formatDate, formatDateTime, formatPrice } from "~/utils/format";

export default function AdminCustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useAdminCustomersQuery({
    page,
    limit: 20,
    search: search || undefined,
  });
  const { data: detail, isLoading: loadingDetail } = useAdminCustomerQuery(
    selectedId ?? "",
    { skip: !selectedId },
  );
  const [setBlocked, { isLoading: blocking }] = useAdminSetCustomerBlockedMutation();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(input.trim());
  };

  const toggleBlock = async (id: string, blocked: boolean) => {
    try {
      await setBlocked({ id, blocked }).unwrap();
      toast.success(blocked ? "Customer blocked" : "Customer unblocked");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Customers"
        description={data ? `${data.meta.total} registered customer(s)` : undefined}
      />

      <form onSubmit={submit} className="relative mb-4 max-w-xs">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          className="input pl-9"
          placeholder="Name, email or phone..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </form>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          {isLoading ? (
            <PageLoader label="Loading customers..." />
          ) : !data || data.items.length === 0 ? (
            <EmptyState title="No customers found" />
          ) : (
            <>
              <div className="card overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Orders</th>
                      <th className="px-4 py-3">Joined</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.items.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedId(c.id)}
                        className={`cursor-pointer hover:bg-gray-50 ${
                          selectedId === c.id ? "bg-indigo-50/50" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium">{c.name}</p>
                          <p className="text-xs text-gray-500">{c.email}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{c.phone ?? "—"}</td>
                        <td className="px-4 py-3 text-gray-600">{c.orderCount}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {formatDate(c.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              c.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {c.isActive ? "Active" : "Blocked"}
                          </span>
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

        {/* Detail panel */}
        <aside className="h-fit lg:sticky lg:top-24">
          {!selectedId ? (
            <div className="card p-5 text-sm text-gray-500">
              Select a customer to see their addresses and recent orders.
            </div>
          ) : loadingDetail || !detail ? (
            <div className="card p-5">
              <PageLoader label="Loading customer..." />
            </div>
          ) : (
            <div className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold">{detail.name}</h2>
                  <p className="text-sm text-gray-500">{detail.email}</p>
                  <p className="text-sm text-gray-500">{detail.phone ?? "No phone"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs">
                <span>Joined {formatDate(detail.createdAt)}</span>
                <span
                  className={`font-semibold ${detail.isActive ? "text-green-700" : "text-red-600"}`}
                >
                  {detail.isActive ? "Active" : "Blocked"}
                </span>
              </div>

              <button
                type="button"
                disabled={blocking || detail.role === "ADMIN"}
                onClick={() => toggleBlock(detail.id, detail.isActive)}
                className={`mt-3 w-full text-sm disabled:opacity-50 ${
                  detail.isActive ? "btn-danger" : "btn-primary"
                }`}
                title={detail.role === "ADMIN" ? "Admins can't be blocked" : undefined}
              >
                {detail.isActive ? (
                  <>
                    <Ban size={14} /> Block customer
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} /> Unblock customer
                  </>
                )}
              </button>

              {detail.addresses.length > 0 && (
                <>
                  <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Addresses
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {detail.addresses.map((a) => (
                      <li key={a.id} className="rounded-lg border border-gray-100 p-2.5 text-xs">
                        <p className="font-medium">
                          {a.name} · {a.phone}
                          {a.isDefault && (
                            <span className="ml-1 rounded bg-indigo-100 px-1 py-0.5 text-[9px] text-indigo-700">
                              Default
                            </span>
                          )}
                        </p>
                        <p className="text-gray-600">
                          {a.line1}
                          {a.line2 ? `, ${a.line2}` : ""}, {a.city}
                        </p>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Recent orders
              </h3>
              {detail.orders.length === 0 ? (
                <p className="mt-2 text-sm text-gray-400">No orders yet.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {detail.orders.map((o) => (
                    <li key={o.id}>
                      <Link
                        to={`/admin/orders/${o.id}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 p-2.5 text-xs hover:border-indigo-200 hover:bg-indigo-50/40"
                      >
                        <div>
                          <p className="font-medium">{o.orderNumber}</p>
                          <p className="text-gray-500">{formatDateTime(o.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatPrice(o.total)}</p>
                          <StatusBadge status={o.status} />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
