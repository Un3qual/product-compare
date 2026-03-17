import { renderToReadableStream } from "react-dom/server";
import { RouterProvider } from "react-router-dom";
import { RelayEnvironmentProvider } from "react-relay";
import { createRelayEnvironment } from "./relay/environment";
import { createServerRouter } from "./router";

const STREAM_ABORT_DELAY_MS = 10_000;
type ReactReadableStream = ReadableStream & { allReady: Promise<void> };

export async function render(url: string): Promise<string> {
  const relayEnvironment = createRelayEnvironment();
  let renderError: unknown;

  const htmlStream: ReactReadableStream = await renderToReadableStream(
    <RelayEnvironmentProvider environment={relayEnvironment}>
      <RouterProvider router={createServerRouter(url)} />
    </RelayEnvironmentProvider>,
    {
      onError(error) {
        renderError = error;
      }
    }
  );

  await waitForAllReady(htmlStream);

  if (renderError) {
    throw renderError;
  }

  return new Response(htmlStream).text();
}

async function waitForAllReady(stream: ReactReadableStream) {
  const timeout = new Promise<never>((_, reject) => {
    const timer = setTimeout(() => {
      void stream.cancel();
      reject(new Error("timed out streaming server render"));
    }, STREAM_ABORT_DELAY_MS);

    stream.allReady.finally(() => clearTimeout(timer));
  });

  await Promise.race([stream.allReady, timeout]);
}
