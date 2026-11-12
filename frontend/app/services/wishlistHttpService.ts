import type { WishlistResponse } from "~/types";
import { http } from "./httpClient";

const wishlistHttpService = {
  getWishlist: () => http.get<WishlistResponse>("/wishlist"),

  addItem: (body: { productId: string }) =>
    http.post<{ ok: boolean }>("/wishlist/items", body),

  removeItem: (productId: string) =>
    http.delete<{ ok: boolean }>(`/wishlist/items/${productId}`),

  moveToCart: (productId: string) =>
    http.post<{ ok: boolean }>(`/wishlist/items/${productId}/move-to-cart`),
};

export default wishlistHttpService;
