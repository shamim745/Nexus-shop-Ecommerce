import type { User } from "~/types";
import { http } from "./httpClient";

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

const authHttpService = {
  getMe: () => http.get<User>("/auth/me"),

  login: (body: LoginInput) =>
    http.post<{ user: User }>("/auth/login", body),

  register: (body: RegisterInput) =>
    http.post<{ user: User }>("/auth/register", body),

  logout: () => http.post<{ ok: boolean }>("/auth/logout"),

  forgotPassword: (body: { email: string }) =>
    http.post<{ message: string }>("/auth/forgot-password", body),

  resetPassword: (body: { token: string; password: string }) =>
    http.post<{ message: string }>("/auth/reset-password", body),
};

export default authHttpService;
