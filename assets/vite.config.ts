import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import { frontendAliases, styleXTransform } from "./stylex-plugin.ts";

const playwrightCacheDir = process.env.PLAYWRIGHT_PORT
  ? `node_modules/.vite-playwright-${process.env.PLAYWRIGHT_PORT}`
  : undefined;

export default defineConfig({
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
      "@stylexjs/stylex",
      "@tanstack/charts/dot",
      "@tanstack/charts/line",
      "@tanstack/charts/react",
      "@tanstack/charts/scales/linear",
      "@tanstack/charts/scene",
      "@tanstack/charts/tooltip",
      "@tanstack/react-table",
      "lucide-react",
      "react",
      "react-dom",
      "react-dom/client",
      "react-relay",
      "react-router",
      "react-router/dom",
      "relay-runtime",
    ],
    noDiscovery: true,
  },
  plugins: [reactRouter(), ...styleXTransform()],
  resolve: {
    alias: frontendAliases,
  },
  server: {
    port: 5173,
  },
});
