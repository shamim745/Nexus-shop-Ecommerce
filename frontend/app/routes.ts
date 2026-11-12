import {
  index,
  layout,
  prefix,
  route,
  type RouteConfig,
} from "@react-router/dev/routes";
import { accountRoutes } from "./routes/account.routes";
import { adminRoutes } from "./routes/admin.routes";
import { authRoutes } from "./routes/auth.routes";

const publicRoutes = [
  index("pages/home.tsx"),
  route("products", "pages/products.tsx"),
  route("products/:slug", "pages/product-detail.tsx"),
  route("cart", "pages/cart.tsx"),
  route("checkout", "pages/checkout.tsx"),
  route("wishlist", "pages/wishlist.tsx"),
  route("*", "pages/not-found.tsx"),
];

export default [
  layout("./pages/layout.tsx", publicRoutes),
  layout("./pages/auth/layout.tsx", [...prefix("/auth", authRoutes)]),
  layout("./pages/account/layout.tsx", [...prefix("/account", accountRoutes)]),
  layout("./pages/admin/layout.tsx", [...prefix("/admin", adminRoutes)]),
] satisfies RouteConfig;
