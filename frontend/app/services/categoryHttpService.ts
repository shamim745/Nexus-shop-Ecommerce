import type { Category } from "~/types";
import { http } from "./httpClient";

const categoryHttpService = {
  getCategories: () => http.get<Category[]>("/categories"),

  adminCategories: () => http.get<Category[]>("/admin/categories"),

  adminCreateCategory: (body: Partial<Category>) =>
    http.post<Category>("/admin/categories", body),

  adminUpdateCategory: ({ id, ...body }: { id: string } & Partial<Category>) =>
    http.patch<Category>(`/admin/categories/${id}`, body),

  adminDeleteCategory: (id: string) =>
    http.delete<{ ok: boolean }>(`/admin/categories/${id}`),
};

export default categoryHttpService;
