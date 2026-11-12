import { route } from "@react-router/dev/routes";

export const authRoutes = [
  route("login", "pages/auth/login.tsx"),
  route("register", "pages/auth/register.tsx"),
  route("forgot-password", "pages/auth/forgot-password.tsx"),
  route("reset-password", "pages/auth/reset-password.tsx"),
];
