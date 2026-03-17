import { vi } from "vitest";

const {
  createRelayEnvironmentMock,
  createServerRouterMock,
  renderToReadableStreamMock
} = vi.hoisted(() => ({
  createRelayEnvironmentMock: vi.fn(() => ({})),
  createServerRouterMock: vi.fn(() => ({})),
  renderToReadableStreamMock: vi.fn()
}));

vi.mock("react-dom/server", () => ({
  renderToReadableStream: renderToReadableStreamMock
}));

vi.mock("../relay/environment", () => ({
  createRelayEnvironment: createRelayEnvironmentMock
}));

vi.mock("../router", () => ({
  createServerRouter: createServerRouterMock
}));

beforeEach(() => {
  vi.resetModules();
  createRelayEnvironmentMock.mockClear();
  createServerRouterMock.mockClear();
  renderToReadableStreamMock.mockReset();
});

test("server render passes SSR context into the Relay environment", async () => {
  const ssrContext = {
    request: new Request("https://app.example.com/products", {
      headers: {
        cookie: "session=abc"
      }
    })
  };

  const htmlStream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode("<div>Product Compare</div>"));
      controller.close();
    }
  }) as ReadableStream & { allReady: Promise<void> };

  htmlStream.allReady = Promise.resolve();
  renderToReadableStreamMock.mockResolvedValue(htmlStream);

  const { render } = await import("../entry.server");

  await expect(render("/", ssrContext)).resolves.toContain("Product Compare");
  expect(createRelayEnvironmentMock).toHaveBeenCalledWith(ssrContext);
});

test("server render keeps recoverable SSR errors from failing the response", async () => {
  const htmlStream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode("<div>Product Compare</div>"));
      controller.close();
    }
  }) as ReadableStream & { allReady: Promise<void> };

  htmlStream.allReady = Promise.resolve();

  renderToReadableStreamMock.mockImplementation(async (_children, options) => {
    options.onError?.(new Error("recoverable render error"));
    return htmlStream;
  });

  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  try {
    const { render } = await import("../entry.server");

    await expect(render("/")).resolves.toContain("Product Compare");
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
  } finally {
    consoleErrorSpy.mockRestore();
  }
});
