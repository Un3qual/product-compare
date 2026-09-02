import { renderToReadableStream } from "react-dom/server";
import { RelayEnvironmentProvider } from "react-relay";
import { ServerRouter, type EntryContext, type RouterContextProvider } from "react-router";
import "./ui/theme/tokens.stylex";
import { getRelayEnvironmentFromRouterContext } from "./relay/route-preload";

export const streamTimeout = 10_000;

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  loadContext: RouterContextProvider,
) {
  if (request.method.toUpperCase() === "HEAD") {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders,
    });
  }

  const relayEnvironment = getRelayEnvironmentFromRouterContext(loadContext);
  const body = await renderToReadableStream(
    <RelayEnvironmentProvider environment={relayEnvironment}>
      <ServerRouter context={routerContext} url={request.url} />
    </RelayEnvironmentProvider>,
    {
      signal: AbortSignal.timeout(streamTimeout),
      onError(error) {
        responseStatusCode = 500;
        console.error(error);
      },
    },
  );

  await body.allReady;
  responseHeaders.set("Content-Type", "text/html; charset=utf-8");

  return new Response(body, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
}
