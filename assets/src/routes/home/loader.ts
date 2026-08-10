import type { LoaderFunctionArgs } from "react-router-dom";
import type { HomeDealsRouteQuery } from "../../__generated__/HomeDealsRouteQuery.graphql";
import type { HomeWorkspaceRouteQuery } from "../../__generated__/HomeWorkspaceRouteQuery.graphql";
import {
  getRelayEnvironmentFromRouterContext,
  preloadRouteQuery,
  type RelayRouteQueryDescriptor,
} from "../../relay/route-preload";
import { isAbortError, recoverRouteLoaderError } from "../loader-errors";
import { selectedHomeCompareSlugs } from "./home-paths";
import homeDealsRouteQuery from "./queries/HomeDealsRouteQuery";
import homeWorkspaceRouteQuery from "./queries/HomeWorkspaceRouteQuery";

export type HomeLoaderData = {
  deals: Promise<RelayRouteQueryDescriptor<HomeDealsRouteQuery["variables"]> | null>;
  selectedSlugs: string[];
  workspace: RelayRouteQueryDescriptor<HomeWorkspaceRouteQuery["variables"]> | null;
};

export async function homeLoader({
  context,
  request,
}: LoaderFunctionArgs): Promise<HomeLoaderData> {
  const environment = getRelayEnvironmentFromRouterContext(context);
  const selectedSlugs = selectedHomeCompareSlugs(new URL(request.url).search);
  const variables = { selectedSlugs };
  const workspace = preloadRouteQuery<HomeWorkspaceRouteQuery>(
    environment,
    homeWorkspaceRouteQuery,
    variables,
    { signal: request.signal },
  );
  const deals = preloadRouteQuery<HomeDealsRouteQuery>(
    environment,
    homeDealsRouteQuery,
    variables,
    { signal: request.signal },
  ).catch((error: unknown) =>
    recoverRouteLoaderError(error, "Failed to preload home deals route query.", null),
  );

  try {
    return { deals, selectedSlugs, workspace: await workspace };
  } catch (error) {
    if (request.signal.aborted || isAbortError(error)) {
      throw error;
    }

    console.error("Failed to preload home workspace route query.", { error });
    return { deals, selectedSlugs, workspace: null };
  }
}
