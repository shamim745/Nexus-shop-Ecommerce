export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface OrderItem {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  variantLabel: string | null;
  sku: string | null;
  imageUrl: string | null;
  unitPrice: number;
  qty: number;
  total: number;
}

export interface OrderHistoryEntry {
  id: string;
  status: OrderStatus;
  note: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: "COD";
  paymentStatus: "UNPAID" | "PAID";
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  couponCode: string | null;
  shippingName: string;
  shippingPhone: string;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingArea: string | null;
  shippingCity: string;
  shippingPostal: string | null;
  note: string | null;
  cancelReason: string | null;
  createdAt: string;
  items: OrderItem[];
  history?: OrderHistoryEntry[];
  itemCount?: number;
  user?: { id: string; name: string; email: string };
}
