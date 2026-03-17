import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { RouterProvider } from "react-router-dom";
import { RelayEnvironmentProvider } from "react-relay";
import { createRelayEnvironment } from "./relay/environment";
import { createServerRouter } from "./router";

const STREAM_ABORT_DELAY_MS = 10_000;

export function render(url: string): Promise<string> {
  const relayEnvironment = createRelayEnvironment();
  const htmlStream = new PassThrough();

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    htmlStream.on("data", (chunk: string | Buffer) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    htmlStream.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });

    htmlStream.on("error", reject);

    const { abort, pipe } = renderToPipeableStream(
      <RelayEnvironmentProvider environment={relayEnvironment}>
        <RouterProvider router={createServerRouter(url)} />
      </RelayEnvironmentProvider>,
      {
        onAllReady() {
          clearTimeout(abortTimer);
          pipe(htmlStream);
        },
        onShellError(error) {
          clearTimeout(abortTimer);
          reject(error);
        },
        onError(error) {
          clearTimeout(abortTimer);
          reject(error);
        }
      }
    );

    const abortTimer = setTimeout(() => {
      abort();
      reject(new Error("timed out streaming server render"));
    }, STREAM_ABORT_DELAY_MS);
  });
}
