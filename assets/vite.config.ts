import { defineConfig } from "vite";
import { frontendAliases, reactWithStyleX } from "./stylex-plugin.ts";

export default defineConfig({
  build: {
    manifest: true,
  },
  plugins: reactWithStyleX(),
  resolve: {
    alias: frontendAliases,
  },
  server: {
    port: 5173,
  },
});
