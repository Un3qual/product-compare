import { defineConfig } from "vitest/config";
import { reactWithStyleX } from "./stylex-plugin";

export default defineConfig({
  plugins: [reactWithStyleX()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"]
  }
});
