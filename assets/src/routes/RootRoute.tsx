import { graphql, usePreloadedQuery } from "react-relay";
import { Outlet, useLoaderData, type LoaderFunctionArgs } from "react-router-dom";
import type { Environment } from "relay-runtime";
import type { RootRouteQuery } from "$generated/RootRouteQuery.graphql";
import {
  fetchRouteQuery,
  getRelayEnvironmentFromRouterContext,
  useRoutePreloadedQuery,
  type RelayRouteQueryDescriptor,
} from "$relay/route-preload";
import { AppShell } from "$ui/components/layout/AppShell";
import { PageShell } from "$ui/components/layout/PageShell";
import { FeedbackState } from "$ui/components/feedback/FeedbackState";
import { AppProviders } from "$ui/providers/AppProviders";
import { RootPrimaryNavigation } from "./RootDestinations";
import { RouteMetadata } from "./RouteMetadata";
import { rootViewerFromRelayRecord, type RootViewer } from "./root/viewer";

const rootRouteQuery = graphql`
  query RootRouteQuery {
    viewer {
      id
      email
      isOperator
    }
  }
`;

export const ROOT_ROUTE_ID = "root";
const RELAY_ROOT_ID = "client:root";
const RELAY_LINKED_RECORD_REF_KEY = "__ref";

export type RootViewerQueryDescriptor = RelayRouteQueryDescriptor<RootRouteQuery["variables"]>;

export type RootLoaderData = {
  viewer: RootViewer | null;
  viewerQuery: RootViewerQueryDescriptor | null;
};

type RootOutletContext = {
  viewer: RootViewer | null;
};

export function RootLayout() {
  const loaderData = useLoaderData<typeof rootLoader>();

  if (!loaderData.viewerQuery) {
    return <RootLayoutShell viewer={loaderData.viewer} />;
  }

  return <ReadyRootLayout viewerQuery={loaderData.viewerQuery} />;
}

export function RootHydrateFallback() {
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

function ReadyRootLayout({ viewerQuery }: { viewerQuery: RootViewerQueryDescriptor }) {
  const queryRef = useRoutePreloadedQuery<RootRouteQuery>(rootRouteQuery, viewerQuery);
  const data = usePreloadedQuery<RootRouteQuery>(rootRouteQuery, queryRef);

  return <RootLayoutShell viewer={data.viewer} />;
}

function RootLayoutShell({ viewer }: RootOutletContext) {
  return (
    <>
      <RouteMetadata />
      <AppProviders>
        <AppShell navigation={<RootPrimaryNavigation viewer={viewer} />}>
          <Outlet context={{ viewer }} />
        </AppShell>
      </AppProviders>
    </>
  );
}

export async function rootLoader({
  context,
  request,
}: LoaderFunctionArgs): Promise<RootLoaderData> {
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

function readCachedRootViewer(environment: Environment): RootViewer | null {
  const source = environment.getStore().getSource();
  const rootRecord = source.get(RELAY_ROOT_ID);
  const viewerRecordId = linkedRecordId(rootRecord?.viewer);
  return viewerRecordId ? rootViewerFromRelayRecord(source.get(viewerRecordId)) : null;
}

function linkedRecordId(value: unknown) {
  if (!value || typeof value !== "object") return null;

  const recordId = (value as { [RELAY_LINKED_RECORD_REF_KEY]?: unknown })[
    RELAY_LINKED_RECORD_REF_KEY
  ];
  return typeof recordId === "string" ? recordId : null;
}

function throwIfAborted(signal?: AbortSignal) {
  if (!signal?.aborted) return;
  if (signal.reason !== undefined) throw normalizeAbortReason(signal.reason);
  throw new Error("Request aborted");
}

function normalizeAbortReason(reason: unknown) {
  return reason instanceof Error ? reason : new Error(String(reason));
}
