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
    query: vi.fn(() => ({}))
  })),
  createStaticRouterMock: vi.fn(() => ({})),
  dehydrateRelayEnvironmentMock: vi.fn(() => ({})),
  renderRelayRecordsScriptMock: vi.fn(() => ""),
  renderToReadableStreamMock: vi.fn()
}));

vi.mock("react-dom/server", () => ({
  renderToReadableStream: renderToReadableStreamMock
}));

vi.mock("../src/relay/environment", () => ({
  createRelayEnvironment: createRelayEnvironmentMock
}));

vi.mock("../src/relay/ssr", () => ({
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

vi.mock("../src/router", () => ({
  routes: []
}));

beforeEach(() => {
  vi.resetModules();
  createRelayEnvironmentMock.mockReset();
  createRelayEnvironmentMock.mockImplementation(() => ({}));
  createStaticHandlerMock.mockReset();
  createStaticHandlerMock.mockImplementation(() => ({
    dataRoutes: [],
    query: vi.fn(() => ({}))
  }));
  createStaticRouterMock.mockReset();
  createStaticRouterMock.mockImplementation(() => ({}));
  dehydrateRelayEnvironmentMock.mockReset();
  dehydrateRelayEnvironmentMock.mockImplementation(() => ({}));
  renderRelayRecordsScriptMock.mockReset();
  renderRelayRecordsScriptMock.mockImplementation(() => "");
  renderToReadableStreamMock.mockReset();
});

type StaticHandlerQueryMock = {
  mock: {
    calls: unknown[][];
  };
};

type ReactReadableStream = ReadableStream & { allReady: Promise<void> };

function createReactReadableStream(html = "<div>Product Compare</div>"): ReactReadableStream {
  const htmlStream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(html));
      controller.close();
    }
  }) as ReactReadableStream;

  htmlStream.allReady = Promise.resolve();

  return htmlStream;
}

function mockServerRenderHtml(html?: string) {
  renderToReadableStreamMock.mockResolvedValue(createReactReadableStream(html));
}

function staticHandlerRequestFrom(queryMock: StaticHandlerQueryMock): Request {
  return queryMock.mock.calls[0]?.[0] as Request;
}

function buildRequestLike({
  headers = new Headers(),
  method = "GET",
  signal,
  url
}: {
  headers?: Headers;
  method?: string;
  signal?: AbortSignal;
  url: string;
}): Request {
  return {
    headers,
    method,
    signal,
    url
  } as Request;
}

test("server render passes SSR context into the Relay environment", async () => {
  const ssrContext = {
    request: new Request("https://app.example.com/products", {
      headers: {
        cookie: "session=abc"
      }
    })
  };

  mockServerRenderHtml();

  const { render } = await import("../src/entry.server");

  await expect(render("/", ssrContext)).resolves.toContain("Product Compare");
  expect(createRelayEnvironmentMock).toHaveBeenCalledWith({ ssrContext });
  expect(createStaticHandlerMock).toHaveBeenCalled();
});

test("server render passes the incoming request URL and headers into the static handler query", async () => {
  const queryMock = vi.fn(() => ({}));

  createStaticHandlerMock.mockReturnValue({
    dataRoutes: [],
    query: queryMock
  });

  mockServerRenderHtml();

  const ssrContext = {
    request: new Request("https://app.example.com/products?featured=true", {
      headers: {
        cookie: "session=abc"
      }
    })
  };

  const { render } = await import("../src/entry.server");

  await render("/products?featured=true", ssrContext);

  expect(queryMock).toHaveBeenCalledTimes(1);

  const request = staticHandlerRequestFrom(queryMock);

  expect(request.url).toBe("https://app.example.com/products?featured=true");
  expect(request.headers.get("cookie")).toBe("session=abc");
});

test("server render forwards the incoming request abort signal into the static handler query", async () => {
  const queryMock = vi.fn(() => ({}));
  const controller = new AbortController();

  createStaticHandlerMock.mockReturnValue({
    dataRoutes: [],
    query: queryMock
  });

  mockServerRenderHtml();

  const incomingRequest = buildRequestLike({
    signal: controller.signal,
    url: "https://app.example.com/products"
  });

  const ssrContext = {
    request: incomingRequest
  };

  const { render } = await import("../src/entry.server");

  await render("/products", ssrContext);

  const request = staticHandlerRequestFrom(queryMock);

  expect(request.signal.aborted).toBe(false);

  controller.abort();

  expect(request.signal.aborted).toBe(true);
});

test("server render preserves cookieString when building the static-handler request", async () => {
  const queryMock = vi.fn(() => ({}));

  createStaticHandlerMock.mockReturnValue({
    dataRoutes: [],
    query: queryMock
  });

  mockServerRenderHtml();

  const { render } = await import("../src/entry.server");

  await render("/products", {
    cookieString: "session=from-cookie-string"
  });

  const request = staticHandlerRequestFrom(queryMock);

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
    query: vi.fn(() => redirectResponse)
  });

  const { render } = await import("../src/entry.server");

  await expect(render("/products")).resolves.toBe(redirectResponse);
  expect(createStaticRouterMock).not.toHaveBeenCalled();
  expect(renderToReadableStreamMock).not.toHaveBeenCalled();
});

test("server render inserts Relay records before a full document body closes", async () => {
  const relayRecordsScript = '<script id="__relayRecords" type="application/json">{"records":{}}</script>';
  mockServerRenderHtml("<!doctype html><html><body><div>Product Compare</div></body></html>");
  renderRelayRecordsScriptMock.mockReturnValue(relayRecordsScript);

  const { render } = await import("../src/entry.server");

  await expect(render("/")).resolves.toBe(
    `<!doctype html><html><body><div>Product Compare</div>${relayRecordsScript}</body></html>`
  );
});

test("server render keeps recoverable SSR errors from failing the response", async () => {
  const htmlStream = createReactReadableStream();

  renderToReadableStreamMock.mockImplementation((_children, options) => {
    options.onError?.(new Error("recoverable render error"));
    return Promise.resolve(htmlStream);
  });

  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  try {
    const { render } = await import("../src/entry.server");

    await expect(render("/")).resolves.toContain("Product Compare");
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

test("server render logs and falls back when request URL resolution fails", async () => {
  const queryMock = vi.fn(() => ({}));

  createStaticHandlerMock.mockReturnValue({
    dataRoutes: [],
    query: queryMock
  });

  mockServerRenderHtml();

  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  try {
    const { render } = await import("../src/entry.server");
    const request = buildRequestLike({
      url: "not a valid url"
    });

    await expect(render("http://[invalid", { request })).resolves.toContain("Product Compare");

    const queryRequest = staticHandlerRequestFrom(queryMock);

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
