import { defineConfig } from "vite";
import stylexMangle from "stylex-mangle-classnames";
import { frontendAliases, reactWithStyleX, STYLEX_CLASS_NAME_PREFIX } from "./stylex-plugin.ts";

const playwrightCacheDir = process.env.PLAYWRIGHT_PORT
  ? `node_modules/.vite-playwright-${process.env.PLAYWRIGHT_PORT}`
  : undefined;

export default defineConfig({
  build: {
    manifest: true,
  },
  cacheDir: playwrightCacheDir,
  optimizeDeps: {
    include: [
      "@base-ui/react",
      "@base-ui/react/accordion",
      "@base-ui/react/alert-dialog",
      "@base-ui/react/checkbox",
      "@base-ui/react/collapsible",
      "@base-ui/react/dialog",
      "@base-ui/react/popover",
      "@base-ui/react/radio",
      "@base-ui/react/radio-group",
      "@base-ui/react/select",
      "@base-ui/react/separator",
      "@base-ui/react/tabs",
    ],
  },
  plugins: [...reactWithStyleX(), stylexMangle({ classNamePrefix: STYLEX_CLASS_NAME_PREFIX })],
  resolve: {
    alias: frontendAliases,
  },
  server: {
    port: 5173,
  },
});
