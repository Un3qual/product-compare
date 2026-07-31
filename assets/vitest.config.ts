import { defineConfig } from "vitest/config";
import { reactWithStyleX } from "./stylex-plugin";

export default defineConfig({
  plugins: reactWithStyleX(),
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.{ts,tsx}"],
  },
});
