import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, GripVertical, Plus, Trash2, Upload } from "lucide-react";
import toast from "react-hot-toast";
import {
  useAdminCreateProductMutation,
  useAdminProductQuery,
  useAdminUpdateProductMutation,
  useGetBrandsQuery,
  useGetCategoriesQuery,
  useUploadImageMutation,
} from "~/redux/api";
import { PageLoader } from "~/components";
import { AdminPageHeader } from "./layout";
import { errorMessage, formatPrice } from "~/utils/format";

interface VariantDraft {
  id?: string;
  sku: string;
  label: string;
  options: string;
  price: string;
  comparePrice: string;
  stock: string;
}

const EMPTY_VARIANT: VariantDraft = {
  sku: "",
  label: "",
  options: "",
  price: "",
  comparePrice: "",
  stock: "0",
};

function parseOptions(raw: string): Record<string, string> | undefined {
  const out: Record<string, string> = {};
  for (const pair of raw.split(/[,;\n]/)) {
    const idx = pair.indexOf(":");
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    if (key && value) out[key] = value;
  }
  return Object.keys(out).length ? out : undefined;
}

export default function AdminProductFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();

  const { data: existing, isLoading: loadingProduct } = useAdminProductQuery(id ?? "", {
    skip: !editing,
  });
  const { data: categories } = useGetCategoriesQuery();
  const { data: brands } = useGetBrandsQuery();
  const [createProduct, { isLoading: creating }] = useAdminCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useAdminUpdateProductMutation();
  const [uploadImage, { isLoading: isUploading }] = useUploadImageMutation();

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    comparePrice: "",
    stock: "0",
    hasVariants: false,
    isActive: true,
    isFeatured: false,
    categoryId: "",
    brandId: "",
  });
  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<VariantDraft[]>([]);

  useEffect(() => {
    if (!existing) return;
    setForm({
      name: existing.name,
      slug: existing.slug,
      description: existing.description ?? "",
      price: String(existing.price),
      comparePrice: existing.comparePrice != null ? String(existing.comparePrice) : "",
      stock: String(existing.stock),
      hasVariants: existing.hasVariants,
      isActive: existing.isActive,
      isFeatured: existing.isFeatured ?? false,
      categoryId: existing.categoryId ?? "",
      brandId: existing.brandId ?? "",
    });
    setImages(existing.images.map((i) => i.url));
    setVariants(
      existing.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        label: v.label ?? "",
        options: v.options
          ? Object.entries(v.options)
              .map(([k, val]) => `${k}: ${val}`)
              .join(", ")
          : "",
        price: v.price != null ? String(v.price) : "",
        comparePrice: v.comparePrice != null ? String(v.comparePrice) : "",
        stock: String(v.stock),
      })),
    );
  }, [existing]);

  if (editing && loadingProduct) return <PageLoader label="Loading product..." />;

  const upload = async (file: File) => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await uploadImage(fd).unwrap();
      setImages((prev) => [...prev, result.url]);
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const moveImage = (index: number, dir: -1 | 1) => {
    setImages((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const updateVariant = (index: number, patch: Partial<VariantDraft>) => {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) {
      toast.error("Enter a valid price");
      return;
    }

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price,
      comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
      hasVariants: form.hasVariants,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      categoryId: form.categoryId || undefined,
      brandId: form.brandId || undefined,
      images,
    };

    if (!form.hasVariants) {
      payload.stock = Number(form.stock) || 0;
      payload.variants = undefined;
    } else {
      const prepared = variants.map((v) => ({
        id: v.id,
        sku: v.sku.trim(),
        label: v.label.trim() || undefined,
        options: parseOptions(v.options),
        price: v.price ? Number(v.price) : undefined,
        comparePrice: v.comparePrice ? Number(v.comparePrice) : undefined,
        stock: Number(v.stock) || 0,
      }));
      if (prepared.length === 0) {
        toast.error("Add at least one variant");
        return;
      }
      if (prepared.some((v) => !v.sku)) {
        toast.error("Every variant needs a SKU");
        return;
      }
      payload.variants = prepared;
      payload.stock = prepared.reduce((sum, v) => sum + v.stock, 0);
    }

    try {
      if (editing) {
        await updateProduct({ id: id!, ...payload }).unwrap();
        toast.success("Product updated");
      } else {
        await createProduct(payload).unwrap();
        toast.success("Product created");
      }
      navigate("/admin/products");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <div className="max-w-4xl">
      <Link
        to="/admin/products"
        className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft size={15} /> Back to products
      </Link>

      <AdminPageHeader
        title={editing ? "Edit product" : "New product"}
        description={
          editing ? undefined : "Add a product to your catalog"
        }
      />

      <form onSubmit={submit} className="space-y-6">
        <section className="card space-y-4 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Basics
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Product name *</label>
              <input
                required
                maxLength={160}
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Slug (optional)</label>
              <input
                className="input"
                placeholder="auto-generated"
                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Price *</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Compare-at</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  value={form.comparePrice}
                  onChange={(e) => setForm({ ...form, comparePrice: e.target.value })}
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea
                rows={5}
                maxLength={5000}
                className="input resize-y"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Category</label>
              <select
                className="input"
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              >
                <option value="">No category</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Brand</label>
              <select
                className="input"
                value={form.brandId}
                onChange={(e) => setForm({ ...form, brandId: e.target.value })}
              >
                <option value="">No brand</option>
                {brands?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-5 border-t border-gray-100 pt-4 text-sm">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="text-indigo-600"
              />
              Visible in store
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                className="text-indigo-600"
              />
              Featured on home
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.hasVariants}
                onChange={(e) => setForm({ ...form, hasVariants: e.target.checked })}
                className="text-indigo-600"
              />
              Has variants (size, color...)
            </label>
          </div>

          {!form.hasVariants && (
            <div className="border-t border-gray-100 pt-4">
              <label className="label">Stock quantity</label>
              <input
                type="number"
                min="0"
                className="input sm:w-40"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
            </div>
          )}
        </section>

        {/* Images */}
        <section className="card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Images
          </h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {images.map((url, i) => (
              <div
                key={`${url}-${i}`}
                className="group relative size-24 overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
              >
                <img src={url} alt="" className="size-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-black/50 p-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => moveImage(i, -1)}
                    disabled={i === 0}
                    className="rounded bg-white/90 px-1.5 text-[10px] font-semibold disabled:opacity-40"
                    title="Move left"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(i, 1)}
                    disabled={i === images.length - 1}
                    className="rounded bg-white/90 px-1.5 text-[10px] font-semibold disabled:opacity-40"
                    title="Move right"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                    className="rounded bg-red-600 px-1.5 text-[10px] font-semibold text-white"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
                {i === 0 && (
                  <span className="absolute left-1 top-1 rounded bg-indigo-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    COVER
                  </span>
                )}
              </div>
            ))}
            <label className="flex size-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 text-xs text-gray-500 hover:border-indigo-400 hover:text-indigo-600">
              <Upload size={18} />
              {isUploading ? "Uploading..." : "Upload"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void upload(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <input
              className="input flex-1 text-xs"
              placeholder="…or paste an image URL and press Add"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const value = (e.target as HTMLInputElement).value.trim();
                  if (value) {
                    setImages([...images, value]);
                    (e.target as HTMLInputElement).value = "";
                  }
                }
              }}
            />
          </div>
        </section>

        {/* Variants */}
        {form.hasVariants && (
          <section className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Variants
              </h2>
              <button
                type="button"
                onClick={() => setVariants([...variants, { ...EMPTY_VARIANT }])}
                className="btn-secondary text-sm"
              >
                <Plus size={14} /> Add variant
              </button>
            </div>

            {variants.length === 0 ? (
              <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                A product with variants needs at least one.
              </p>
            ) : (
              <ul className="mt-4 space-y-4">
                {variants.map((v, i) => (
                  <li key={i} className="rounded-xl border border-gray-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                        <GripVertical size={14} /> Variant {i + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => setVariants(variants.filter((_, idx) => idx !== i))}
                        className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        aria-label="Remove variant"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className="label">SKU *</label>
                        <input
                          required
                          className="input"
                          maxLength={64}
                          value={v.sku}
                          onChange={(e) => updateVariant(i, { sku: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="label">Label</label>
                        <input
                          className="input"
                          maxLength={120}
                          placeholder="Red / XL"
                          value={v.label}
                          onChange={(e) => updateVariant(i, { label: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="label">Stock *</label>
                        <input
                          required
                          type="number"
                          min="0"
                          className="input"
                          value={v.stock}
                          onChange={(e) => updateVariant(i, { stock: e.target.value })}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="label">Options</label>
                        <input
                          className="input"
                          placeholder="Color: Red, Size: XL"
                          value={v.options}
                          onChange={(e) => updateVariant(i, { options: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="label">Price</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="input"
                            placeholder={form.price}
                            value={v.price}
                            onChange={(e) => updateVariant(i, { price: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="label">Compare-at</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="input"
                            value={v.comparePrice}
                            onChange={(e) =>
                              updateVariant(i, { comparePrice: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-400">
                      {v.price
                        ? `Sells for ${formatPrice(Number(v.price))}`
                        : `Falls back to base price ${formatPrice(Number(form.price) || 0)}`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={creating || updating}
            className="btn-primary"
          >
            {creating || updating
              ? "Saving..."
              : editing
                ? "Save changes"
                : "Create product"}
          </button>
          <Link to="/admin/products" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
