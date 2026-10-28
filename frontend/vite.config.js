import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// Browser calls /api; Vite forwards requests to Express during local development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: { "/api": "http://127.0.0.1:8000" },
  },
});
