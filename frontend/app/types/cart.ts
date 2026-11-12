export interface CartItem {
  id: string;
  qty: number;
  productId: string;
  variantId: string | null;
  unitPrice: number;
  comparePrice: number | null;
  lineTotal: number;
  available: number;
  inStock: boolean;
  name: string;
  slug: string;
  image: string | null;
  variantLabel: string | null;
  sku: string | null;
}

export interface Cart {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  couponCode: string | null;
  updatedAt: string;
}
