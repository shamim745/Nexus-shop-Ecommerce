import type { Brand } from "~/types";
import { http } from "./httpClient";

const brandHttpService = {
  getBrands: () => http.get<Brand[]>("/brands"),

  adminBrands: () => http.get<Brand[]>("/admin/brands"),

  adminCreateBrand: (body: Partial<Brand>) =>
    http.post<Brand>("/admin/brands", body),

  adminUpdateBrand: ({ id, ...body }: { id: string } & Partial<Brand>) =>
    http.patch<Brand>(`/admin/brands/${id}`, body),

  adminDeleteBrand: (id: string) =>
    http.delete<{ ok: boolean }>(`/admin/brands/${id}`),
};

export default brandHttpService;
