import type {
  AdminProduct,
  HomeData,
  ListResponse,
  ProductDetail,
  ProductListItem,
  ProductQuery,
} from "~/types";
import { http, qs } from "./httpClient";

const productHttpService = {
  getHome: () => http.get<HomeData>("/products/home"),

  getProducts: (params: ProductQuery) =>
    http.get<ListResponse<ProductListItem>>(`/products${qs({ ...params })}`),

  getProduct: (slug: string) =>
    http.get<ProductDetail>(`/products/${encodeURIComponent(slug)}`),

  adminProducts: (params: ProductQuery & { includeInactive?: boolean }) =>
    http.get<ListResponse<AdminProduct>>(`/admin/products${qs({ ...params })}`),

  adminProduct: (id: string) => http.get<AdminProduct>(`/admin/products/${id}`),

  adminCreateProduct: (body: Partial<AdminProduct>) =>
    http.post<AdminProduct>("/admin/products", body),

  adminUpdateProduct: ({ id, ...body }: { id: string } & Partial<AdminProduct>) =>
    http.patch<AdminProduct>(`/admin/products/${id}`, body),

  adminDeleteProduct: (id: string) =>
    http.delete<{ archived: boolean }>(`/admin/products/${id}`),
};

export default productHttpService;
