import type { Coupon, CouponQuote, ListResponse } from "~/types";
import { http, qs } from "./httpClient";

const couponHttpService = {
  validateCoupon: (body: { code: string; subtotal: number }) =>
    http.post<CouponQuote>("/coupons/validate", body),

  adminCoupons: (params: { page?: number; limit?: number }) =>
    http.get<ListResponse<Coupon>>(`/admin/coupons${qs({ ...params })}`),

  adminCreateCoupon: (body: Partial<Coupon>) =>
    http.post<Coupon>("/admin/coupons", body),

  adminUpdateCoupon: ({ id, ...body }: { id: string } & Partial<Coupon>) =>
    http.patch<Coupon>(`/admin/coupons/${id}`, body),

  adminDeleteCoupon: (id: string) =>
    http.delete<{ ok: boolean }>(`/admin/coupons/${id}`),
};

export default couponHttpService;
