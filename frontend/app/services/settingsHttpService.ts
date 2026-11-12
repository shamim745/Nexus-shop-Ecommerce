import type { ShippingSettings } from "~/types";
import { http } from "./httpClient";

const settingsHttpService = {
  getShippingSettings: () => http.get<ShippingSettings>("/settings/shipping"),

  adminGetSettings: () => http.get<ShippingSettings>("/admin/settings"),

  adminUpdateSettings: (body: {
    shippingFee: number;
    freeShippingThreshold?: number | null;
  }) => http.put<ShippingSettings>("/admin/settings", body),
};

export default settingsHttpService;
