import type { ListResponse, Order } from "~/types";
import { http, qs } from "./httpClient";

export interface CreateOrderInput {
  address: {
    addressId?: string;
    name?: string;
    phone?: string;
    line1?: string;
    line2?: string;
    area?: string;
    city?: string;
    postalCode?: string;
  };
  note?: string;
  couponCode?: string;
}

const orderHttpService = {
  createOrder: (body: CreateOrderInput) => http.post<Order>("/orders", body),

  getMyOrders: (params: { page?: number; limit?: number }) =>
    http.get<ListResponse<Order>>(`/orders${qs({ ...params })}`),

  getOrder: (id: string) => http.get<Order>(`/orders/${id}`),

  cancelOrder: ({ id, ...body }: { id: string; reason?: string }) =>
    http.post<Order>(`/orders/${id}/cancel`, body),

  reorder: (id: string) =>
    http.post<{ added: string[]; skipped: string[] }>(`/orders/${id}/reorder`),

  adminOrders: (params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) => http.get<ListResponse<Order>>(`/admin/orders${qs({ ...params })}`),

  adminOrder: (id: string) => http.get<Order>(`/admin/orders/${id}`),

  adminUpdateOrderStatus: (body: {
    id: string;
    status: string;
    note?: string;
    markPaid?: boolean;
  }) => {
    const { id, ...rest } = body;
    return http.post<Order>(`/admin/orders/${id}/status`, rest);
  },
};

export default orderHttpService;
