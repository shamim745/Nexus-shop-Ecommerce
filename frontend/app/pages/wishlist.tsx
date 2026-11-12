import { Link, useNavigate } from "react-router";
import { ShoppingCart, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  useGetWishlistQuery,
  useMoveToCartMutation,
  useRemoveWishlistItemMutation,
} from "~/redux/api";
import { EmptyState, PageLoader } from "~/components";
import { RatingStars } from "~/components";
import { errorMessage, formatPrice } from "~/utils/format";

export default function WishlistPage() {
  const { data, isLoading } = useGetWishlistQuery();
  const [removeItem] = useRemoveWishlistItemMutation();
  const [moveToCart, { isLoading: moving }] = useMoveToCartMutation();
  const navigate = useNavigate();

  if (isLoading) return <PageLoader label="Loading wishlist..." />;

  if (!data || data.items.length === 0) {
    return (
      <EmptyState
        title="Your wishlist is empty"
        description="Tap the heart on any product to save it for later."
        action={
          <Link to="/products" className="btn-primary">
            Discover products
          </Link>
        }
      />
    );
  }

  const remove = async (productId: string) => {
    try {
      await removeItem(productId).unwrap();
      toast.success("Removed from wishlist");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const move = async (productId: string) => {
    try {
      await moveToCart(productId).unwrap();
      toast.success("Moved to cart");
      navigate("/cart");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">My wishlist</h1>
      <p className="mt-1 text-sm text-gray-500">{data.items.length} saved item(s)</p>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {data.items.map(({ product }) => (
          <div
            key={product.id}
            className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white"
          >
            <Link to={`/products/${product.slug}`} className="relative aspect-square bg-gray-100">
              <img
                src={product.images[0]?.url}
                alt={product.name}
                loading="lazy"
                className="size-full object-cover transition-transform group-hover:scale-105"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  remove(product.id);
                }}
                aria-label="Remove from wishlist"
                className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-gray-600 shadow-sm hover:text-red-600"
              >
                <Trash2 size={15} />
              </button>
            </Link>
            <div className="flex flex-1 flex-col gap-1.5 p-3">
              <Link
                to={`/products/${product.slug}`}
                className="line-clamp-2 text-sm font-medium hover:text-indigo-600"
              >
                {product.name}
              </Link>
              <RatingStars value={product.ratingAvg} count={product.ratingCount} />
              <span className="text-base font-semibold">
                {formatPrice(product.price)}
              </span>
              <button
                type="button"
                onClick={() => move(product.id)}
                disabled={moving || product.stock <= 0}
                className="btn-primary mt-auto w-full text-xs"
              >
                <ShoppingCart size={14} /> Move to cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
