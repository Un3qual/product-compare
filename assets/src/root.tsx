// StyleX constants must register before route and component modules inject rules that use them.
import "./ui/theme/tokens.stylex";
import type { ReactNode } from "react";
import { graphql, usePreloadedQuery, useRelayEnvironment } from "react-relay";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  type ShouldRevalidateFunctionArgs,
} from "react-router";
import type { Environment } from "relay-runtime";
import type { Route } from "./+types/root";
import type { RootRouteQuery } from "$generated/RootRouteQuery.graphql";
import { staticRouteMetaDescriptors } from "$frontend/seo";
import {
  fetchRouteQuery,
  getRelayEnvironmentFromRouterContext,
  setRelayEnvironmentOnRouterContext,
  useRoutePreloadedQuery,
  type RelayRouteQueryDescriptor,
} from "$relay/route-preload";
import { createRelayEnvironment } from "$relay/environment";
import {
  dehydrateRelayEnvironment,
  RELAY_RECORDS_SCRIPT_ID,
  serializeRelayRecords,
} from "$relay/ssr";
import { AppShell } from "$ui/components/layout/AppShell";
import { AppProviders } from "$ui/providers/AppProviders";
import { RouteErrorBoundary } from "$routes/compare/RouteErrorBoundary";
import { RootPrimaryNavigation } from "$routes/RootDestinations";
import { rootViewerFromRelayRecord, type RootViewer } from "$routes/root/viewer";

const rootRouteQuery = graphql`
  query RootRouteQuery {
    viewer {
      id
      email
      isOperator
    }
  }
`;

const RELAY_ROOT_ID = "client:root";
const RELAY_LINKED_RECORD_REF_KEY = "__ref";

export const middleware = [
  ({ context, request }, next) => {
    setRelayEnvironmentOnRouterContext(
      context,
      createRelayEnvironment({ ssrContext: { request } }),
    );
    return next();
  },
] satisfies Route.MiddlewareFunction[];

async function loadRoot({ context, request }: Route.LoaderArgs) {
  const environment = getRelayEnvironmentFromRouterContext(context);

  try {
    const fetchedViewer = await fetchRouteQuery<RootRouteQuery>(
      environment,
      rootRouteQuery,
      {},
      { signal: request.signal },
    );

    return {
      viewer: fetchedViewer.data.viewer,
      viewerQuery: fetchedViewer.descriptor,
    };
  } catch {
    request.signal.throwIfAborted();
    return {
      viewer: readCachedRootViewer(environment),
      viewerQuery: null,
    };
  }
}

export { loadRoot as clientLoader, loadRoot as loader };

export function shouldRevalidate({ currentUrl, nextUrl }: ShouldRevalidateFunctionArgs) {
  return isAuthRoutePath(currentUrl.pathname) || isAuthRoutePath(nextUrl.pathname);
}

export function meta() {
  return staticRouteMetaDescriptors();
}

export function Layout({ children }: { children: ReactNode }) {
  const environment = useRelayEnvironment();
  const records = serializeRelayRecords(dehydrateRelayEnvironment(environment));

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{ __html: records }}
          id={RELAY_RECORDS_SCRIPT_ID}
          type="application/json"
        />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const loaderData = useLoaderData<typeof loadRoot>();

  if (!loaderData.viewerQuery) {
    return <RootShell viewer={loaderData.viewer} />;
  }

  return <ReadyRoot viewerQuery={loaderData.viewerQuery} />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <RouteErrorBoundary error={error} resourceName="page" title="Product Compare" />;
}

function ReadyRoot({
  viewerQuery,
}: {
  viewerQuery: RelayRouteQueryDescriptor<RootRouteQuery["variables"]>;
}) {
  const queryRef = useRoutePreloadedQuery<RootRouteQuery>(rootRouteQuery, viewerQuery);
  const data = usePreloadedQuery<RootRouteQuery>(rootRouteQuery, queryRef);

  return <RootShell viewer={data.viewer} />;
}

function RootShell({ viewer }: { viewer: RootViewer | null }) {
  return (
    <AppProviders>
      <AppShell navigation={<RootPrimaryNavigation viewer={viewer} />}>
        <Outlet context={{ viewer }} />
      </AppShell>
    </AppProviders>
  );
}

function readCachedRootViewer(environment: Environment) {
  const source = environment.getStore().getSource();
  const rootRecord = source.get(RELAY_ROOT_ID);
  const viewerRecordId = linkedRecordId(rootRecord?.viewer);
  return viewerRecordId ? rootViewerFromRelayRecord(source.get(viewerRecordId)) : null;
}

function linkedRecordId(value: unknown) {
  if (!value || typeof value !== "object") return null;
  if (!(RELAY_LINKED_RECORD_REF_KEY in value)) return null;

  const recordId = value[RELAY_LINKED_RECORD_REF_KEY];
  return typeof recordId === "string" ? recordId : null;
}

function isAuthRoutePath(pathname: string) {
  return pathname === "/auth" || pathname.startsWith("/auth/");
}
