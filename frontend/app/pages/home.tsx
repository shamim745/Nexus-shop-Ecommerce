import { Link } from "react-router";
import { ArrowRight, Truck, ShieldCheck, Headphones } from "lucide-react";
import { useGetHomeQuery } from "~/redux/api";
import { ProductCard } from "~/components";
import { PageLoader, EmptyState } from "~/components";

export default function HomePage() {
  const { data, isLoading, isError } = useGetHomeQuery();

  if (isLoading) return <PageLoader label="Loading store..." />;
  if (isError || !data)
    return (
      <EmptyState
        title="Could not load the store"
        description="Make sure the API server is running on port 3000."
      />
    );

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 px-6 py-14 text-white sm:px-12 sm:py-20">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-200">
            New season, new deals
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            Everything you need, delivered with cash on delivery.
          </h1>
          <p className="mt-4 text-indigo-100">
            Shop electronics, fashion, home and more — pay only when the order
            arrives at your door.
          </p>
          <Link
            to="/products"
            className="mt-7 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-lg hover:bg-indigo-50"
          >
            Shop now <ArrowRight size={16} />
          </Link>
        </div>
        <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 right-10 size-64 rounded-full bg-purple-400/20 blur-2xl" />
      </section>

      {/* Trust strip */}
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: Truck,
            title: "Cash on delivery",
            text: "Pay when your order reaches you",
          },
          {
            icon: ShieldCheck,
            title: "Secure checkout",
            text: "Your data stays protected",
          },
          {
            icon: Headphones,
            title: "Order tracking",
            text: "Follow every step to your door",
          },
        ].map((f) => (
          <div key={f.title} className="card flex items-start gap-3 p-4">
            <f.icon className="mt-0.5 text-indigo-600" size={22} />
            <div>
              <h3 className="text-sm font-semibold">{f.title}</h3>
              <p className="text-xs text-gray-500">{f.text}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Categories */}
      {data.categories.length > 0 && (
        <section>
          <SectionHeading title="Shop by category" href="/products" />
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {data.categories.slice(0, 5).map((cat) => (
              <Link
                key={cat.id}
                to={`/products?categoryId=${cat.id}`}
                className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100"
              >
                {cat.imageUrl && (
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-sm font-semibold text-white">{cat.name}</p>
                  {typeof cat.productCount === "number" && (
                    <p className="text-xs text-white/80">
                      {cat.productCount} products
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <ProductRow
        title="Featured products"
        products={data.featured}
        href="/products?featured=true"
      />
      <ProductRow
        title="New arrivals"
        products={data.newArrivals}
        href="/products?sort=newest"
      />
      <ProductRow
        title="Best selling"
        products={data.bestSelling}
        href="/products?sort=popular"
      />

      {/* Brands */}
      {data.brands.length > 0 && (
        <section>
          <h2 className="section-title">Popular brands</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {data.brands.map((brand) => (
              <Link
                key={brand.id}
                to={`/products?brandId=${brand.id}`}
                className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-indigo-500 hover:text-indigo-600"
              >
                {brand.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SectionHeading({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="section-title">{title}</h2>
      <Link
        to={href}
        className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline"
      >
        View all <ArrowRight size={14} />
      </Link>
    </div>
  );
}

function ProductRow({
  title,
  products,
  href,
}: {
  title: string;
  products: unknown[];
  href: string;
}) {
  if (products.length === 0) return null;
  return (
    <section>
      <SectionHeading title={title} href={href} />
      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={(p as { id: string }).id} product={p as never} />
        ))}
      </div>
    </section>
  );
}
