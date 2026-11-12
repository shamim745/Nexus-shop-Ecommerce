import { Link, useParams } from "react-router";
import {
  Banknote,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Package,
  Phone,
  Repeat2,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  useCancelOrderMutation,
  useGetOrderQuery,
  useReorderMutation,
} from "~/redux/api";
import { EmptyState, PageLoader } from "~/components";
import { StatusBadge } from "~/components";
import { errorMessage, formatDateTime, formatPrice } from "~/utils/format";
import { useNavigate } from "react-router";

const TRACKING_STEPS = [
  { key: "PENDING", label: "Order placed" },
  { key: "PROCESSING", label: "Processing" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "DELIVERED", label: "Delivered" },
];

const STEP_INDEX: Record<string, number> = {
  PENDING: 0,
  PROCESSING: 1,
  SHIPPED: 2,
  DELIVERED: 3,
};

export default function OrderDetailPage() {
  const { orderId = "" } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading, isError } = useGetOrderQuery(orderId);
  const [cancelOrder, { isLoading: cancelling }] = useCancelOrderMutation();
  const [reorder, { isLoading: reordering }] = useReorderMutation();
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (isLoading) return <PageLoader label="Loading order..." />;
  if (isError || !order)
    return <EmptyState title="Order not found" description="Check the link or go to your orders." />;

  const cancelable = order.status === "PENDING" || order.status === "PROCESSING";
  const stepIndex = STEP_INDEX[order.status];

  const cancel = async () => {
    try {
      await cancelOrder({ id: order.id }).unwrap();
      toast.success("Order cancelled");
      setConfirmCancel(false);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const doReorder = async () => {
    try {
      await reorder(order.id).unwrap();
      toast.success("Items added to cart");
      navigate("/cart");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{order.orderNumber}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Placed on {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={doReorder}
            disabled={reordering}
            className="btn-secondary text-sm"
          >
            <Repeat2 size={15} /> {reordering ? "Adding..." : "Reorder"}
          </button>
          {cancelable && !confirmCancel && (
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              className="btn-danger text-sm"
            >
              Cancel order
            </button>
          )}
          {confirmCancel && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-1.5 text-sm">
              <span className="px-1 text-red-700">Cancel this order?</span>
              <button
                type="button"
                onClick={cancel}
                disabled={cancelling}
                className="rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {cancelling ? "..." : "Yes, cancel"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmCancel(false)}
                className="rounded px-2 py-1.5 text-xs text-gray-600 hover:bg-red-100"
              >
                Keep
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tracking */}
      {order.status !== "CANCELLED" && (
        <section className="card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            <Package size={15} /> Tracking
          </h2>
          <ol className="mt-5 flex">
            {TRACKING_STEPS.map((step, i) => {
              const done = i <= stepIndex;
              return (
                <li key={step.key} className="flex-1 last:flex-none">
                  <div className="flex items-center">
                    <span
                      className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        done
                          ? "bg-indigo-600 text-white"
                          : "border-2 border-gray-200 bg-white text-gray-400"
                      }`}
                    >
                      {done ? <CheckCircle2 size={14} /> : i + 1}
                    </span>
                    {i < TRACKING_STEPS.length - 1 && (
                      <span
                        className={`h-0.5 flex-1 ${
                          i < stepIndex ? "bg-indigo-600" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                  <p
                    className={`mt-1.5 text-xs ${
                      done ? "font-semibold text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </p>
                </li>
              );
            })}
          </ol>

          {(order.history?.length ?? 0) > 0 && (
            <ul className="mt-5 space-y-1.5 border-t border-gray-100 pt-4 text-xs text-gray-600">
              {[...(order.history ?? [])].reverse().map((h) => (
                <li key={h.id} className="flex justify-between">
                  <span>
                    {h.status}{" "}
                    {h.note && <span className="text-gray-400">— {h.note}</span>}
                  </span>
                  <span className="text-gray-400">{formatDateTime(h.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {order.status === "CANCELLED" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          This order was cancelled
          {order.cancelReason && `: ${order.cancelReason}`}.
        </div>
      )}

      {/* Items */}
      <section className="card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Items
        </h2>
        <ul className="mt-4 divide-y divide-gray-100">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-3 first:pt-0">
              <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="size-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium">{item.name}</p>
                <p className="text-xs text-gray-500">
                  {item.variantLabel ? `${item.variantLabel} · ` : ""}
                  {formatPrice(item.unitPrice)} × {item.qty}
                </p>
              </div>
              <span className="text-sm font-semibold">{formatPrice(item.total)}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            <MapPin size={15} /> Shipping address
          </h2>
          <div className="mt-3 text-sm text-gray-700">
            <p className="font-semibold">{order.shippingName}</p>
            <p className="mt-0.5 flex items-center gap-1 text-gray-600">
              <Phone size={13} /> {order.shippingPhone}
            </p>
            <p className="mt-1.5 text-gray-600">
              {order.shippingLine1}
              {order.shippingLine2 ? `, ${order.shippingLine2}` : ""}
              {order.shippingArea ? `, ${order.shippingArea}` : ""}, {order.shippingCity}
              {order.shippingPostal ? ` - ${order.shippingPostal}` : ""}
            </p>
          </div>
          {order.note && (
            <p className="mt-3 rounded-lg bg-gray-50 p-2.5 text-xs text-gray-600">
              Note: {order.note}
            </p>
          )}
        </section>

        <section className="card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            <Banknote size={15} /> Payment
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
              <dt>Total</dt>
              <dd>{formatPrice(order.total)}</dd>
            </div>
          </dl>
          <div className="mt-3 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs">
            <span className="text-gray-600">Method: Cash on delivery</span>
            <StatusBadge status={order.paymentStatus} />
          </div>
          {order.status === "DELIVERED" && (
            <p className="mt-3 flex items-center gap-1 text-xs text-green-700">
              <CheckCircle2 size={13} /> Delivered — thank you!{" "}
              <Link to="/products" className="font-medium underline">
                Shop again
              </Link>
              <ChevronRight size={13} />
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
