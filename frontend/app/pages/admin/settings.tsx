import { useEffect, useState } from "react";
import { Banknote, Truck } from "lucide-react";
import toast from "react-hot-toast";
import { useAdminGetSettingsQuery, useAdminUpdateSettingsMutation } from "~/redux/api";
import { PageLoader } from "~/components";
import { AdminPageHeader } from "./layout";
import { errorMessage, formatPrice } from "~/utils/format";

export default function AdminSettingsPage() {
  const { data, isLoading } = useAdminGetSettingsQuery();
  const [updateSettings, { isLoading: saving }] = useAdminUpdateSettingsMutation();
  const [form, setForm] = useState({ shippingFee: "", freeShippingThreshold: "" });

  useEffect(() => {
    if (!data) return;
    setForm({
      shippingFee: String(data.shippingFee),
      freeShippingThreshold:
        data.freeShippingThreshold != null ? String(data.freeShippingThreshold) : "",
    });
  }, [data]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const shippingFee = Number(form.shippingFee);
    if (!Number.isFinite(shippingFee) || shippingFee < 0) {
      toast.error("Enter a valid shipping fee");
      return;
    }
    const thresholdRaw = form.freeShippingThreshold.trim();
    const freeShippingThreshold =
      thresholdRaw === "" ? null : Number(thresholdRaw);
    if (thresholdRaw !== "" && (!Number.isFinite(freeShippingThreshold as number) || (freeShippingThreshold as number) < 0)) {
      toast.error("Enter a valid free-shipping threshold");
      return;
    }
    if (freeShippingThreshold !== null && (freeShippingThreshold as number) <= shippingFee) {
      toast.error("Threshold should be higher than the shipping fee");
      return;
    }
    try {
      await updateSettings({ shippingFee, freeShippingThreshold }).unwrap();
      toast.success("Settings saved");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  if (isLoading) return <PageLoader label="Loading settings..." />;

  return (
    <div className="max-w-xl">
      <AdminPageHeader
        title="Store settings"
        description="Configure shipping behaviour for checkout"
      />

      <form onSubmit={save} className="card space-y-5 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          <Truck size={15} /> Shipping
        </div>

        <div>
          <label htmlFor="shippingFee" className="label">
            Shipping fee (৳)
          </label>
          <input
            id="shippingFee"
            type="number"
            min="0"
            step="0.01"
            required
            className="input"
            value={form.shippingFee}
            onChange={(e) => setForm({ ...form, shippingFee: e.target.value })}
          />
          <p className="mt-1.5 text-xs text-gray-500">
            Charged on every order. With the current settings customers pay{" "}
            <span className="font-medium">
              {form.shippingFee !== "" && !Number.isNaN(Number(form.shippingFee))
                ? formatPrice(Number(form.shippingFee))
                : "—"}
            </span>{" "}
            for shipping.
          </p>
        </div>

        <div>
          <label htmlFor="threshold" className="label">
            Free-shipping threshold (৳){" "}
            <span className="text-gray-400">(optional)</span>
          </label>
          <input
            id="threshold"
            type="number"
            min="0"
            step="0.01"
            className="input"
            placeholder="Leave empty to always charge"
            value={form.freeShippingThreshold}
            onChange={(e) =>
              setForm({ ...form, freeShippingThreshold: e.target.value })
            }
          />
          <p className="mt-1.5 text-xs text-gray-500">
            When subtotal reaches this amount shipping becomes free. Empty = never
            free.
          </p>
        </div>

        <div className="rounded-lg bg-indigo-50 p-3.5 text-sm text-indigo-800">
          <p className="flex items-center gap-1.5 font-medium">
            <Banknote size={15} /> Preview
          </p>
          <p className="mt-1">
            Subtotal ৳1,000 → shipping{" "}
            {form.shippingFee !== "" && !Number.isNaN(Number(form.shippingFee))
              ? formatPrice(Number(form.shippingFee))
              : "—"}
            {form.freeShippingThreshold &&
              ` · subtotal ${formatPrice(Number(form.freeShippingThreshold) || 0)}+ → free`}
          </p>
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving..." : "Save settings"}
        </button>

        {data?.updatedAt && (
          <p className="text-xs text-gray-400">
            Last updated {new Date(data.updatedAt).toLocaleString()}
          </p>
        )}
      </form>
    </div>
  );
}
