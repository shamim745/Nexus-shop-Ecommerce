import type { Order, OrderStatus } from "./order";

export interface AdminDashboard {
  totals: { sales: number; orders: number; customers: number; products: number };
  statusCounts: Partial<Record<OrderStatus, number>>;
  recentOrders: Array<
    Pick<
      Order,
      "id" | "orderNumber" | "status" | "total" | "paymentMethod" | "createdAt"
    > & { user: { name: string } }
  >;
  lowStock: Array<{
    id: string;
    name: string;
    slug: string;
    stock: number;
    images: Array<{ url: string }>;
  }>;
  revenueChart: Array<{ month: string; revenue: number; orders: number }>;
}
