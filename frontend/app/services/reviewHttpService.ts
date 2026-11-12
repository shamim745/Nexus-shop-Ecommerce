import type { AdminReviewItem, ListResponse, Review } from "~/types";
import { http, qs } from "./httpClient";

const reviewHttpService = {
  getReviews: (params: { productId: string; page?: number; limit?: number }) =>
    http.get<ListResponse<Review>>(`/reviews${qs({ ...params })}`),

  createReview: (body: { productId: string; rating: number; comment?: string }) =>
    http.post<Review>("/reviews", body),

  updateReview: ({ id, ...body }: { id: string; rating: number; comment?: string }) =>
    http.patch<Review>(`/reviews/${id}`, body),

  deleteReview: (id: string) => http.delete<{ ok: boolean }>(`/reviews/${id}`),

  adminReviews: (params: { page?: number; limit?: number }) =>
    http.get<ListResponse<AdminReviewItem>>(`/admin/reviews${qs({ ...params })}`),

  adminDeleteReview: (id: string) =>
    http.delete<{ ok: boolean }>(`/admin/reviews/${id}`),
};

export default reviewHttpService;
