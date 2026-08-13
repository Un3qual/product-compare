import { Suspense } from "react";
import { Link, useLoaderData, type LoaderFunctionArgs } from "react-router-dom";
import { graphql, usePreloadedQuery } from "react-relay";
import type { GraphQLResponse } from "relay-runtime";
import type { SavedComparisonsRouteQuery } from "$generated/SavedComparisonsRouteQuery.graphql";
import { graphQLResponseHasErrorCode, RouteLoaderGraphQLError } from "$relay/environment";
import {
  fetchRouteQuery,
  getRelayEnvironmentFromRouterContext,
  useRoutePreloadedQuery,
  type RelayRouteQueryDescriptor,
} from "$relay/route-preload";
import { FeedbackState } from "$ui/components/feedback/FeedbackState";
import { Button } from "$ui/primitives/Button";
import { CompareShell } from "../CompareShell";
import { SavedComparisonSetList } from "./SavedComparisonSetList";
import { buildSavedComparisonsPagination } from "./saved-comparisons-route";

const SAVED_COMPARISON_SETS_PAGE_SIZE = 20;
const SAVED_COMPARISONS_AUTH_ERROR_CODES = new Set(["UNAUTHENTICATED"]);

const savedComparisonsRouteQuery = graphql`
  query SavedComparisonsRouteQuery($first: Int!, $after: String) {
    mySavedComparisonSets(first: $first, after: $after) {
      ...SavedComparisonSetList_savedSets
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export type SavedComparisonsRouteLoaderData =
  | {
      status: "ready";
      after: string | null;
      query: RelayRouteQueryDescriptor<SavedComparisonsRouteQuery["variables"]>;
    }
  | { status: "unauthorized" };

export function SavedComparisonsRoute() {
  const loaderData = useLoaderData<typeof savedComparisonsLoader>();

  return (
    <CompareShell title="Saved comparisons">
      {loaderData.status === "unauthorized" ? (
        <UnauthorizedSavedComparisons />
      ) : (
        <Suspense fallback={<FeedbackState kind="loading" title="Loading saved comparisons..." />}>
          <SavedComparisonsPage after={loaderData.after} query={loaderData.query} />
        </Suspense>
      )}
    </CompareShell>
  );
}

function UnauthorizedSavedComparisons() {
  return (
    <>
      <p aria-label="Saved comparisons status" aria-live="polite" role="status">
        Sign in to view saved comparisons.
      </p>
      <Button render={<Link to="/auth/login" />}>Sign in to view saved comparisons</Button>
    </>
  );
}

function SavedComparisonsPage({
  after,
  query,
}: {
  after: string | null;
  query: Extract<SavedComparisonsRouteLoaderData, { status: "ready" }>["query"];
}) {
  const queryRef = useRoutePreloadedQuery<SavedComparisonsRouteQuery>(
    savedComparisonsRouteQuery,
    query,
  );
  const data = usePreloadedQuery<SavedComparisonsRouteQuery>(savedComparisonsRouteQuery, queryRef);
  const connection = data.mySavedComparisonSets;

  if (!connection) {
    return <FeedbackState kind="error" title="Saved comparisons are unavailable." />;
  }

  return (
    <SavedComparisonSetList
      fragmentRef={connection}
      pagination={buildSavedComparisonsPagination({
        after,
        endCursor: connection.pageInfo.endCursor,
        hasNextPage: connection.pageInfo.hasNextPage,
        status: "ready",
      })}
    />
  );
}

export async function savedComparisonsLoader({
  context,
  request,
}: LoaderFunctionArgs): Promise<SavedComparisonsRouteLoaderData> {
  const environment = getRelayEnvironmentFromRouterContext(context);
  const after = nonBlankSearchParam(new URL(request.url).searchParams.get("after"));
  let fetchedPage: Awaited<ReturnType<typeof fetchRouteQuery<SavedComparisonsRouteQuery>>> | null =
    null;

  try {
    throwIfAborted(request.signal);
    fetchedPage = await fetchRouteQuery<SavedComparisonsRouteQuery>(
      environment,
      savedComparisonsRouteQuery,
      after === null
        ? { first: SAVED_COMPARISON_SETS_PAGE_SIZE }
        : { first: SAVED_COMPARISON_SETS_PAGE_SIZE, after },
      { signal: request.signal },
    );
    throwIfAborted(request.signal);

    const pageInfo = fetchedPage.data.mySavedComparisonSets?.pageInfo;
    if (!pageInfo) {
      throw new Error("Failed to read saved comparison pagination");
    }
    if (pageInfo.hasNextPage && (!pageInfo.endCursor || pageInfo.endCursor === after)) {
      throw new Error("Invalid pagination cursor");
    }

    return { status: "ready", after, query: fetchedPage.descriptor };
  } catch (error) {
    fetchedPage?.dispose();

    if (isUnauthorizedSavedComparisonsError(error)) {
      return { status: "unauthorized" };
    }

    throw error;
  }
}

function nonBlankSearchParam(value: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function throwIfAborted(signal?: AbortSignal) {
  if (!signal?.aborted) return;
  if (signal.reason instanceof Error) throw signal.reason;
  throw new Error("Request aborted");
}

export function isUnauthorizedSavedComparisonsError(error: unknown) {
  return (
    error instanceof RouteLoaderGraphQLError &&
    isUnauthorizedSavedComparisonsResponse(error.response)
  );
}

export function isUnauthorizedSavedComparisonsResponse(response: GraphQLResponse) {
  return graphQLResponseHasErrorCode(
    response,
    SAVED_COMPARISONS_AUTH_ERROR_CODES,
    "mySavedComparisonSets",
  );
}
