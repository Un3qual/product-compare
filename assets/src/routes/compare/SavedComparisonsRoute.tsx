import { useRef, useState } from "react";
import { Link, useLoaderData } from "react-router-dom";
import { useMutation } from "react-relay";
import deleteSavedComparisonSetMutation, {
  type DeleteSavedComparisonSetMutation
} from "../../__generated__/DeleteSavedComparisonSetMutation.graphql";
import savedComparisonsRouteQuery, {
  type SavedComparisonsRouteQuery
} from "../../__generated__/SavedComparisonsRouteQuery.graphql";
import { stableJsonValue, useRoutePreloadedQuery } from "../../relay/route-preload";
import { FeedbackState } from "../../ui/components/feedback/FeedbackState";
import { Button } from "../../ui/primitives/Button";
import { commitRouteMutation } from "../relay-mutations";
import {
  DEFAULT_ROUTE_ERROR_MESSAGE,
  hasRouteGraphQLErrors,
  routeMutationErrorMessage
} from "../route-errors";
import type {
  savedComparisonsLoader,
  SavedComparisonSetQueryDescriptor,
  SavedComparisonSetSummary,
  SavedComparisonsRouteLoaderData
} from "./saved-data";
import { CompareShell } from "./CompareShell";
import {
  SavedComparisonSetList,
  type SavedComparisonSortMode
} from "./SavedComparisonSetList";

export function SavedComparisonsRoute() {
  const loaderData = useLoaderData<typeof savedComparisonsLoader>();
  const [deletedSavedSetIds, setDeletedSavedSetIds] = useState<ReadonlySet<string>>(new Set());
  const [pendingDeleteIds, setPendingDeleteIds] = useState<ReadonlySet<string>>(new Set());
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");
  const [sortMode, setSortMode] = useState<SavedComparisonSortMode>("current");
  const inFlightDeleteIdsRef = useRef<Set<string>>(new Set());
  const [commitDeleteSavedComparisonSet] = useMutation<DeleteSavedComparisonSetMutation>(
    deleteSavedComparisonSetMutation
  );

  function finishDelete(savedComparisonSetId: string) {
    inFlightDeleteIdsRef.current.delete(savedComparisonSetId);
    setPendingDeleteIds((currentPendingDeleteIds) =>
      removeSetValue(currentPendingDeleteIds, savedComparisonSetId)
    );
  }

  function handleDelete(savedComparisonSetId: string) {
    if (inFlightDeleteIdsRef.current.has(savedComparisonSetId)) {
      return;
    }

    inFlightDeleteIdsRef.current.add(savedComparisonSetId);
    setPendingDeleteIds((currentPendingDeleteIds) =>
      addSetValue(currentPendingDeleteIds, savedComparisonSetId)
    );
    setDeleteError(null);

    commitRouteMutation(
      commitDeleteSavedComparisonSet,
      {
        variables: {
          savedComparisonSetId
        },
        onCompleted: (response, graphQLErrors) => {
          const payload = response.deleteSavedComparisonSet;
          const deletedSavedSetId = payload?.savedComparisonSet?.id;

          if (deletedSavedSetId && !hasRouteGraphQLErrors(graphQLErrors)) {
            setDeleteError(null);
            setDeletedSavedSetIds((currentDeletedSavedSetIds) =>
              addSetValue(currentDeletedSavedSetIds, deletedSavedSetId)
            );
          } else {
            setDeleteError(routeMutationErrorMessage(payload?.errors, graphQLErrors));
          }

          finishDelete(savedComparisonSetId);
        },
        onError: () => {
          setDeleteError(DEFAULT_ROUTE_ERROR_MESSAGE);
          finishDelete(savedComparisonSetId);
        }
      },
      () => {
        setDeleteError(DEFAULT_ROUTE_ERROR_MESSAGE);
        finishDelete(savedComparisonSetId);
      }
    );
  }

  const viewState = buildSavedComparisonsViewState(
    loaderData,
    deletedSavedSetIds,
    filterText,
    sortMode
  );
  const savedSetQueries =
    loaderData.status === "unauthorized" ? [] : (loaderData.savedSetQueries ?? []);
  const shouldShowReturnActions =
    loaderData.status !== "unauthorized" && viewState.savedSets.length === 0;
  const pagination = buildSavedComparisonsPagination(loaderData);
  return (
    <CompareShell title="Saved comparisons">
      <p aria-label="Saved comparisons status" aria-live="polite" role="status">
        {viewState.statusMessage}
      </p>
      {loaderData.status === "unauthorized" ? (
        <Button asChild variant="solid">
          <Link to="/auth/login">Sign in to view saved comparisons</Link>
        </Button>
      ) : (
        <SavedComparisonSetList
          actions={{
            onDelete: handleDelete,
            onOpenComparison: savedComparisonHref,
            pendingDeleteIds
          }}
          controls={{
            filterText,
            onFilterTextChange: setFilterText,
            onSortModeChange: setSortMode,
            sortMode
          }}
          pagination={pagination}
          savedSets={viewState.savedSets}
        >
          {deleteError ? <FeedbackState kind="error" title={deleteError} /> : null}
          {shouldShowReturnActions ? <SavedComparisonReturnActions /> : null}
          {savedSetQueries.length > 0 ? (
            <SavedComparisonSetQueryRetainers savedSetQueries={savedSetQueries} />
          ) : null}
        </SavedComparisonSetList>
      )}
    </CompareShell>
  );
}

function savedComparisonHref(savedSet: SavedComparisonSetSummary) {
  return buildSavedComparisonHref(savedSet.products.map(({ slug }) => slug));
}

function savedComparisonsPagePath(after: string) {
  const searchParams = new URLSearchParams({ after });

  return `/compare/saved?${searchParams.toString()}`;
}

function buildSavedComparisonsPagination(loaderData: SavedComparisonsRouteLoaderData) {
  if (loaderData.status === "unauthorized") {
    return { firstHref: null, nextHref: null };
  }

  return {
    firstHref: loaderData.after ? "/compare/saved" : null,
    nextHref:
      loaderData.hasNextPage && loaderData.endCursor
        ? savedComparisonsPagePath(loaderData.endCursor)
        : null
  };
}

function SavedComparisonSetQueryRetainers({
  savedSetQueries
}: {
  savedSetQueries: SavedComparisonSetQueryDescriptor[];
}) {
  return (
    <>
      {savedSetQueries.map((savedSetQuery) => (
        <SavedComparisonSetQueryRetainer
          key={savedComparisonSetQueryKey(savedSetQuery)}
          savedSetQuery={savedSetQuery}
        />
      ))}
    </>
  );
}

function SavedComparisonSetQueryRetainer({
  savedSetQuery
}: {
  savedSetQuery: SavedComparisonSetQueryDescriptor;
}) {
  useRoutePreloadedQuery<SavedComparisonsRouteQuery>(
    savedComparisonsRouteQuery,
    savedSetQuery
  );

  return null;
}

function buildSavedComparisonHref(slugs: string[]) {
  const searchParams = new URLSearchParams();

  for (const slug of slugs) {
    searchParams.append("slug", slug);
  }

  return `/compare?${searchParams.toString()}`;
}

function SavedComparisonReturnActions() {
  return (
    <nav aria-label="Saved comparison return paths">
      <Link to="/products">Browse products</Link>{" "}
      <Link to="/compare">Start a new comparison</Link>
    </nav>
  );
}

export function savedComparisonSetQueryKey(savedSetQuery: SavedComparisonSetQueryDescriptor) {
  return `${savedSetQuery.__relayQuery.operationName}:${JSON.stringify(
    stableJsonValue(savedSetQuery.__relayQuery.variables)
  )}`;
}

function addSetValue<T>(currentValues: ReadonlySet<T>, nextValue: T): ReadonlySet<T> {
  if (currentValues.has(nextValue)) {
    return currentValues;
  }

  return new Set(currentValues).add(nextValue);
}

function removeSetValue<T>(currentValues: ReadonlySet<T>, removedValue: T): ReadonlySet<T> {
  if (!currentValues.has(removedValue)) {
    return currentValues;
  }

  const nextValues = new Set(currentValues);
  nextValues.delete(removedValue);
  return nextValues;
}

const buildSavedComparisonsStatus = (
  loaderData: SavedComparisonsRouteLoaderData,
  visibleSavedSets: SavedComparisonSetSummary[],
  hasLocalDeletion: boolean,
  hasFilter: boolean,
  hasLoadedSavedSets: boolean
) => {
  if (loaderData.status === "unauthorized") {
    return "Sign in to view saved comparisons.";
  }

  if (hasLocalDeletion) {
    return "Comparison deleted.";
  }

  if (hasFilter && hasLoadedSavedSets && visibleSavedSets.length === 0) {
    return "No saved comparisons match your filter.";
  }

  if (visibleSavedSets.length === 0) {
    return "No saved comparisons yet.";
  }

  return "";
};

function buildSavedComparisonsViewState(
  loaderData: SavedComparisonsRouteLoaderData,
  deletedSavedSetIds: ReadonlySet<string>,
  filterText: string,
  sortMode: SavedComparisonSortMode
) {
  const {
    hasDeletedSavedSet,
    hasFilter,
    hasLoadedSavedSets,
    savedSets
  } = visibleSavedComparisonSets(
    loaderData.savedSets,
    deletedSavedSetIds,
    filterText,
    sortMode
  );

  return {
    savedSets,
    statusMessage: buildSavedComparisonsStatus(
      loaderData,
      savedSets,
      hasDeletedSavedSet,
      hasFilter,
      hasLoadedSavedSets
    )
  };
}

function visibleSavedComparisonSets(
  savedSets: readonly SavedComparisonSetSummary[],
  deletedSavedSetIds: ReadonlySet<string>,
  filterText: string,
  sortMode: SavedComparisonSortMode
) {
  const normalizedFilter = filterText.trim().toLowerCase();
  const visibleSavedSets: SavedComparisonSetSummary[] = [];
  let hasDeletedSavedSet = false;

  for (const savedSet of savedSets) {
    if (deletedSavedSetIds.has(savedSet.id)) {
      hasDeletedSavedSet = true;
      continue;
    }

    if (
      normalizedFilter === "" ||
      savedComparisonSetMatchesFilter(savedSet, normalizedFilter)
    ) {
      visibleSavedSets.push(savedSet);
    }
  }

  return {
    hasDeletedSavedSet,
    hasFilter: normalizedFilter !== "",
    hasLoadedSavedSets: savedSets.length > 0,
    savedSets: sortSavedComparisonSets(visibleSavedSets, sortMode)
  };
}

function sortSavedComparisonSets(
  savedSets: SavedComparisonSetSummary[],
  sortMode: SavedComparisonSortMode
) {
  if (sortMode === "current") {
    return savedSets;
  }

  const sortedSavedSets = [...savedSets];

  switch (sortMode) {
    case "name-asc":
      sortedSavedSets.sort((left, right) =>
        left.name.localeCompare(right.name, undefined, { sensitivity: "base" })
      );
      break;
    case "product-count-desc":
      sortedSavedSets.sort((left, right) => right.products.length - left.products.length);
      break;
    case "product-count-asc":
      sortedSavedSets.sort((left, right) => left.products.length - right.products.length);
      break;
    default: {
      const exhaustiveCheck: never = sortMode;
      return exhaustiveCheck;
    }
  }

  return sortedSavedSets;
}

function savedComparisonSetMatchesFilter(
  savedSet: SavedComparisonSetSummary,
  normalizedFilter: string
) {
  if (savedSet.name.toLowerCase().includes(normalizedFilter)) {
    return true;
  }

  return savedSet.products.some(
    ({ name, slug }) =>
      name.toLowerCase().includes(normalizedFilter) ||
      slug.toLowerCase().includes(normalizedFilter)
  );
}
