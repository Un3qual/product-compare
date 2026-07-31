import { defineConfig } from "vite";
import { reactWithStyleX } from "./stylex-plugin.ts";

export default defineConfig({
  build: {
    manifest: true,
  },
  plugins: [reactWithStyleX()],
  server: {
    port: 5173,
  },
});
