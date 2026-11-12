import { useState } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  MapPin,
  Package,
  Phone,
  User,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAdminOrderQuery, useAdminUpdateOrderStatusMutation } from "~/redux/api";
import { EmptyState, PageLoader } from "~/components";
import { StatusBadge } from "~/components";
import { AdminPageHeader } from "./layout";
import { errorMessage, formatDateTime, formatPrice } from "~/utils/format";
import type { OrderStatus } from "~/types";

const NEXT: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

const ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  PROCESSING: "Mark processing",
  SHIPPED: "Mark shipped",
  DELIVERED: "Mark delivered",
  CANCELLED: "Cancel order",
};

export default function AdminOrderDetailPage() {
  const { id = "" } = useParams();
  const { data: order, isLoading, isError } = useAdminOrderQuery(id);
  const [updateStatus, { isLoading: saving }] = useAdminUpdateOrderStatusMutation();
  const [note, setNote] = useState("");
  const [markPaid, setMarkPaid] = useState(false);
  const [pending, setPending] = useState<OrderStatus | null>(null);

  if (isLoading) return <PageLoader label="Loading order..." />;
  if (isError || !order)
    return <EmptyState title="Order not found" description="It may have been deleted." />;

  const actions = NEXT[order.status];

  const apply = async (status: OrderStatus) => {
    try {
      await updateStatus({
        id: order.id,
        status,
        note: note || undefined,
        markPaid: status === "DELIVERED" ? undefined : markPaid,
      }).unwrap();
      toast.success(`Order ${status.toLowerCase()}`);
      setPending(null);
      setNote("");
      setMarkPaid(false);
    } catch (error) {
      toast.error(errorMessage(error));
      setPending(null);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        to="/admin/orders"
        className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft size={15} /> Back to orders
      </Link>

      <AdminPageHeader
        title={order.orderNumber}
        description={`Placed ${formatDateTime(order.createdAt)} by ${order.user?.name ?? order.shippingName}`}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
            <StatusBadge status={order.paymentStatus} />
          </div>
        }
      />

      {/* Status actions */}
      {actions.length > 0 && (
        <section className="card border-indigo-100 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Update status
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <label className="label">Note (optional, shown in tracking)</label>
              <input
                className="input"
                maxLength={300}
                placeholder="e.g. Handed to courier, rider Rakib"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {actions.map((status) => {
                const danger = status === "CANCELLED";
                const confirm = pending === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => (confirm ? apply(status) : setPending(status))}
                    disabled={saving}
                    className={
                      confirm
                        ? "rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                        : danger
                          ? "btn-danger text-sm"
                          : "btn-primary text-sm"
                    }
                  >
                    {confirm ? "Confirm?" : ACTION_LABEL[status]}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="mt-3 flex w-fit cursor-pointer items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={markPaid}
              onChange={(e) => setMarkPaid(e.target.checked)}
              className="text-indigo-600"
            />
            Also mark payment as paid
          </label>
        </section>
      )}

      {order.status === "CANCELLED" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Cancelled: {order.cancelReason ?? "no reason given"}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
              <Package size={15} /> Items
            </h2>
            <ul className="mt-3 divide-y divide-gray-100">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 py-3 first:pt-0">
                  <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt="" className="size-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.variantLabel ? `${item.variantLabel} · ` : ""}
                      {item.sku ? `SKU ${item.sku} · ` : ""}
                      {formatPrice(item.unitPrice)} × {item.qty}
                    </p>
                  </div>
                  <span className="text-sm font-semibold">{formatPrice(item.total)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
              <Package size={15} /> Tracking history
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {order.history?.length ? (
                [...order.history].reverse().map((h) => (
                  <li key={h.id} className="flex justify-between gap-3">
                    <span>
                      <StatusBadge status={h.status} />
                      {h.note && <span className="ml-2 text-gray-500">{h.note}</span>}
                    </span>
                    <span className="shrink-0 text-xs text-gray-400">
                      {formatDateTime(h.createdAt)}
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-gray-400">No history.</li>
              )}
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
              <User size={15} /> Customer
            </h2>
            <div className="mt-3 text-sm">
              <p className="font-medium">{order.user?.name ?? order.shippingName}</p>
              <p className="text-gray-600">{order.user?.email}</p>
              <p className="mt-1 flex items-center gap-1 text-gray-600">
                <Phone size={13} /> {order.shippingPhone}
              </p>
            </div>
            <h3 className="mt-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <MapPin size={13} /> Ship to
            </h3>
            <p className="mt-1.5 text-sm text-gray-600">
              {order.shippingLine1}
              {order.shippingLine2 ? `, ${order.shippingLine2}` : ""}
              {order.shippingArea ? `, ${order.shippingArea}` : ""}, {order.shippingCity}
              {order.shippingPostal ? ` - ${order.shippingPostal}` : ""}
            </p>
            {order.note && (
              <p className="mt-3 rounded-lg bg-gray-50 p-2.5 text-xs text-gray-600">
                Order note: {order.note}
              </p>
            )}
          </section>

          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
              <Banknote size={15} /> Payment summary
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">Subtotal</dt>
                <dd>{formatPrice(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-700">
                  <dt>Discount {order.couponCode && `(${order.couponCode})`}</dt>
                  <dd>-{formatPrice(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-600">Shipping</dt>
                <dd>{order.shippingFee === 0 ? "Free" : formatPrice(order.shippingFee)}</dd>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-semibold">
                <dt>Total (COD)</dt>
                <dd>{formatPrice(order.total)}</dd>
              </div>
            </dl>
            {order.paymentStatus === "UNPAID" && order.status === "DELIVERED" && (
              <p className="mt-3 flex items-center gap-1 text-xs text-amber-700">
                <CheckCircle2 size={13} /> Delivered but payment not marked paid.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
