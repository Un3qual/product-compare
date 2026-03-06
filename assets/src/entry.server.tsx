import { renderToString } from "react-dom/server";
import { RouterProvider } from "react-router-dom";
import { RelayEnvironmentProvider } from "react-relay";
import { createRelayEnvironment } from "./relay/environment";
import { createServerRouter } from "./router";

export function render(url: string) {
  const relayEnvironment = createRelayEnvironment();

  return renderToString(
    <RelayEnvironmentProvider environment={relayEnvironment}>
      <RouterProvider router={createServerRouter(url)} />
    </RelayEnvironmentProvider>
  );
}
