import { defineConfig } from "vite";
import { reactWithStyleX } from "./stylex-plugin";

export default defineConfig({
  build: {
    manifest: true,
  },
  plugins: reactWithStyleX(),
  server: {
    port: 5173,
  },
});
