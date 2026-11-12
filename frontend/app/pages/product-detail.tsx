import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { Heart, Minus, Plus, ShoppingCart, Truck, RotateCcw, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import {
  useAddCartItemMutation,
  useAddWishlistItemMutation,
  useCreateReviewMutation,
  useGetMeQuery,
  useGetProductQuery,
  useGetReviewsQuery,
  useGetWishlistQuery,
  useRemoveWishlistItemMutation,
} from "~/redux/api";
import { ProductCard } from "~/components";
import { RatingStars } from "~/components";
import { EmptyState, PageLoader } from "~/components";
import { errorMessage, formatDate, formatPrice } from "~/utils/format";

export default function ProductDetailPage() {
  const { slug = "" } = useParams();
  const { data: product, isLoading, isError } = useGetProductQuery(slug);
  const { data: user } = useGetMeQuery();
  const [addCartItem] = useAddCartItemMutation();
  const [addWishlist] = useAddWishlistItemMutation();
  const [removeWishlist] = useRemoveWishlistItemMutation();
  const { data: wishlist } = useGetWishlistQuery(undefined, { skip: !user });
  const inWishlist = wishlist?.items.some((i) => i.productId === product?.id) ?? false;

  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    setSelectedVariant(null);
    setQty(1);
    setActiveImage(0);
  }, [slug]);

  const variant = useMemo(
    () => product?.variants.find((v) => v.id === selectedVariant) ?? null,
    [product, selectedVariant],
  );

  if (isLoading) return <PageLoader />;
  if (isError || !product)
    return <EmptyState title="Product not found" description="It may have been removed." />;

  const price = variant?.price ?? product.price;
  const comparePrice = variant?.comparePrice ?? product.comparePrice;
  const stock = variant ? variant.stock : product.stock;
  const onSale = comparePrice !== null && comparePrice > price;

  const addToCart = async () => {
    if (product.hasVariants && !variant) {
      toast.error("Please select an option");
      return;
    }
    try {
      await addCartItem({
        productId: product.id,
        variantId: variant?.id,
        qty,
      }).unwrap();
      toast.success("Added to cart");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const toggleWishlist = async () => {
    if (!user) {
      toast.error("Sign in to use the wishlist");
      return;
    }
    try {
      if (inWishlist) {
        await removeWishlist(product.id).unwrap();
        toast.success("Removed from wishlist");
      } else {
        await addWishlist({ productId: product.id }).unwrap();
        toast.success("Saved to wishlist");
      }
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <div className="space-y-12">
      <nav className="flex items-center gap-1.5 text-sm text-gray-500">
        <Link to="/" className="hover:text-indigo-600">
          Home
        </Link>
        /
        {product.category && (
          <>
            <Link
              to={`/products?categoryId=${product.category.id}`}
              className="hover:text-indigo-600"
            >
              {product.category.name}
            </Link>
            /
          </>
        )}
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
            <img
              src={product.images[activeImage]?.url ?? product.images[0]?.url}
              alt={product.name}
              className="size-full object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {product.images.map((img, i) => (
                <button
                  key={img.id ?? i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`size-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                    i === activeImage ? "border-indigo-600" : "border-transparent"
                  }`}
                >
                  <img src={img.url} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          {product.brand && (
            <Link
              to={`/products?brandId=${product.brand.id}`}
              className="text-sm font-semibold uppercase tracking-wide text-indigo-600 hover:underline"
            >
              {product.brand.name}
            </Link>
          )}
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
            {product.name}
          </h1>
          <RatingStars value={product.ratingAvg} count={product.ratingCount} size={16} />

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-gray-900">
              {formatPrice(price)}
            </span>
            {onSale && (
              <>
                <span className="text-lg text-gray-400 line-through">
                  {formatPrice(comparePrice!)}
                </span>
                <span className="rounded-md bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                  {Math.round(((comparePrice! - price) / comparePrice!) * 100)}% off
                </span>
              </>
            )}
          </div>

          <p className="text-sm text-gray-600">
            {stock > 0 ? (
              <span className="font-medium text-green-700">In stock ({stock} available)</span>
            ) : (
              <span className="font-medium text-red-600">Out of stock</span>
            )}
          </p>

          {product.variants.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Options</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    disabled={v.stock <= 0}
                    onClick={() => setSelectedVariant(v.id === selectedVariant ? null : v.id)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                      selectedVariant === v.id
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    {v.label ?? v.sku}
                    {v.stock <= 0 && " (sold out)"}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-lg border border-gray-300">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="p-2.5 text-gray-600 hover:bg-gray-50"
                aria-label="Decrease quantity"
              >
                <Minus size={15} />
              </button>
              <span className="w-10 text-center text-sm font-semibold">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(stock, q + 1))}
                disabled={qty >= stock}
                className="p-2.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                aria-label="Increase quantity"
              >
                <Plus size={15} />
              </button>
            </div>
            <button
              type="button"
              onClick={addToCart}
              disabled={stock <= 0}
              className="btn-primary flex-1 sm:flex-none"
            >
              <ShoppingCart size={16} /> Add to cart
            </button>
            <button
              type="button"
              onClick={toggleWishlist}
              className="btn-secondary"
              aria-label="Toggle wishlist"
            >
              <Heart size={16} className={inWishlist ? "fill-red-500 text-red-500" : ""} />
            </button>
          </div>

          <div className="grid gap-3 rounded-xl bg-gray-50 p-4 text-sm text-gray-600 sm:grid-cols-3">
            <span className="flex items-center gap-2">
              <Truck size={16} className="text-indigo-600" /> Cash on delivery
            </span>
            <span className="flex items-center gap-2">
              <RotateCcw size={16} className="text-indigo-600" /> Easy order cancel
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-indigo-600" /> Secure checkout
            </span>
          </div>

          {product.description && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-gray-900">Description</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>

      <ReviewsSection productId={product.id} />

      {product.related.length > 0 && (
        <section>
          <h2 className="section-title">Related products</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {product.related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ReviewsSection({ productId }: { productId: string }) {
  const { data, isLoading } = useGetReviewsQuery({ productId, limit: 10 });
  const { data: user } = useGetMeQuery();
  const [createReview, { isLoading: submitting }] = useCreateReviewMutation();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createReview({ productId, rating, comment: comment || undefined }).unwrap();
      toast.success("Review submitted");
      setComment("");
      setRating(5);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <section className="grid gap-8 lg:grid-cols-2">
      <div>
        <h2 className="section-title">Customer reviews</h2>
        {isLoading ? (
          <PageLoader label="Loading reviews..." />
        ) : (data?.items.length ?? 0) === 0 ? (
          <p className="mt-3 text-sm text-gray-500">
            No reviews yet — be the first to share your thoughts.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {data!.items.map((review) => (
              <li key={review.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{review.user.name}</span>
                  <span className="text-xs text-gray-400">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                <div className="mt-1">
                  <RatingStars value={review.rating} />
                </div>
                {review.comment && (
                  <p className="mt-2 text-sm text-gray-600">{review.comment}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="section-title">Write a review</h2>
        {user ? (
          <form onSubmit={submit} className="card mt-4 space-y-4 p-4">
            <div>
              <label className="label">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="text-2xl leading-none"
                    aria-label={`${star} star`}
                  >
                    <span className={star <= rating ? "text-amber-400" : "text-gray-300"}>
                      ★
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="comment" className="label">
                Comment <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                id="comment"
                rows={3}
                maxLength={2000}
                className="input resize-none"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How was your experience?"
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Submitting..." : "Submit review"}
            </button>
          </form>
        ) : (
          <p className="mt-3 text-sm text-gray-500">
            <Link to="/auth/login" className="font-medium text-indigo-600 hover:underline">
              Sign in
            </Link>{" "}
            to write a review.
          </p>
        )}
      </div>
    </section>
  );
}
