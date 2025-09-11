import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": "/src" } },
  build: {
    outDir: "../src/main/resources/static",
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },
});
