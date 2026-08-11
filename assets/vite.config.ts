import { defineConfig } from "vite";
import stylexMangle from "./plugins/stylex-mangle.ts";
import { frontendAliases, reactWithStyleX, STYLEX_CLASS_NAME_PREFIX } from "./stylex-plugin.ts";

export default defineConfig({
  build: {
    manifest: true,
  },
  plugins: [...reactWithStyleX(), stylexMangle({ classNamePrefix: STYLEX_CLASS_NAME_PREFIX })],
  resolve: {
    alias: frontendAliases,
  },
  server: {
    port: 5173,
  },
});
