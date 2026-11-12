import type {
  Address,
  AdminCustomerDetail,
  AdminCustomerListItem,
  ListResponse,
  User,
} from "~/types";
import { http, qs } from "./httpClient";

const userHttpService = {
  updateProfile: (body: { name?: string; phone?: string }) =>
    http.patch<User>("/users/me", body),

  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    http.post<{ message: string }>("/users/me/password", body),

  getAddresses: () => http.get<Address[]>("/users/me/addresses"),

  createAddress: (body: Partial<Address>) =>
    http.post<Address>("/users/me/addresses", body),

  updateAddress: ({ id, ...body }: { id: string } & Partial<Address>) =>
    http.patch<Address>(`/users/me/addresses/${id}`, body),

  deleteAddress: (id: string) =>
    http.delete<{ ok: boolean }>(`/users/me/addresses/${id}`),

  adminCustomers: (params: { page?: number; limit?: number; search?: string }) =>
    http.get<ListResponse<AdminCustomerListItem>>(
      `/admin/customers${qs({ ...params })}`,
    ),

  adminCustomer: (id: string) =>
    http.get<AdminCustomerDetail>(`/admin/customers/${id}`),

  adminSetCustomerBlocked: ({ id, blocked }: { id: string; blocked: boolean }) =>
    http.patch<{ isActive: boolean }>(
      `/admin/customers/${id}/${blocked ? "block" : "unblock"}`,
    ),
};

export default userHttpService;
