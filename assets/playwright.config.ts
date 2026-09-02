import { defineConfig } from "@playwright/test";

const MIN_PORT = 1;
const MAX_PORT = 65_535;
const playwrightPort = Number(process.env.PLAYWRIGHT_PORT ?? 4173);

if (!Number.isInteger(playwrightPort) || playwrightPort < MIN_PORT || playwrightPort > MAX_PORT) {
  throw new Error("PLAYWRIGHT_PORT must be an integer between 1 and 65535");
}

const baseURL = `http://127.0.0.1:${playwrightPort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL,
  },
  webServer: {
    command: `pnpm run dev --host 127.0.0.1 --port ${playwrightPort} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
