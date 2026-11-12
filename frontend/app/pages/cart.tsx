import { Link, useNavigate } from "react-router";
import { Minus, Plus, ShoppingCart, Trash2, Tag, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  useGetCartQuery,
  useRemoveCartItemMutation,
  useSetCartCouponMutation,
  useUpdateCartItemMutation,
  useValidateCouponMutation,
} from "~/redux/api";
import { EmptyState, PageLoader } from "~/components";
import { errorMessage, formatPrice } from "~/utils/format";
import { useGetShippingSettingsQuery } from "~/redux/api";

export default function CartPage() {
  const { data: cart, isLoading } = useGetCartQuery();
  const { data: shipping } = useGetShippingSettingsQuery();
  const [updateItem] = useUpdateCartItemMutation();
  const [removeItem] = useRemoveCartItemMutation();
  const [setCoupon] = useSetCartCouponMutation();
  const [validateCoupon] = useValidateCouponMutation();
  const [code, setCode] = useState("");
  const [quoteMsg, setQuoteMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  if (isLoading) return <PageLoader label="Loading cart..." />;

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Browse the store and add something you love."
        action={
          <Link to="/products" className="btn-primary">
            Start shopping
          </Link>
        }
      />
    );
  }

  const changeQty = async (id: string, qty: number) => {
    try {
      await updateItem({ id, qty }).unwrap();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const remove = async (id: string) => {
    try {
      await removeItem(id).unwrap();
      toast.success("Removed from cart");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const applyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    try {
      const result = await validateCoupon({
        code: code.trim(),
        subtotal: cart.subtotal,
      }).unwrap();
      if (result.valid) {
        await setCoupon(result.code ?? code.trim().toUpperCase()).unwrap();
        setQuoteMsg(`Coupon applied — you save ${formatPrice(result.discount ?? 0)}`);
        toast.success("Coupon applied");
      } else {
        setQuoteMsg(result.message);
        toast.error(result.message);
      }
    } catch (error) {
      const msg = errorMessage(error);
      setQuoteMsg(msg);
      toast.error(msg);
    }
  };

  const clearCoupon = async () => {
    await setCoupon(null).unwrap();
    setCode("");
    setQuoteMsg(null);
  };

  const applyThreshold = shipping?.freeShippingThreshold;
  const remainingForFree =
    applyThreshold != null && cart.subtotal < applyThreshold
      ? applyThreshold - cart.subtotal
      : 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Shopping cart</h1>
        <p className="mt-1 text-sm text-gray-500">{cart.itemCount} item(s)</p>

        <ul className="mt-6 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          {cart.items.map((item) => (
            <li key={item.id} className="flex gap-4 p-4">
              <Link
                to={`/products/${item.slug}`}
                className="size-20 shrink-0 overflow-hidden rounded-lg bg-gray-100"
              >
                {item.image ? (
                  <img src={item.image} alt={item.name} className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center text-xs text-gray-400">
                    No img
                  </div>
                )}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      to={`/products/${item.slug}`}
                      className="line-clamp-1 text-sm font-medium text-gray-900 hover:text-indigo-600"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {item.variantLabel && `${item.variantLabel} · `}
                      {item.sku && `SKU ${item.sku}`}
                    </p>
                    {!item.inStock && (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        Only {item.available} left
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-lg border border-gray-300">
                    <button
                      type="button"
                      onClick={() => changeQty(item.id, Math.max(1, item.qty - 1))}
                      disabled={item.qty <= 1}
                      className="p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                      aria-label="Decrease"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => changeQty(item.id, Math.min(item.available, item.qty + 1))}
                      disabled={item.qty >= item.available}
                      className="p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                      aria-label="Increase"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <span className="text-sm font-semibold">
                    {formatPrice(item.lineTotal)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Summary */}
      <aside className="h-fit space-y-4 lg:sticky lg:top-24">
        <div className="card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Order summary
          </h2>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">Subtotal</dt>
              <dd className="font-medium">{formatPrice(cart.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Shipping</dt>
              <dd className="font-medium">
                {shipping && shipping.shippingFee > 0
                  ? formatPrice(shipping.shippingFee)
                  : "Free"}
              </dd>
            </div>
            {cart.couponCode && (
              <div className="flex justify-between text-green-700">
                <dt className="flex items-center gap-1">
                  <Tag size={13} /> {cart.couponCode}
                </dt>
                <dd>
                  <button
                    type="button"
                    onClick={clearCoupon}
                    className="ml-1 text-xs underline"
                  >
                    remove
                  </button>
                </dd>
              </div>
            )}
          </dl>

          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="text-sm text-gray-500">
              Shipping fee is confirmed at checkout.
            </p>
          </div>

          {remainingForFree > 0 && (
            <p className="mt-3 rounded-lg bg-indigo-50 p-2.5 text-xs text-indigo-700">
              Add {formatPrice(remainingForFree)} more to get free shipping.
            </p>
          )}

          <button
            type="button"
            onClick={() => navigate("/checkout")}
            className="btn-primary mt-4 w-full"
          >
            <ShoppingCart size={16} /> Proceed to checkout
          </button>

          <Link
            to="/products"
            className="mt-2 block text-center text-sm font-medium text-indigo-600 hover:underline"
          >
            Continue shopping
          </Link>
        </div>

        <form onSubmit={applyCoupon} className="card p-5">
          <label htmlFor="coupon" className="label flex items-center gap-1.5">
            <Tag size={14} /> Coupon code
          </label>
          <div className="flex gap-2">
            <input
              id="coupon"
              className="input uppercase"
              placeholder="WELCOME10"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button type="submit" className="btn-secondary shrink-0">
              Apply
            </button>
          </div>
          {quoteMsg && (
            <p className="mt-2 flex items-start justify-between text-xs text-gray-600">
              {quoteMsg}
              <button type="button" onClick={() => setQuoteMsg(null)} aria-label="Dismiss">
                <X size={12} />
              </button>
            </p>
          )}
        </form>
      </aside>
    </div>
  );
}
