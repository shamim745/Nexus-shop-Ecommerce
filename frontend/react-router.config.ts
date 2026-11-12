import type { Config } from "@react-router/dev/config";

export default {
  // SPA mode: the storefront is a static bundle; the API runs on NestJS.
  ssr: false,
} satisfies Config;
