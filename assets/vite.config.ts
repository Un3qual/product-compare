import { defineConfig } from "vite";
import { reactWithStyleX } from "./stylex-plugin";

export default defineConfig({
  plugins: [reactWithStyleX()],
  server: {
    port: 5173
  }
});
