const ORIGINAL_PLAYWRIGHT_PORT = process.env.PLAYWRIGHT_PORT;
const PORT_ERROR = "PLAYWRIGHT_PORT must be an integer between 1 and 65535";

vi.mock("@playwright/test", () => ({
  defineConfig: (config: unknown) => config
}));

afterEach(() => {
  vi.resetModules();

  if (ORIGINAL_PLAYWRIGHT_PORT === undefined) {
    delete process.env.PLAYWRIGHT_PORT;
  } else {
    process.env.PLAYWRIGHT_PORT = ORIGINAL_PLAYWRIGHT_PORT;
  }
});

test.each(["4173", "65535"])(
  "playwright config accepts valid port %s",
  async port => {
    await expect(loadPlaywrightConfig(port)).resolves.toHaveProperty("default");
  }
);

test.each(["0", "-1", "3.14", "65536", "not-a-port"])(
  "playwright config rejects invalid port %s",
  async port => {
    await expect(loadPlaywrightConfig(port)).rejects.toThrow(PORT_ERROR);
  }
);

function loadPlaywrightConfig(port: string) {
  vi.resetModules();
  process.env.PLAYWRIGHT_PORT = port;

  return import("../playwright.config");
}
