import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  useAdminCreateCategoryMutation,
  useAdminDeleteCategoryMutation,
  useAdminUpdateCategoryMutation,
  useUploadImageMutation,
} from "~/redux/api";
import { EmptyState, PageLoader } from "~/components";
import { AdminPageHeader } from "./layout";
import type { Category } from "~/types";
import { errorMessage } from "~/utils/format";
import { useAdminCategoriesQuery } from "~/redux/api";

const EMPTY = {
  name: "",
  slug: "",
  imageUrl: "",
  parentId: "",
  isActive: true,
  position: 0,
};

type FlatCategory = Category & { depth: number };

function flatten(items: Category[], depth = 0): FlatCategory[] {
  return items.flatMap((c) => [
    { ...c, depth },
    ...(c.children ? flatten(c.children, depth + 1) : []),
  ]);
}

export default function AdminCategoriesPage() {
  const { data, isLoading } = useAdminCategoriesQuery();
  const [createCategory, { isLoading: creating }] = useAdminCreateCategoryMutation();
  const [updateCategory, { isLoading: updating }] = useAdminUpdateCategoryMutation();
  const [deleteCategory] = useAdminDeleteCategoryMutation();
  const [uploadImage] = useUploadImageMutation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const rows = data ? flatten(data) : [];

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY);
    setShowForm(true);
  };

  const openEdit = (cat: FlatCategory) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      imageUrl: cat.imageUrl ?? "",
      parentId: cat.parentId ?? "",
      isActive: cat.isActive ?? true,
      position: cat.position ?? 0,
    });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      slug: form.slug || undefined,
      imageUrl: form.imageUrl || undefined,
      parentId: form.parentId || undefined,
      isActive: form.isActive,
      position: Number(form.position) || 0,
    };
    try {
      if (editingId) {
        await updateCategory({ id: editingId, ...payload }).unwrap();
        toast.success("Category updated");
      } else {
        await createCategory(payload).unwrap();
        toast.success("Category created");
      }
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteCategory(id).unwrap();
      toast.success("Category deleted");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  if (isLoading) return <PageLoader label="Loading categories..." />;

  return (
    <div className="max-w-4xl">
      <AdminPageHeader
        title="Categories"
        description={`${rows.length} categor${rows.length === 1 ? "y" : "ies"}`}
        action={
          !showForm && (
            <button type="button" onClick={openCreate} className="btn-primary text-sm">
              <Plus size={15} /> New category
            </button>
          )
        }
      />

      {showForm && (
        <form onSubmit={save} className="card mb-6 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              {editingId ? "Edit category" : "New category"}
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
                maxLength={80}
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
            <div>
              <label className="label">Parent category</label>
              <select
                className="input"
                value={form.parentId}
                onChange={(e) => setForm({ ...form, parentId: e.target.value })}
              >
                <option value="">None (top level)</option>
                {rows
                  .filter((c) => c.id !== editingId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {"— ".repeat(c.depth)}
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="label">Position</label>
              <input
                type="number"
                className="input"
                value={form.position}
                onChange={(e) =>
                  setForm({ ...form, position: Number(e.target.value) || 0 })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Image URL</label>
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="/uploads/... or https://..."
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                />
                <label className="btn-secondary shrink-0 cursor-pointer text-sm">
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const fd = new FormData();
                        fd.append("file", file);
                        const res = await uploadImage(fd).unwrap();
                        setForm((f) => ({ ...f, imageUrl: res.url }));
                      } catch (error) {
                        toast.error(errorMessage(error));
                      }
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
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
            <button type="submit" disabled={creating || updating} className="btn-primary">
              {creating || updating ? "Saving..." : editingId ? "Save changes" : "Create"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      {!rows.length ? (
        <EmptyState
          title="No categories yet"
          description="Group your products into categories."
          action={
            <button type="button" onClick={openCreate} className="btn-primary">
              New category
            </button>
          }
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2" style={{ paddingLeft: cat.depth * 20 }}>
                      {cat.imageUrl && (
                        <span className="size-8 overflow-hidden rounded bg-gray-100">
                          <img src={cat.imageUrl} alt="" className="size-full object-cover" />
                        </span>
                      )}
                      <span className="font-medium">{cat.name}</span>
                      {cat.depth > 0 && (
                        <span className="text-xs text-gray-400">sub</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{cat.slug}</td>
                  <td className="px-4 py-3 text-gray-600">{cat.productCount ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        cat.isActive !== false
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {cat.isActive !== false ? "Visible" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(cat)}
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                        aria-label="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(cat.id)}
                        className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        aria-label="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
