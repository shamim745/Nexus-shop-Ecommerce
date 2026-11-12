import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Banknote, CheckCircle2, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import {
  useCreateOrderMutation,
  useGetAddressesQuery,
  useGetCartQuery,
  useGetShippingSettingsQuery,
  useValidateCouponMutation,
} from "~/redux/api";
import { EmptyState, PageLoader } from "~/components";
import { errorMessage, formatPrice } from "~/utils/format";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { data: cart, isLoading: cartLoading } = useGetCartQuery();
  const { data: addresses, isLoading: addressesLoading } = useGetAddressesQuery();
  const { data: shipping } = useGetShippingSettingsQuery();
  const [createOrder, { isLoading: placing }] = useCreateOrderMutation();
  const [validateCoupon] = useValidateCouponMutation();

  const [addressId, setAddressId] = useState<string>("");
  const [useNew, setUseNew] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    line1: "",
    line2: "",
    area: "",
    city: "",
    postalCode: "",
  });
  const [note, setNote] = useState("");
  const [discount, setDiscount] = useState(0);
  const [discountMsg, setDiscountMsg] = useState<string | null>(null);

  const defaultAddress = addresses?.find((a) => a.isDefault) ?? addresses?.[0];

  useEffect(() => {
    if (defaultAddress && !addressId && !useNew) setAddressId(defaultAddress.id);
  }, [defaultAddress, addressId, useNew]);

  // Recompute coupon discount (already applied to cart)
  useEffect(() => {
    const run = async () => {
      if (!cart || !cart.couponCode || cart.subtotal <= 0) {
        setDiscount(0);
        return;
      }
      try {
        const result = await validateCoupon({
          code: cart.couponCode,
          subtotal: cart.subtotal,
        }).unwrap();
        if (result.valid) {
          setDiscount(result.discount ?? 0);
          setDiscountMsg(`Coupon ${result.code} applied`);
        } else {
          setDiscount(0);
          setDiscountMsg(result.message);
        }
      } catch {
        setDiscount(0);
      }
    };
    void run();
  }, [cart?.couponCode, cart?.subtotal, validateCoupon, cart]);

  if (cartLoading || addressesLoading) return <PageLoader label="Preparing checkout..." />;

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        action={
          <Link to="/products" className="btn-primary">
            Browse products
          </Link>
        }
      />
    );
  }

  const baseShipping = shipping?.shippingFee ?? 0;
  const threshold = shipping?.freeShippingThreshold ?? null;
  const shippingFee =
    threshold !== null && cart.subtotal >= threshold ? 0 : baseShipping;
  const total = Math.max(0, cart.subtotal - discount + shippingFee);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!useNew && !addressId) {
        toast.error("Please select a shipping address");
        return;
      }
      const order = await createOrder({
        address: useNew
          ? {
              name: form.name,
              phone: form.phone,
              line1: form.line1,
              line2: form.line2 || undefined,
              area: form.area || undefined,
              city: form.city,
              postalCode: form.postalCode || undefined,
            }
          : { addressId },
        note: note || undefined,
        couponCode: cart.couponCode ?? undefined,
      }).unwrap();
      toast.success("Order placed!");
      navigate(`/account/orders/${order.id}`, { replace: true });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
        <Banknote size={15} className="text-green-600" /> Cash on delivery only —
        pay when your order arrives.
      </p>

      <form onSubmit={submit} className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Address */}
          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
              <MapPin size={15} /> Shipping address
            </h2>

            {(addresses?.length ?? 0) > 0 && !useNew && (
              <div className="mt-4 space-y-2">
                {addresses!.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex cursor-pointer gap-3 rounded-lg border p-3.5 text-sm transition ${
                      addressId === addr.id
                        ? "border-indigo-600 bg-indigo-50/50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={addressId === addr.id}
                      onChange={() => setAddressId(addr.id)}
                      className="mt-1 text-indigo-600"
                    />
                    <span>
                      <span className="font-medium">
                        {addr.name} · {addr.phone}
                      </span>
                      <br />
                      <span className="text-gray-600">
                        {addr.line1}
                        {addr.line2 ? `, ${addr.line2}` : ""}
                        {addr.area ? `, ${addr.area}` : ""}, {addr.city}
                        {addr.postalCode ? ` - ${addr.postalCode}` : ""}
                      </span>
                      {addr.isDefault && (
                        <span className="ml-2 rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                          Default
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setUseNew((v) => !v)}
              className="mt-3 text-sm font-medium text-indigo-600 hover:underline"
            >
              {useNew ? "← Use a saved address" : "+ Ship to a new address"}
            </button>

            {useNew && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Full name *</label>
                  <input
                    required
                    className="input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Phone *</label>
                  <input
                    required
                    type="tel"
                    className="input"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Street address *</label>
                  <input
                    required
                    className="input"
                    placeholder="House, road"
                    value={form.line1}
                    onChange={(e) => setForm({ ...form, line1: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Apartment, floor (optional)</label>
                  <input
                    className="input"
                    value={form.line2}
                    onChange={(e) => setForm({ ...form, line2: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Area / Thana</label>
                  <input
                    className="input"
                    value={form.area}
                    onChange={(e) => setForm({ ...form, area: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">City *</label>
                  <input
                    required
                    className="input"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Postal code</label>
                  <input
                    className="input"
                    value={form.postalCode}
                    onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                  />
                </div>
              </div>
            )}
          </section>

          {/* Payment */}
          <section className="card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Payment method
            </h2>
            <label className="mt-4 flex items-center gap-3 rounded-lg border border-green-600 bg-green-50 p-3.5">
              <input type="radio" checked readOnly className="text-green-600" />
              <span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-green-800">
                  <Banknote size={15} /> Cash on Delivery
                </span>
                <span className="text-xs text-green-700">
                  Pay in cash when your order is delivered.
                </span>
              </span>
            </label>
          </section>

          {/* Note */}
          <section className="card p-5">
            <label htmlFor="note" className="label">
              Order note <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              id="note"
              rows={2}
              maxLength={500}
              className="input resize-none"
              placeholder="Delivery instructions..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </section>
        </div>

        {/* Summary */}
        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          <div className="card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Order summary
            </h2>
            <ul className="mt-4 space-y-3">
              {cart.items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-gray-700">
                    {item.name}
                    {item.variantLabel ? ` (${item.variantLabel})` : ""}{" "}
                    <span className="text-gray-400">× {item.qty}</span>
                  </span>
                  <span className="shrink-0 font-medium">
                    {formatPrice(item.lineTotal)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">Subtotal</dt>
                <dd className="font-medium">{formatPrice(cart.subtotal)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-700">
                  <dt>Discount ({cart.couponCode})</dt>
                  <dd>-{formatPrice(discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-600">Shipping</dt>
                <dd className="font-medium">
                  {shippingFee === 0 ? "Free" : formatPrice(shippingFee)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatPrice(total)}</dd>
              </div>
            </dl>

            {discountMsg && discount === 0 && (
              <p className="mt-2 text-xs text-amber-700">{discountMsg}</p>
            )}

            <button
              type="submit"
              disabled={placing}
              className="btn-primary mt-4 w-full"
            >
              {placing ? "Placing order..." : "Place order"}
            </button>
            <p className="mt-2 flex items-center justify-center gap-1 text-xs text-gray-500">
              <CheckCircle2 size={13} className="text-green-600" /> No online
              payment required
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
