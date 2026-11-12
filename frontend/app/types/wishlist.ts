import type { ProductListItem } from "./product";

export interface WishlistItem {
  productId: string;
  addedAt: string;
  product: ProductListItem;
}

export interface WishlistResponse {
  items: WishlistItem[];
}
