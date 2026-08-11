import { defineConfig } from "vitest/config";
import { frontendAliases, reactWithStyleX } from "./stylex-plugin.ts";

export default defineConfig({
  plugins: reactWithStyleX(),
  resolve: { alias: frontendAliases },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.{ts,tsx}"],
  },
});
