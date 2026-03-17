import { defineConfig } from "vitest/config";
import { reactWithStyleX } from "./stylex-plugin";

export default defineConfig({
  // Vite and Vitest currently expose incompatible plugin types here.
  // @ts-expect-error The shared React/StyleX plugin works at runtime for both configs.
  plugins: [reactWithStyleX()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"]
  }
});
