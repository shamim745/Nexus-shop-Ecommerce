import { useState } from "react";
import { Link } from "react-router";
import { Eye, EyeOff, Pencil, Plus, Search, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  useAdminDeleteProductMutation,
  useAdminProductsQuery,
  useAdminUpdateProductMutation,
} from "~/redux/api";
import { EmptyState, PageLoader } from "~/components";
import { Pagination } from "~/components";
import { AdminPageHeader } from "./layout";
import { errorMessage, formatPrice } from "~/utils/format";

export default function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const [includeInactive, setIncludeInactive] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const { data, isLoading } = useAdminProductsQuery({
    page,
    limit: 20,
    search: search || undefined,
    includeInactive: includeInactive || undefined,
  });
  const [updateProduct] = useAdminUpdateProductMutation();
  const [deleteProduct] = useAdminDeleteProductMutation();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(input.trim());
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateProduct({ id, isActive: !isActive }).unwrap();
      toast.success(isActive ? "Product hidden" : "Product published");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const remove = async (id: string) => {
    try {
      const result = await deleteProduct(id).unwrap();
      toast.success(result.archived ? "Product archived" : "Product deleted");
      setPendingDelete(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Products"
        description={data ? `${data.meta.total} product(s)` : undefined}
        action={
          <Link to="/admin/products/new" className="btn-primary text-sm">
            <Plus size={15} /> New product
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form onSubmit={submit} className="relative flex-1 sm:max-w-xs">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            className="input pl-9"
            placeholder="Search products..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </form>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => {
              setIncludeInactive(e.target.checked);
              setPage(1);
            }}
            className="text-indigo-600"
          />
          Show hidden products
        </label>
      </div>

      {isLoading ? (
        <PageLoader label="Loading products..." />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="No products"
          description="Create your first product to get started."
          action={
            <Link to="/admin/products/new" className="btn-primary">
              New product
            </Link>
          }
        />
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="size-10 shrink-0 overflow-hidden rounded bg-gray-100">
                          {product.images[0] && (
                            <img
                              src={product.images[0].url}
                              alt=""
                              className="size-full object-cover"
                            />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{product.name}</p>
                          <p className="truncate text-xs text-gray-500">
                            {product.category?.name ?? "Uncategorized"}
                            {product.brand?.name ? ` · ${product.brand.name}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {product.category?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {formatPrice(product.price)}
                      {product.comparePrice && product.comparePrice > product.price && (
                        <span className="ml-1 text-xs text-gray-400 line-through">
                          {formatPrice(product.comparePrice)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-semibold ${
                          product.stock <= 5
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          product.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {product.isActive ? "Visible" : "Hidden"}
                        {product.isFeatured && " · Featured"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => toggleActive(product.id, product.isActive)}
                          title={product.isActive ? "Hide" : "Publish"}
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                        >
                          {product.isActive ? <Eye size={15} /> : <EyeOff size={15} />}
                        </button>
                        <Link
                          to={`/admin/products/${product.id}`}
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </Link>
                        {pendingDelete === product.id ? (
                          <button
                            type="button"
                            onClick={() => remove(product.id)}
                            className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700"
                          >
                            Confirm
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPendingDelete(product.id)}
                            title="Delete"
                            className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
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
