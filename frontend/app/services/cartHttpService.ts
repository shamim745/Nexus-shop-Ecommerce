import type { Cart } from "~/types";
import { http } from "./httpClient";

const cartHttpService = {
  getCart: () => http.get<Cart>("/cart"),

  addItem: (body: { productId: string; variantId?: string; qty: number }) =>
    http.post<Cart>("/cart/items", body),

  updateItem: ({ id, ...body }: { id: string; qty: number }) =>
    http.patch<Cart>(`/cart/items/${id}`, body),

  removeItem: (id: string) => http.delete<Cart>(`/cart/items/${id}`),

  clear: () => http.delete<Cart>("/cart"),

  setCoupon: (code: string | null) =>
    http.patch<Cart>("/cart/coupon", { code }),
};

export default cartHttpService;
