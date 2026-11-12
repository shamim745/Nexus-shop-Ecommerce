import { index, route } from "@react-router/dev/routes";

export const adminRoutes = [
  index("pages/admin/dashboard.tsx"),
  route("products", "pages/admin/products.tsx"),
  route("products/new", "pages/admin/product-new.tsx"),
  route("products/:id", "pages/admin/product-form.tsx"),
  route("categories", "pages/admin/categories.tsx"),
  route("brands", "pages/admin/brands.tsx"),
  route("coupons", "pages/admin/coupons.tsx"),
  route("orders", "pages/admin/orders.tsx"),
  route("orders/:id", "pages/admin/order-detail.tsx"),
  route("customers", "pages/admin/customers.tsx"),
  route("reviews", "pages/admin/reviews.tsx"),
  route("settings", "pages/admin/settings.tsx"),
];
