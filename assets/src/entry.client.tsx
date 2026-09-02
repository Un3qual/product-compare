import "./ui/theme/tokens.stylex";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { RelayEnvironmentProvider } from "react-relay";
import { createRelayEnvironment } from "./relay/environment";
import { readRelayRecordsFromDocument } from "./relay/ssr";
import { createRelayRouterContext } from "./relay/route-preload";

const relayEnvironment = createRelayEnvironment({
  records: readRelayRecordsFromDocument(),
});

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <RelayEnvironmentProvider environment={relayEnvironment}>
        <HydratedRouter getContext={() => createRelayRouterContext(relayEnvironment)} />
      </RelayEnvironmentProvider>
    </StrictMode>,
  );
});
