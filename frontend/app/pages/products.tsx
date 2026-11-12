import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { SlidersHorizontal, X } from "lucide-react";
import { useGetBrandsQuery, useGetCategoriesQuery, useGetProductsQuery } from "~/redux/api";
import { ProductCard } from "~/components";
import { EmptyState, PageLoader } from "~/components";
import { Pagination } from "~/components";
import type { PageMeta } from "~/types";

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most popular" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "rating", label: "Highest rated" },
];

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState(searchParams.get("search") ?? "");

  const page = Number(searchParams.get("page") ?? 1);
  const search = searchParams.get("search") ?? undefined;
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const brandId = searchParams.get("brandId") ?? undefined;
  const sort = searchParams.get("sort") ?? "newest";
  const minPrice = searchParams.get("minPrice") ?? undefined;
  const maxPrice = searchParams.get("maxPrice") ?? undefined;
  const featured = searchParams.get("featured") === "true";

  const { data, isLoading, isFetching } = useGetProductsQuery({
    page,
    limit: 12,
    search,
    categoryId,
    brandId,
    sort,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    featured: featured || undefined,
  });
  const { data: categories } = useGetCategoriesQuery();
  const { data: brands } = useGetBrandsQuery();

  useEffect(() => {
    setSearchDraft(search ?? "");
  }, [search]);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
    if (key !== "page") next.delete("page");
    setSearchParams(next);
  };

  const clearAll = () => setSearchParams(new URLSearchParams());

  const activeCount = [categoryId, brandId, minPrice, maxPrice, search].filter(
    Boolean,
  ).length + (featured ? 1 : 0);

  const filterPanel = (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-900">Category</h3>
        <div className="space-y-1.5">
          {(categories ?? []).flatMap((cat) => [
            <FilterButton
              key={cat.id}
              label={cat.name}
              active={categoryId === cat.id}
              onClick={() => setParam("categoryId", categoryId === cat.id ? null : cat.id)}
            />,
            ...(cat.children ?? []).map((child) => (
              <FilterButton
                key={child.id}
                label={`· ${child.name}`}
                active={categoryId === child.id}
                onClick={() =>
                  setParam("categoryId", categoryId === child.id ? null : child.id)
                }
              />
            )),
          ])}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-900">Brand</h3>
        <div className="space-y-1.5">
          {(brands ?? []).map((brand) => (
            <FilterButton
              key={brand.id}
              label={brand.name}
              active={brandId === brand.id}
              onClick={() => setParam("brandId", brandId === brand.id ? null : brand.id)}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-900">Price</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            placeholder="Min"
            className="input"
            defaultValue={minPrice ?? ""}
            key={`min-${minPrice ?? ""}`}
            onBlur={(e) => setParam("minPrice", e.target.value || null)}
          />
          <span className="text-gray-400">–</span>
          <input
            type="number"
            min={0}
            placeholder="Max"
            className="input"
            defaultValue={maxPrice ?? ""}
            key={`max-${maxPrice ?? ""}`}
            onBlur={(e) => setParam("maxPrice", e.target.value || null)}
          />
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={featured}
          onChange={(e) => setParam("featured", e.target.checked ? "true" : null)}
          className="size-4 rounded border-gray-300 text-indigo-600"
        />
        Featured only
      </label>

      {activeCount > 0 && (
        <button type="button" onClick={clearAll} className="btn-secondary w-full">
          Clear filters
        </button>
      )}
    </div>
  );

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {search ? `Results for "${search}"` : "All products"}
          </h1>
          {data && (
            <p className="text-sm text-gray-500">{data.meta.total} products found</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setParam("sort", e.target.value)}
            className="input w-auto"
            aria-label="Sort products"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="btn-secondary lg:hidden"
          >
            <SlidersHorizontal size={16} /> Filters
            {activeCount > 0 && (
              <span className="ml-1 rounded-full bg-indigo-600 px-1.5 text-xs text-white">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setParam("search", searchDraft.trim() || null);
        }}
        className="mb-5 md:hidden"
      >
        <input
          type="search"
          className="input"
          placeholder="Search products..."
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
        />
      </form>

      <div className="flex gap-8">
        <aside className="hidden w-56 shrink-0 lg:block">{filterPanel}</aside>

        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setDrawerOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] overflow-y-auto bg-white p-5 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Filters</h2>
                <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close">
                  <X size={20} />
                </button>
              </div>
              {filterPanel}
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="btn-primary mt-4 w-full"
              >
                Show results
              </button>
            </div>
          </div>
        )}

        <div className="min-w-0 flex-1">
          {isLoading ? (
            <PageLoader />
          ) : (data?.items.length ?? 0) === 0 ? (
            <EmptyState
              title="No products match your filters"
              description="Try adjusting your search or clearing the filters."
              action={
                <button type="button" onClick={clearAll} className="btn-primary">
                  Clear filters
                </button>
              }
            />
          ) : (
            <>
              <div
                className={`grid grid-cols-2 gap-4 md:grid-cols-3 ${isFetching ? "opacity-60" : ""}`}
              >
                {data!.items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <Pagination
                meta={data!.meta as PageMeta}
                onChange={(p) => setParam("page", String(p))}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full rounded-lg px-2 py-1.5 text-left text-sm transition ${
        active
          ? "bg-indigo-50 font-medium text-indigo-700"
          : "text-gray-600 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );
}
