import type { LoaderFunctionArgs } from "react-router-dom";
import rootViewerRouteQuery, {
  type RootViewerRouteQuery
} from "../../__generated__/RootViewerRouteQuery.graphql";
import {
  fetchRouteQuery,
  getRelayEnvironmentFromRouterContext,
  type RelayRouteQueryDescriptor
} from "../../relay/route-preload";

export const ROOT_ROUTE_ID = "root";

export type RootViewer = {
  id: string;
  email: string;
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
      status: "guest";
      viewer: null;
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
      status: "guest",
      viewer: null,
      viewerQuery: null
    };
  }
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

  const candidate = viewer as { email?: unknown; id?: unknown };

  if (typeof candidate.id !== "string" || typeof candidate.email !== "string") {
    return null;
  }

  return {
    id: candidate.id,
    email: candidate.email
  };
}
