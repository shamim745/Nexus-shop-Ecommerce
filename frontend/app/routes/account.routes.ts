import { index, route } from "@react-router/dev/routes";

export const accountRoutes = [
  index("pages/account/profile.tsx"),
  route("orders", "pages/account/orders.tsx"),
  route("orders/:id", "pages/account/order-detail.tsx"),
  route("addresses", "pages/account/addresses.tsx"),
];
