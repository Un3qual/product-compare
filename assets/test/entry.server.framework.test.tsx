import type { ReactNode } from "react";
import { RouterContextProvider, type EntryContext } from "react-router";
import { createRelayEnvironment } from "../src/relay/environment";
import { setRelayEnvironmentOnRouterContext } from "../src/relay/route-preload";

const serverRouterCalls = vi.hoisted(() => vi.fn());

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");

  return {
    ...actual,
    ServerRouter: (props: { context: EntryContext; url: string }) => {
      serverRouterCalls(props);
      return <main>Product Compare</main>;
    },
  };
});

vi.mock("react-dom/server", async () => {
  const actual = await vi.importActual<typeof import("react-dom/server")>("react-dom/server");

  return {
    ...actual,
    renderToReadableStream: async (children: ReactNode) => {
      const html = actual.renderToStaticMarkup(children);
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(html));
          controller.close();
        },
      }) as ReadableStream & { allReady: Promise<void> };
      stream.allReady = Promise.resolve();
      return stream;
    },
  };
});

beforeEach(() => {
  serverRouterCalls.mockClear();
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
