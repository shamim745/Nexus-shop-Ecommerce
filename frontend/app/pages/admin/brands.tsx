import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  useAdminBrandsQuery,
  useAdminCreateBrandMutation,
  useAdminDeleteBrandMutation,
  useAdminUpdateBrandMutation,
} from "~/redux/api";
import { EmptyState, PageLoader } from "~/components";
import { AdminPageHeader } from "./layout";
import { errorMessage } from "~/utils/format";
import type { Brand } from "~/types";

const EMPTY = { name: "", slug: "", imageUrl: "", isActive: true };

export default function AdminBrandsPage() {
  const { data, isLoading } = useAdminBrandsQuery();
  const [createBrand] = useAdminCreateBrandMutation();
  const [updateBrand] = useAdminUpdateBrandMutation();
  const [deleteBrand] = useAdminDeleteBrandMutation();

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

  const openEdit = (brand: Brand) => {
    setEditingId(brand.id);
    setForm({
      name: brand.name,
      slug: brand.slug,
      imageUrl: brand.imageUrl ?? "",
      isActive: brand.isActive ?? true,
    });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug || undefined,
        imageUrl: form.imageUrl || undefined,
        isActive: form.isActive,
      };
      if (editingId) {
        await updateBrand({ id: editingId, ...payload }).unwrap();
        toast.success("Brand updated");
      } else {
        await createBrand(payload).unwrap();
        toast.success("Brand created");
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
      await deleteBrand(id).unwrap();
      toast.success("Brand deleted");
      setPendingDelete(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  if (isLoading) return <PageLoader label="Loading brands..." />;

  return (
    <div className="max-w-3xl">
      <AdminPageHeader
        title="Brands"
        description={`${data?.length ?? 0} brand(s)`}
        action={
          !showForm && (
            <button type="button" onClick={openCreate} className="btn-primary text-sm">
              <Plus size={15} /> New brand
            </button>
          )
        }
      />

      {showForm && (
        <form onSubmit={save} className="card mb-6 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              {editingId ? "Edit brand" : "New brand"}
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
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Name *</label>
              <input
                required
                minLength={2}
                maxLength={60}
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Slug</label>
              <input
                className="input"
                placeholder="auto-generated"
                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Logo URL</label>
              <input
                className="input"
                placeholder="https://..."
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
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
            Visible in store
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

      {!data?.length ? (
        <EmptyState
          title="No brands yet"
          action={
            <button type="button" onClick={openCreate} className="btn-primary">
              New brand
            </button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {data.map((brand) => (
            <li
              key={brand.id}
              className="card flex items-center justify-between gap-3 p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="size-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {brand.imageUrl ? (
                    <img src={brand.imageUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <span className="flex size-full items-center justify-center text-xs font-bold text-gray-400">
                      {brand.name.charAt(0)}
                    </span>
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium">{brand.name}</p>
                  <p className="text-xs text-gray-500">
                    {brand.slug} · {brand._count?.products ?? 0} product(s)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span
                  className={`mr-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    brand.isActive !== false
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {brand.isActive !== false ? "Visible" : "Hidden"}
                </span>
                <button
                  type="button"
                  onClick={() => openEdit(brand)}
                  className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                  aria-label="Edit"
                >
                  <Pencil size={15} />
                </button>
                {pendingDelete === brand.id ? (
                  <button
                    type="button"
                    onClick={() => remove(brand.id)}
                    className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700"
                  >
                    Confirm
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPendingDelete(brand.id)}
                    className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
