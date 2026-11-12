import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  useAdminCouponsQuery,
  useAdminCreateCouponMutation,
  useAdminDeleteCouponMutation,
  useAdminUpdateCouponMutation,
} from "~/redux/api";
import { EmptyState, PageLoader } from "~/components";
import { Pagination } from "~/components";
import { AdminPageHeader } from "./layout";
import type { Coupon } from "~/types";
import { errorMessage, formatDate } from "~/utils/format";

const EMPTY = {
  code: "",
  type: "PERCENT" as "PERCENT" | "FIXED",
  value: "",
  minPurchase: "",
  expiresAt: "",
  usageLimit: "",
  perUserLimit: "1",
  isActive: true,
};

export default function AdminCouponsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminCouponsQuery({ page, limit: 20 });
  const [createCoupon] = useAdminCreateCouponMutation();
  const [updateCoupon] = useAdminUpdateCouponMutation();
  const [deleteCoupon] = useAdminDeleteCouponMutation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY);
    setShowForm(true);
  };

  const openEdit = (c: Coupon) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      type: c.type,
      value: String(c.value),
      minPurchase: c.minPurchase ? String(c.minPurchase) : "",
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : "",
      usageLimit: c.usageLimit != null ? String(c.usageLimit) : "",
      perUserLimit: String(c.perUserLimit ?? 1),
      isActive: c.isActive,
    });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(form.value);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter a valid discount value");
      return;
    }
    if (form.type === "PERCENT" && value > 100) {
      toast.error("Percent discount cannot exceed 100");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code: form.code.toUpperCase(),
        type: form.type,
        value,
        minPurchase: form.minPurchase ? Number(form.minPurchase) : undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        perUserLimit: Number(form.perUserLimit) || 1,
        isActive: form.isActive,
      };
      if (editingId) {
        await updateCoupon({ id: editingId, ...payload }).unwrap();
        toast.success("Coupon updated");
      } else {
        await createCoupon(payload).unwrap();
        toast.success("Coupon created");
      }
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteCoupon(id).unwrap();
      toast.success("Coupon deleted");
      setPendingDelete(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const expired = (c: Coupon) => !!c.expiresAt && new Date(c.expiresAt) < new Date();

  return (
    <div>
      <AdminPageHeader
        title="Coupons"
        description={data ? `${data.meta.total} coupon(s)` : undefined}
        action={
          !showForm && (
            <button type="button" onClick={openCreate} className="btn-primary text-sm">
              <Plus size={15} /> New coupon
            </button>
          )
        }
      />

      {showForm && (
        <form onSubmit={save} className="card mb-6 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              {editingId ? "Edit coupon" : "New coupon"}
            </h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label">Code *</label>
              <input
                required
                className="input uppercase"
                maxLength={30}
                pattern="[A-Za-z0-9_-]{3,30}"
                placeholder="SUMMER20"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Type *</label>
              <select
                className="input"
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as "PERCENT" | "FIXED" })
                }
              >
                <option value="PERCENT">Percentage (%)</option>
                <option value="FIXED">Fixed amount</option>
              </select>
            </div>
            <div>
              <label className="label">
                Value *{form.type === "PERCENT" ? " (%)" : " (৳)"}
              </label>
              <input
                required
                type="number"
                min="0.01"
                max={form.type === "PERCENT" ? 100 : undefined}
                step="0.01"
                className="input"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Min purchase (৳)</label>
              <input
                type="number"
                min="0"
                className="input"
                value={form.minPurchase}
                onChange={(e) => setForm({ ...form, minPurchase: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Expires</label>
              <input
                type="date"
                className="input"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Total usage limit</label>
              <input
                type="number"
                min="1"
                className="input"
                placeholder="unlimited"
                value={form.usageLimit}
                onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Per-customer limit</label>
              <input
                type="number"
                min="1"
                className="input"
                value={form.perUserLimit}
                onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })}
              />
            </div>
          </div>
          <label className="mt-3 flex w-fit cursor-pointer items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="text-indigo-600"
            />
            Active
          </label>
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving..." : editingId ? "Save changes" : "Create"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <PageLoader label="Loading coupons..." />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="No coupons"
          description="Create discount codes for promotions."
          action={
            <button type="button" onClick={openCreate} className="btn-primary">
              New coupon
            </button>
          }
        />
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Discount</th>
                  <th className="px-4 py-3">Min purchase</th>
                  <th className="px-4 py-3">Used</th>
                  <th className="px-4 py-3">Expires</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-semibold">{c.code}</td>
                    <td className="px-4 py-3">
                      {c.type === "PERCENT" ? `${c.value}% off` : `${c.value} ৳ off`}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.minPurchase ? `${c.minPurchase} ৳` : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.usedCount ?? 0}
                      {c.usageLimit != null && ` / ${c.usageLimit}`}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.expiresAt ? formatDate(c.expiresAt) : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          !c.isActive
                            ? "bg-gray-100 text-gray-500"
                            : expired(c)
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                        }`}
                      >
                        {!c.isActive ? "Disabled" : expired(c) ? "Expired" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                          aria-label="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        {pendingDelete === c.id ? (
                          <button
                            type="button"
                            onClick={() => remove(c.id)}
                            className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700"
                          >
                            Confirm
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPendingDelete(c.id)}
                            className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                            aria-label="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
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
