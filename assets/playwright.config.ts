import { defineConfig } from "@playwright/test";

const playwrightPort = Number(process.env.PLAYWRIGHT_PORT ?? 4173);

if (!Number.isInteger(playwrightPort) || playwrightPort <= 0) {
  throw new Error("PLAYWRIGHT_PORT must be a positive integer");
}

const baseURL = `http://127.0.0.1:${playwrightPort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL
  },
  webServer: {
    command: `bun run dev --host 127.0.0.1 --port ${playwrightPort} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI
  }
});
