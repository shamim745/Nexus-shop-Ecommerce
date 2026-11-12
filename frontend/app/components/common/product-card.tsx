import { Link } from "react-router";
import { Heart, ShoppingCart } from "lucide-react";
import type { ProductListItem } from "~/types";
import { formatPrice } from "~/utils/format";
import { RatingStars } from "./rating-stars";
import { useAddCartItemMutation } from "~/redux/api";
import { errorMessage } from "~/utils/format";
import toast from "react-hot-toast";

export function ProductCard({
  product,
  onWishlistToggle,
  inWishlist,
}: {
  product: ProductListItem;
  onWishlistToggle?: (product: ProductListItem) => void;
  inWishlist?: boolean;
}) {
  const [addCartItem, { isLoading: adding }] = useAddCartItemMutation();
  const image = product.images[0]?.url;
  const onSale =
    product.comparePrice !== null && product.comparePrice > product.price;

  const quickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.hasVariants) {
      window.location.href = `/products/${product.slug}`;
      return;
    }
    try {
      await addCartItem({ productId: product.id, qty: 1 }).unwrap();
      toast.success("Added to cart");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-gray-400">
            No image
          </div>
        )}
        {onSale && (
          <span className="absolute left-2 top-2 rounded-md bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
            Sale
          </span>
        )}
        {product.stock <= 0 && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-semibold text-gray-700">
            Out of stock
          </span>
        )}
        {onWishlistToggle && (
          <button
            type="button"
            aria-label="Toggle wishlist"
            onClick={(e) => {
              e.preventDefault();
              onWishlistToggle(product);
            }}
            className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-gray-600 shadow-sm hover:text-red-600"
          >
            <Heart
              size={16}
              className={inWishlist ? "fill-red-500 text-red-500" : ""}
            />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {product.brand && (
          <span className="text-xs font-medium uppercase tracking-wide text-indigo-600">
            {product.brand.name}
          </span>
        )}
        <h3 className="line-clamp-2 text-sm font-medium text-gray-900">
          {product.name}
        </h3>
        <RatingStars value={product.ratingAvg} count={product.ratingCount} />
        <div className="mt-auto flex items-center justify-between pt-1">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold text-gray-900">
              {formatPrice(product.price)}
            </span>
            {onSale && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.comparePrice!)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={quickAdd}
            disabled={adding || product.stock <= 0}
            aria-label="Add to cart"
            className="rounded-lg bg-indigo-50 p-2 text-indigo-600 transition-colors hover:bg-indigo-100 disabled:opacity-40"
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    </Link>
  );
}
