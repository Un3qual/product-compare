import { renderToReadableStream } from "react-dom/server";
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from "react-router-dom";
import { RelayEnvironmentProvider } from "react-relay";
import { createRelayEnvironment } from "./relay/environment";
import type { SSRContext } from "./relay/fetch-graphql";
import { routes } from "./router";

const STREAM_ABORT_DELAY_MS = 10_000;
type ReactReadableStream = ReadableStream & { allReady: Promise<void> };

export async function render(url: string, ssrContext?: SSRContext): Promise<string> {
  const relayEnvironment = createRelayEnvironment(ssrContext);
  const handler = createStaticHandler(routes);
  const context = await handler.query(createServerRequest(url, ssrContext));

  if (context instanceof Response) {
    throw new Error(`Unexpected response during server render: ${context.status}`);
  }

  const router = createStaticRouter(handler.dataRoutes, context);

  const htmlStream: ReactReadableStream = await renderToReadableStream(
    <RelayEnvironmentProvider environment={relayEnvironment}>
      <StaticRouterProvider router={router} context={context} />
    </RelayEnvironmentProvider>,
    {
      onError(error) {
        console.error(error);
      }
    }
  );

  await waitForAllReady(htmlStream);

  return new Response(htmlStream).text();
}

async function waitForAllReady(stream: ReactReadableStream) {
  const safeAllReady = stream.allReady.catch(() => {});

  const timeout = new Promise<never>((_, reject) => {
    const timer = setTimeout(() => {
      void stream.cancel();
      reject(new Error("timed out streaming server render"));
    }, STREAM_ABORT_DELAY_MS);

    void safeAllReady.finally(() => clearTimeout(timer));
  });

  await Promise.race([stream.allReady, timeout]);
}

function createServerRequest(url: string, ssrContext?: SSRContext) {
  const request = ssrContext?.request;
  const headers = new Headers(ssrContext?.headers);

  request?.headers.forEach((value, key) => {
    headers.set(key, value);
  });

  return new Request(resolveServerUrl(url, request?.url), {
    method: request?.method ?? "GET",
    headers
  });
}

function resolveServerUrl(url: string, fallback?: string) {
  try {
    return new URL(url, fallback ?? "http://localhost").toString();
  } catch {
    return "http://localhost/";
  }
}
