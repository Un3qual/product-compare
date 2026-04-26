import { vi } from "vitest";

const {
  createRelayEnvironmentMock,
  createStaticHandlerMock,
  createStaticRouterMock,
  dehydrateRelayEnvironmentMock,
  renderRelayRecordsScriptMock,
  renderToReadableStreamMock
} = vi.hoisted(() => ({
  createRelayEnvironmentMock: vi.fn(() => ({})),
  createStaticHandlerMock: vi.fn(() => ({
    dataRoutes: [],
    query: vi.fn(async () => ({}))
  })),
  createStaticRouterMock: vi.fn(() => ({})),
  dehydrateRelayEnvironmentMock: vi.fn(() => ({})),
  renderRelayRecordsScriptMock: vi.fn(() => ""),
  renderToReadableStreamMock: vi.fn()
}));

vi.mock("react-dom/server", () => ({
  renderToReadableStream: renderToReadableStreamMock
}));

vi.mock("../relay/environment", () => ({
  createRelayEnvironment: createRelayEnvironmentMock
}));

vi.mock("../relay/ssr", () => ({
  dehydrateRelayEnvironment: dehydrateRelayEnvironmentMock,
  renderRelayRecordsScript: renderRelayRecordsScriptMock
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    createStaticHandler: createStaticHandlerMock,
    createStaticRouter: createStaticRouterMock
  };
});

vi.mock("../router", () => ({
  routes: []
}));

beforeEach(() => {
  vi.resetModules();
  createRelayEnvironmentMock.mockReset();
  createRelayEnvironmentMock.mockImplementation(() => ({}));
  createStaticHandlerMock.mockReset();
  createStaticHandlerMock.mockImplementation(() => ({
    dataRoutes: [],
    query: vi.fn(async () => ({}))
  }));
  createStaticRouterMock.mockReset();
  createStaticRouterMock.mockImplementation(() => ({}));
  dehydrateRelayEnvironmentMock.mockReset();
  dehydrateRelayEnvironmentMock.mockImplementation(() => ({}));
  renderRelayRecordsScriptMock.mockReset();
  renderRelayRecordsScriptMock.mockImplementation(() => "");
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
  expect(createRelayEnvironmentMock).toHaveBeenCalledWith({ ssrContext });
  expect(createStaticHandlerMock).toHaveBeenCalled();
});

test("server render passes the incoming request URL and headers into the static handler query", async () => {
  const queryMock = vi.fn(async () => ({}));

  createStaticHandlerMock.mockReturnValue({
    dataRoutes: [],
    query: queryMock
  });

  const htmlStream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode("<div>Product Compare</div>"));
      controller.close();
    }
  }) as ReadableStream & { allReady: Promise<void> };

  htmlStream.allReady = Promise.resolve();
  renderToReadableStreamMock.mockResolvedValue(htmlStream);

  const ssrContext = {
    request: new Request("https://app.example.com/products?featured=true", {
      headers: {
        cookie: "session=abc"
      }
    })
  };

  const { render } = await import("../entry.server");

  await render("/products?featured=true", ssrContext);

  expect(queryMock).toHaveBeenCalledTimes(1);

  const request = (queryMock.mock.calls as unknown[][])[0]?.[0] as Request;

  expect(request.url).toBe("https://app.example.com/products?featured=true");
  expect(request.headers.get("cookie")).toBe("session=abc");
});

test("server render preserves cookieString when building the static-handler request", async () => {
  const queryMock = vi.fn(async () => ({}));

  createStaticHandlerMock.mockReturnValue({
    dataRoutes: [],
    query: queryMock
  });

  const htmlStream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode("<div>Product Compare</div>"));
      controller.close();
    }
  }) as ReadableStream & { allReady: Promise<void> };

  htmlStream.allReady = Promise.resolve();
  renderToReadableStreamMock.mockResolvedValue(htmlStream);

  const { render } = await import("../entry.server");

  await render("/products", {
    cookieString: "session=from-cookie-string"
  });

  const request = (queryMock.mock.calls as unknown[][])[0]?.[0] as Request;

  expect(request.headers.get("cookie")).toBe("session=from-cookie-string");
});

test("server render returns redirect responses from the static handler unchanged", async () => {
  const redirectResponse = new Response(null, {
    status: 302,
    headers: {
      location: "/auth/login"
    }
  });

  createStaticHandlerMock.mockReturnValue({
    dataRoutes: [],
    query: vi.fn(async () => redirectResponse)
  });

  const { render } = await import("../entry.server");

  await expect(render("/products")).resolves.toBe(redirectResponse);
  expect(createStaticRouterMock).not.toHaveBeenCalled();
  expect(renderToReadableStreamMock).not.toHaveBeenCalled();
});

test("server render inserts Relay records before a full document body closes", async () => {
  const relayRecordsScript = '<script id="__relayRecords" type="application/json">{"records":{}}</script>';
  const htmlStream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        new TextEncoder().encode("<!doctype html><html><body><div>Product Compare</div></body></html>")
      );
      controller.close();
    }
  }) as ReadableStream & { allReady: Promise<void> };

  htmlStream.allReady = Promise.resolve();
  renderToReadableStreamMock.mockResolvedValue(htmlStream);
  renderRelayRecordsScriptMock.mockReturnValue(relayRecordsScript);

  const { render } = await import("../entry.server");

  await expect(render("/")).resolves.toBe(
    `<!doctype html><html><body><div>Product Compare</div>${relayRecordsScript}</body></html>`
  );
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

test("server render logs and falls back when request URL resolution fails", async () => {
  const queryMock = vi.fn(async () => ({}));

  createStaticHandlerMock.mockReturnValue({
    dataRoutes: [],
    query: queryMock
  });

  const htmlStream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode("<div>Product Compare</div>"));
      controller.close();
    }
  }) as ReadableStream & { allReady: Promise<void> };

  htmlStream.allReady = Promise.resolve();
  renderToReadableStreamMock.mockResolvedValue(htmlStream);

  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  try {
    const { render } = await import("../entry.server");
    const request = {
      headers: new Headers(),
      method: "GET",
      url: "not a valid url"
    } as unknown as Request;

    await expect(render("http://[invalid", { request })).resolves.toContain("Product Compare");

    const queryRequest = (queryMock.mock.calls as unknown[][])[0]?.[0] as Request;

    expect(queryRequest.url).toBe("http://localhost/");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to resolve server URL",
      expect.objectContaining({
        url: "http://[invalid",
        baseUrl: "not a valid url",
        error: expect.any(TypeError)
      })
    );
  } finally {
    consoleErrorSpy.mockRestore();
  }
});
