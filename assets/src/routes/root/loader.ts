import type { LoaderFunctionArgs } from "react-router-dom";
import type { Environment } from "relay-runtime";
import rootViewerRouteQuery, {
  type RootViewerRouteQuery
} from "../../__generated__/RootViewerRouteQuery.graphql";
import {
  fetchRouteQuery,
  getRelayEnvironmentFromRouterContext,
  type RelayRouteQueryDescriptor
} from "../../relay/route-preload";

export const ROOT_ROUTE_ID = "root";
const RELAY_ROOT_ID = "client:root";
const RELAY_LINKED_RECORD_REF_KEY = "__ref";

export type RootViewer = {
  id: string;
  email: string;
  isOperator: boolean;
};

export type RootViewerQueryDescriptor = RelayRouteQueryDescriptor<
  RootViewerRouteQuery["variables"]
>;

export type RootLoaderData =
  | {
      status: "ready";
      viewer: RootViewer | null;
      viewerQuery: RootViewerQueryDescriptor;
    }
  | {
      status: "degraded";
      viewer: RootViewer | null;
      viewerQuery: null;
    };

export async function rootLoader({
  context,
  request
}: LoaderFunctionArgs): Promise<RootLoaderData> {
  const environment = getRelayEnvironmentFromRouterContext(context);

  try {
    const fetchedViewer = await fetchRouteQuery<RootViewerRouteQuery>(
      environment,
      rootViewerRouteQuery,
      {},
      { signal: request.signal }
    );

    return {
      status: "ready",
      viewer: normalizeViewer(fetchedViewer.data.viewer),
      viewerQuery: fetchedViewer.descriptor
    };
  } catch {
    throwIfAborted(request.signal);

    return {
      status: "degraded",
      viewer: readCachedRootViewer(environment),
      viewerQuery: null
    };
  }
}

function readCachedRootViewer(environment: Environment): RootViewer | null {
  const source = environment.getStore().getSource();
  const rootRecord = source.get(RELAY_ROOT_ID);
  const viewerRecordId = linkedRecordId(rootRecord?.viewer);

  if (!viewerRecordId) {
    return null;
  }

  return normalizeViewer(source.get(viewerRecordId));
}

function linkedRecordId(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const recordId = (value as { [RELAY_LINKED_RECORD_REF_KEY]?: unknown })[
    RELAY_LINKED_RECORD_REF_KEY
  ];

  return typeof recordId === "string" ? recordId : null;
}

function throwIfAborted(signal?: AbortSignal) {
  if (!signal?.aborted) {
    return;
  }

  if (signal.reason !== undefined) {
    throw normalizeAbortReason(signal.reason);
  }

  throw new Error("Request aborted");
}

function normalizeAbortReason(reason: unknown) {
  if (reason instanceof Error) {
    return reason;
  }

  return new Error(String(reason));
}

function normalizeViewer(viewer: unknown): RootViewer | null {
  if (!viewer || typeof viewer !== "object") {
    return null;
  }

  const candidate = viewer as { email?: unknown; id?: unknown; isOperator?: unknown };

  if (
    typeof candidate.id !== "string" ||
    typeof candidate.email !== "string" ||
    typeof candidate.isOperator !== "boolean"
  ) {
    return null;
  }

  return {
    id: candidate.id,
    email: candidate.email,
    isOperator: candidate.isOperator
  };
}
