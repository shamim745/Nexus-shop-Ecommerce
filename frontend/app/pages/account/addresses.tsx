import { useState } from "react";
import toast from "react-hot-toast";
import { MapPin, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import {
  useCreateAddressMutation,
  useDeleteAddressMutation,
  useGetAddressesQuery,
  useUpdateAddressMutation,
} from "~/redux/api";
import { EmptyState, PageLoader } from "~/components";
import { errorMessage } from "~/utils/format";

const EMPTY = {
  name: "",
  phone: "",
  line1: "",
  line2: "",
  area: "",
  city: "",
  postalCode: "",
};

export default function AddressesPage() {
  const { data, isLoading } = useGetAddressesQuery();
  const [createAddress, { isLoading: creating }] = useCreateAddressMutation();
  const [updateAddress, { isLoading: updating }] = useUpdateAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  if (isLoading) return <PageLoader label="Loading addresses..." />;

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY);
    setShowForm(true);
  };

  const openEdit = (id: string) => {
    const addr = data?.find((a) => a.id === id);
    if (!addr) return;
    setEditingId(id);
    setForm({
      name: addr.name,
      phone: addr.phone,
      line1: addr.line1,
      line2: addr.line2 ?? "",
      area: addr.area ?? "",
      city: addr.city,
      postalCode: addr.postalCode ?? "",
    });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      phone: form.phone,
      line1: form.line1,
      line2: form.line2 || undefined,
      area: form.area || undefined,
      city: form.city,
      postalCode: form.postalCode || undefined,
    };
    try {
      if (editingId) {
        await updateAddress({ id: editingId, ...payload }).unwrap();
        toast.success("Address updated");
      } else {
        await createAddress(payload).unwrap();
        toast.success("Address added");
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
      await deleteAddress(id).unwrap();
      toast.success("Address deleted");
      setPendingDelete(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const makeDefault = async (id: string) => {
    const addr = data?.find((a) => a.id === id);
    if (!addr) return;
    try {
      await updateAddress({ ...addr, isDefault: true }).unwrap();
      toast.success("Default address updated");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {data?.length ?? 0} saved address(es)
        </p>
        {!showForm && (
          <button type="button" onClick={openCreate} className="btn-primary text-sm">
            <Plus size={15} /> Add address
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={save} className="card mb-6 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              {editingId ? "Edit address" : "New address"}
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
                value={form.line1}
                onChange={(e) => setForm({ ...form, line1: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Apartment, floor</label>
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
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={creating || updating} className="btn-primary">
              {creating || updating ? "Saving..." : editingId ? "Save changes" : "Add address"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      {!data || data.length === 0 ? (
        !showForm && (
          <EmptyState
            title="No saved addresses"
            description="Save your addresses for a faster checkout."
            action={
              <button type="button" onClick={openCreate} className="btn-primary">
                Add your first address
              </button>
            }
          />
        )
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {data.map((addr) => (
            <li
              key={addr.id}
              className={`card relative p-4 ${
                addr.isDefault ? "border-indigo-300 ring-1 ring-indigo-200" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin size={15} className="text-gray-400" />
                  <span className="text-sm font-semibold">{addr.name}</span>
                  {addr.isDefault && (
                    <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                      Default
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(addr.id)}
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                    aria-label="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(addr.id)}
                    className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <p className="mt-2 text-sm text-gray-600">{addr.phone}</p>
              <p className="mt-1 text-sm text-gray-600">
                {addr.line1}
                {addr.line2 ? `, ${addr.line2}` : ""}
                {addr.area ? `, ${addr.area}` : ""}, {addr.city}
                {addr.postalCode ? ` - ${addr.postalCode}` : ""}
              </p>

              {!addr.isDefault && (
                <button
                  type="button"
                  onClick={() => makeDefault(addr.id)}
                  className="mt-3 flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
                >
                  <Star size={12} /> Set as default
                </button>
              )}

              {pendingDelete === addr.id && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs">
                  <span className="text-red-700">Delete this address?</span>
                  <button
                    type="button"
                    onClick={() => remove(addr.id)}
                    className="rounded bg-red-600 px-2.5 py-1 font-semibold text-white hover:bg-red-700"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(null)}
                    className="rounded px-2 py-1 text-gray-600 hover:bg-red-100"
                  >
                    Keep
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
