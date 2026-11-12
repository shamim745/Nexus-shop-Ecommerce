import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const API_TARGET = process.env.VITE_API_PROXY ?? "http://localhost:3000";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 5173,
    proxy: {
      "/api": { target: API_TARGET, changeOrigin: true },
      "/uploads": { target: API_TARGET, changeOrigin: true },
    },
  },
  preview: {
    port: 4173,
    proxy: {
      "/api": { target: API_TARGET, changeOrigin: true },
      "/uploads": { target: API_TARGET, changeOrigin: true },
    },
  },
});
