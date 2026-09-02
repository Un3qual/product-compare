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
import { routeMetaDescriptors } from "$frontend/seo";
import {
  fetchRouteQuery,
  getRelayEnvironmentFromRouterContext,
  setRelayEnvironmentOnRouterContext,
  useRoutePreloadedQuery,
  type RelayRouteQueryDescriptor,
} from "$relay/route-preload";
import { createRelayEnvironment } from "$relay/environment";
import { dehydrateRelayEnvironment, serializeRelayRecords } from "$relay/ssr";
import { FeedbackState } from "$ui/components/feedback/FeedbackState";
import { AppShell } from "$ui/components/layout/AppShell";
import { PageShell } from "$ui/components/layout/PageShell";
import { AppProviders } from "$ui/providers/AppProviders";
import { RouteErrorBoundary } from "$routes/compare/RouteErrorBoundary";
import { RootPrimaryNavigation } from "$routes/RootDestinations";
import { rootViewerFromRelayRecord, type RootViewer } from "$routes/root/viewer";
import "./ui/theme/tokens.stylex";

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

export const middleware: Route.MiddlewareFunction[] = [
  async ({ context, request }, next) => {
    setRelayEnvironmentOnRouterContext(
      context,
      createRelayEnvironment({ ssrContext: { request } }),
    );
    return next();
  },
];

export function loader(args: Route.LoaderArgs) {
  return loadRoot(args);
}

export function clientLoader(args: Route.ClientLoaderArgs) {
  return loadRoot(args);
}

export function shouldRevalidate({
  currentUrl,
  nextUrl,
}: ShouldRevalidateFunctionArgs) {
  return isAuthRoutePath(currentUrl.pathname) || isAuthRoutePath(nextUrl.pathname);
}

export function meta() {
  return routeMetaDescriptors({
    description: "Choose products with clearer specifications and current offers.",
    title: "Product Compare",
  });
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
        <div id="root">{children}</div>
        <script
          dangerouslySetInnerHTML={{ __html: records }}
          id="__relayRecords"
          type="application/json"
        />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const loaderData = useLoaderData<typeof loader>();

  if (!loaderData.viewerQuery) {
    return <RootShell viewer={loaderData.viewer} />;
  }

  return <ReadyRoot viewerQuery={loaderData.viewerQuery} />;
}

export function HydrateFallback() {
  return (
    <AppShell>
      <PageShell
        description="Preparing current products, offers, and account details."
        title="Product Compare"
        width="reading"
      >
        <FeedbackState kind="loading" title="Loading Product Compare..." />
      </PageShell>
    </AppShell>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <RouteErrorBoundary error={error} resourceName="page" title="Product Compare" />;
}

async function loadRoot({ context, request }: Route.LoaderArgs | Route.ClientLoaderArgs) {
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
    throwIfAborted(request.signal);
    return {
      viewer: readCachedRootViewer(environment),
      viewerQuery: null,
    };
  }
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

function readCachedRootViewer(environment: Environment): RootViewer | null {
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

function throwIfAborted(signal: AbortSignal) {
  if (!signal.aborted) return;
  if (signal.reason !== undefined) throw normalizeAbortReason(signal.reason);
  throw new Error("Request aborted");
}

function normalizeAbortReason(reason: unknown) {
  return reason instanceof Error ? reason : new Error(String(reason));
}

function isAuthRoutePath(pathname: string) {
  return pathname === "/auth" || pathname.startsWith("/auth/");
}
