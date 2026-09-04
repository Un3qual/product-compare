import { defineConfig } from "vitest/config";
import { frontendAliases, styleXTransform } from "./stylex-plugin.ts";

export default defineConfig({
  plugins: styleXTransform(),
  resolve: { alias: frontendAliases },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.{ts,tsx}"],
  },
});
