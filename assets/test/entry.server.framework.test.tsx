import { RouterContextProvider, type EntryContext } from "react-router";
import { createRelayEnvironment } from "../src/relay/environment";
import { setRelayEnvironmentOnRouterContext } from "../src/relay/route-preload";

const serverRouterCalls = vi.hoisted(() => vi.fn());
const streamState = vi.hoisted(() => ({ allReady: Promise.resolve() }));

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  const overrides = {
    ServerRouter(props) {
      serverRouterCalls(props);
      return <main>Product Compare</main>;
    },
  } satisfies Partial<typeof actual>;

  return {
    ...actual,
    ...overrides,
  };
});

vi.mock("react-dom/server", async () => {
  const actual = await vi.importActual<typeof import("react-dom/server")>("react-dom/server");
  const overrides = {
    async renderToReadableStream(children) {
      const html = actual.renderToStaticMarkup(children);
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(html));
          controller.close();
        },
      }) as ReadableStream & { allReady: Promise<void> };
      stream.allReady = streamState.allReady;
      return stream;
    },
  } satisfies Partial<typeof actual>;

  return {
    ...actual,
    ...overrides,
  };
});

beforeEach(() => {
  serverRouterCalls.mockClear();
  streamState.allReady = Promise.resolve();
});

test("Framework server entry preserves the supplied status, headers, and request URL", async () => {
  const request = new Request("https://app.example.com/missing-page");
  const headers = new Headers({ "X-Route-Result": "preserved" });
  const loadContext = new RouterContextProvider();
  setRelayEnvironmentOnRouterContext(loadContext, createRelayEnvironment());
  const routerContext = {} as EntryContext;
  const { default: handleRequest } = await import("../src/entry.server");

  const response = await handleRequest(request, 404, headers, routerContext, loadContext);

  expect(response.status).toBe(404);
  expect(response.headers.get("x-route-result")).toBe("preserved");
  expect(response.headers.get("content-type")).toBe("text/html; charset=utf-8");
  await expect(response.text()).resolves.toContain("Product Compare");
  expect(serverRouterCalls).toHaveBeenCalledWith({
    context: routerContext,
    url: request.url,
  });
});

test("Framework server entry returns an empty HEAD response without rendering", async () => {
  const request = new Request("https://app.example.com/products", { method: "HEAD" });
  const loadContext = new RouterContextProvider();
  setRelayEnvironmentOnRouterContext(loadContext, createRelayEnvironment());
  const { default: handleRequest } = await import("../src/entry.server");

  const response = await handleRequest(
    request,
    200,
    new Headers(),
    {} as EntryContext,
    loadContext,
  );

  expect(response.status).toBe(200);
  await expect(response.text()).resolves.toBe("");
  expect(serverRouterCalls).not.toHaveBeenCalled();
});

test("Framework server entry accepts a request with a cross-realm signal without rebuilding it", async () => {
  const request = new Request("https://app.example.com/products");
  const foreignSignal = new window.AbortController().signal;
  Object.defineProperty(request, "signal", { value: foreignSignal });
  const loadContext = new RouterContextProvider();
  setRelayEnvironmentOnRouterContext(loadContext, createRelayEnvironment());
  const { default: handleRequest } = await import("../src/entry.server");

  const response = await handleRequest(
    request,
    200,
    new Headers(),
    {} as EntryContext,
    loadContext,
  );

  expect(response.status).toBe(200);
  expect(request.signal).toBe(foreignSignal);
  expect(serverRouterCalls).toHaveBeenCalledWith(
    expect.objectContaining({ url: "https://app.example.com/products" }),
  );
});

test("Framework server entry streams the shell without waiting for deferred route data", async () => {
  streamState.allReady = new Promise(() => undefined);
  const request = new Request("https://app.example.com/commerce/revenue", {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
    },
  });
  const loadContext = new RouterContextProvider();
  setRelayEnvironmentOnRouterContext(loadContext, createRelayEnvironment());
  const { default: handleRequest } = await import("../src/entry.server");

  const response = await handleRequest(
    request,
    200,
    new Headers(),
    {} as EntryContext,
    loadContext,
  );

  expect(response.status).toBe(200);
});

test("Framework server entry waits for deferred route data for bots", async () => {
  let resolveAllReady!: () => void;
  streamState.allReady = new Promise((resolve) => {
    resolveAllReady = resolve;
  });
  const request = new Request("https://app.example.com/commerce/revenue", {
    headers: { "User-Agent": "Googlebot" },
  });
  const loadContext = new RouterContextProvider();
  setRelayEnvironmentOnRouterContext(loadContext, createRelayEnvironment());
  const { default: handleRequest } = await import("../src/entry.server");

  const response = handleRequest(request, 200, new Headers(), {} as EntryContext, loadContext);
  let settled = false;
  void response.then(() => {
    settled = true;
  });
  await Promise.resolve();

  expect(settled).toBe(false);
  resolveAllReady();
  await expect(response).resolves.toHaveProperty("status", 200);
});
