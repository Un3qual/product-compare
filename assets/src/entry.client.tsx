import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { RelayEnvironmentProvider } from "react-relay";
import { createRelayEnvironment } from "./relay/environment";
import { readRelayRecordsFromDocument } from "./relay/ssr";
import { createClientRouter } from "./router";

const root = document.getElementById("root");
const relayEnvironment = createRelayEnvironment({
  records: readRelayRecordsFromDocument()
});

if (!root) {
  throw new Error("missing #root element");
}

const app = (
  <StrictMode>
    <RelayEnvironmentProvider environment={relayEnvironment}>
      <RouterProvider router={createClientRouter(relayEnvironment)} />
    </RelayEnvironmentProvider>
  </StrictMode>
);

if (root.hasChildNodes()) {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}
