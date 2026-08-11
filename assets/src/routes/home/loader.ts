import type { LoaderFunctionArgs } from "react-router-dom";
import type { HomeWorkspaceRouteQuery } from "../../__generated__/HomeWorkspaceRouteQuery.graphql";
import {
  getRelayEnvironmentFromRouterContext,
  preloadRouteQuery,
  type RelayRouteQueryDescriptor,
} from "../../relay/route-preload";
import { isAbortError } from "../loader-errors";
import { selectedHomeCompareSlugs } from "./home-paths";
import homeWorkspaceRouteQuery from "./queries/HomeWorkspaceRouteQuery";

export type HomeLoaderData = {
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
  try {
    return { selectedSlugs, workspace: await workspace };
  } catch (error) {
    if (request.signal.aborted || isAbortError(error)) {
      throw error;
    }

    console.error("Failed to preload home workspace route query.", { error });
    return { selectedSlugs, workspace: null };
  }
}
