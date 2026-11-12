import type { AdminDashboard } from "~/types";
import { http } from "./httpClient";

const dashboardHttpService = {
  adminDashboard: () => http.get<AdminDashboard>("/admin/dashboard"),
};

export default dashboardHttpService;
