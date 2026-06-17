import type { LoaderFunctionArgs } from "react-router-dom";
import merchantFeedCandidatesRouteQuery, {
  type MerchantFeedCandidatesRouteQuery
} from "../../../__generated__/MerchantFeedCandidatesRouteQuery.graphql";
import {
  getRelayEnvironmentFromRouterContext,
  preloadRouteQuery,
  type RelayRouteQueryDescriptor
} from "../../../relay/route-preload";
import { recoverRouteLoaderError } from "../../loader-errors";
import {
  feedCandidatesPaginationFromUrl,
  type FeedCandidatesPagination
} from "./pagination";

export type FeedCandidatesLoaderData =
  | {
      status: "ready";
      pagination: FeedCandidatesPagination;
      query: RelayRouteQueryDescriptor<MerchantFeedCandidatesRouteQuery["variables"]>;
    }
  | {
      status: "error";
      pagination: FeedCandidatesPagination;
    };

export async function feedCandidatesLoader({
  context,
  request
}: LoaderFunctionArgs): Promise<FeedCandidatesLoaderData> {
  const environment = getRelayEnvironmentFromRouterContext(context);
  const pagination = feedCandidatesPaginationFromUrl(new URL(request.url));

  try {
    return {
      status: "ready",
      pagination,
      query: await preloadRouteQuery<MerchantFeedCandidatesRouteQuery>(
        environment,
        merchantFeedCandidatesRouteQuery,
        pagination,
        { signal: request.signal }
      )
    };
  } catch (error) {
    return recoverRouteLoaderError<FeedCandidatesLoaderData>(
      error,
      "Failed to preload feed candidates route query.",
      {
        status: "error",
        pagination
      }
    );
  }
}
