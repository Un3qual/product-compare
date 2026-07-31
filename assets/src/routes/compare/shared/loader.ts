import { data, type LoaderFunctionArgs } from "react-router-dom";
import type { SharedComparisonRouteQuery } from "../../../__generated__/SharedComparisonRouteQuery.graphql";
import {
  fetchRouteQuery,
  getRelayEnvironmentFromRouterContext,
  type RelayRouteQueryDescriptor,
} from "../../../relay/route-preload";
import { normalizeRouteLoaderThrownError } from "../../loader-errors";
import { routeMetadataFromSeo } from "../../seo";
import type { RouteDocumentMetadata } from "../../RouteMetadata";
import sharedComparisonRouteQuery from "./queries/SharedComparisonRouteQuery";

export type SharedComparisonLoaderData =
  | {
      status: "ready";
      metadata: RouteDocumentMetadata;
      query: RelayRouteQueryDescriptor<SharedComparisonRouteQuery["variables"]>;
    }
  | { status: "not_found" };

export async function sharedComparisonLoader({ context, params, request }: LoaderFunctionArgs) {
  const token = params.token?.trim() ?? "";
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return notFound();
  const environment = getRelayEnvironmentFromRouterContext(context);

  try {
    const fetched = await fetchRouteQuery<SharedComparisonRouteQuery>(
      environment,
      sharedComparisonRouteQuery,
      { token },
      { signal: request.signal },
    );
    if (!fetched.data.comparisonSnapshot) {
      fetched.dispose();
      return notFound();
    }
    return {
      status: "ready" as const,
      metadata: routeMetadataFromSeo(fetched.data.comparisonSnapshot.seo, request.url, {
        allowIndexing: new URL(request.url).search === "",
      }),
      query: fetched.descriptor,
    };
  } catch (error) {
    throw normalizeRouteLoaderThrownError(error, "Shared comparison fetch failed");
  }
}

function notFound() {
  return data<SharedComparisonLoaderData>({ status: "not_found" }, { status: 404 });
}
