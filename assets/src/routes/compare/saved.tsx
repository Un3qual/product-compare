import { Suspense, useRef, useState } from "react";
import { Link, useLoaderData } from "react-router-dom";
import { useMutation, usePreloadedQuery } from "react-relay";
import deleteSavedComparisonSetMutation, {
  type DeleteSavedComparisonSetMutation
} from "../../__generated__/DeleteSavedComparisonSetMutation.graphql";
import savedComparisonsRouteQuery, {
  type SavedComparisonsRouteQuery
} from "../../__generated__/SavedComparisonsRouteQuery.graphql";
import { stableJsonValue, useRoutePreloadedQuery } from "../../relay/route-preload";
import { ResettableErrorBoundary } from "../../relay/resettable-error-boundary";
import { commitRouteMutation } from "../relay-mutations";
import {
  DEFAULT_ROUTE_ERROR_MESSAGE,
  hasRouteGraphQLErrors,
  routeMutationErrorMessage
} from "../route-errors";
import type {
  SavedComparisonSetQueryDescriptor,
  SavedComparisonSetSummary,
  SavedComparisonsRouteLoaderData
} from "./saved-data";
import { savedComparisonsLoader, summarizeSavedComparisonSetsPage } from "./saved-data";
import { CompareShell } from "./compare-shell";

export function SavedComparisonsRoute() {
  const loaderData = useLoaderData<typeof savedComparisonsLoader>();
  const [deletedSavedSetIds, setDeletedSavedSetIds] = useState<ReadonlySet<string>>(new Set());
  const [pendingDeleteIds, setPendingDeleteIds] = useState<ReadonlySet<string>>(new Set());
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");
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

  const viewState = buildSavedComparisonsViewState(loaderData, deletedSavedSetIds, filterText);
  const savedSetQueries =
    loaderData.status === "unauthorized" ? [] : (loaderData.savedSetQueries ?? []);

  return (
    <CompareShell title="Saved comparisons">
      <p aria-live="polite" role="status">
        {viewState.statusMessage}
      </p>
      {deleteError ? <p role="alert">{deleteError}</p> : null}
      {loaderData.status === "unauthorized" ? (
        <Link to="/auth/login">Sign in to view saved comparisons</Link>
      ) : (
        <label htmlFor="saved-comparisons-filter">
          Filter saved comparisons
          <input
            id="saved-comparisons-filter"
            onChange={(event) => {
              setFilterText(event.target.value);
            }}
            type="text"
            value={filterText}
          />
        </label>
      )}
      {viewState.savedSets.length > 0 && savedSetQueries.length > 0 ? (
        <ResettableErrorBoundary
          fallback={
            <SavedComparisonSetList
              onDelete={handleDelete}
              pendingDeleteIds={pendingDeleteIds}
              savedSets={viewState.savedSets}
            />
          }
          resetToken={savedSetQueries}
        >
          <Suspense fallback={<p role="status">Loading saved comparisons...</p>}>
            <RelaySavedComparisonSetList
              filterText={filterText}
              deletedSavedSetIds={deletedSavedSetIds}
              onDelete={handleDelete}
              pendingDeleteIds={pendingDeleteIds}
              savedSetQueries={savedSetQueries}
            />
          </Suspense>
        </ResettableErrorBoundary>
      ) : null}
      {viewState.savedSets.length > 0 && savedSetQueries.length === 0 ? (
        <SavedComparisonSetList
          onDelete={handleDelete}
          pendingDeleteIds={pendingDeleteIds}
          savedSets={viewState.savedSets}
        />
      ) : null}
    </CompareShell>
  );
}

function RelaySavedComparisonSetList({
  filterText,
  deletedSavedSetIds,
  onDelete,
  pendingDeleteIds,
  savedSetQueries
}: {
  filterText: string;
  deletedSavedSetIds: ReadonlySet<string>;
  onDelete: (savedComparisonSetId: string) => void;
  pendingDeleteIds: ReadonlySet<string>;
  savedSetQueries: SavedComparisonSetQueryDescriptor[];
}) {
  return (
    <ul aria-label="Saved comparison sets">
      {savedSetQueries.map((savedSetQuery) => (
        <RelaySavedComparisonSetPage
          filterText={filterText}
          deletedSavedSetIds={deletedSavedSetIds}
          key={savedComparisonSetQueryKey(savedSetQuery)}
          onDelete={onDelete}
          pendingDeleteIds={pendingDeleteIds}
          savedSetQuery={savedSetQuery}
        />
      ))}
    </ul>
  );
}

function RelaySavedComparisonSetPage({
  filterText,
  deletedSavedSetIds,
  onDelete,
  pendingDeleteIds,
  savedSetQuery
}: {
  filterText: string;
  deletedSavedSetIds: ReadonlySet<string>;
  onDelete: (savedComparisonSetId: string) => void;
  pendingDeleteIds: ReadonlySet<string>;
  savedSetQuery: SavedComparisonSetQueryDescriptor;
}) {
  const queryRef = useRoutePreloadedQuery<SavedComparisonsRouteQuery>(
    savedComparisonsRouteQuery,
    savedSetQuery
  );
  const data = usePreloadedQuery<SavedComparisonsRouteQuery>(
    savedComparisonsRouteQuery,
    queryRef
  );
  const page = summarizeSavedComparisonSetsPage(data);
  const filteredSavedSets = filterSavedComparisonSets(page.savedSets, filterText);
  const savedSets = filteredSavedSets.filter((savedSet) => !deletedSavedSetIds.has(savedSet.id));

  return (
    <>
      {savedSets.map((savedSet) => (
        <SavedComparisonSetItem
          key={savedSet.id}
          onDelete={onDelete}
          pendingDeleteIds={pendingDeleteIds}
          savedSet={savedSet}
        />
      ))}
    </>
  );
}

function SavedComparisonSetList({
  onDelete,
  pendingDeleteIds,
  savedSets
}: {
  onDelete: (savedComparisonSetId: string) => void;
  pendingDeleteIds: ReadonlySet<string>;
  savedSets: SavedComparisonSetSummary[];
}) {
  return (
    <ul aria-label="Saved comparison sets">
      {savedSets.map((savedSet) => (
        <SavedComparisonSetItem
          key={savedSet.id}
          onDelete={onDelete}
          pendingDeleteIds={pendingDeleteIds}
          savedSet={savedSet}
        />
      ))}
    </ul>
  );
}

function buildSavedComparisonHref(slugs: string[]) {
  const searchParams = new URLSearchParams();

  for (const slug of slugs) {
    searchParams.append("slug", slug);
  }

  return `/compare?${searchParams.toString()}`;
}

function SavedComparisonSetItem({
  onDelete,
  pendingDeleteIds,
  savedSet
}: {
  onDelete: (savedComparisonSetId: string) => void;
  pendingDeleteIds: ReadonlySet<string>;
  savedSet: SavedComparisonSetSummary;
}) {
  const deletePending = pendingDeleteIds.has(savedSet.id);

  return (
    <li>
      <article>
        <h2>{savedSet.name}</h2>
        <p>{savedSet.slugs.join(", ")}</p>
        <p>
          <Link to={buildSavedComparisonHref(savedSet.slugs)}>Open comparison</Link>
        </p>
        <button
          disabled={deletePending}
          onClick={() => {
            onDelete(savedSet.id);
          }}
          type="button"
        >
          {deletePending ? "Deleting comparison..." : "Delete comparison"}
        </button>
      </article>
    </li>
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

const buildSavedComparisonsViewState = (
  loaderData: SavedComparisonsRouteLoaderData,
  deletedSavedSetIds: ReadonlySet<string>,
  filterText: string
) => {
  const hasLocalDeletion = loaderData.savedSets.some((savedSet) =>
    deletedSavedSetIds.has(savedSet.id)
  );
  const filteredSavedSets = filterSavedComparisonSets(loaderData.savedSets, filterText);
  const savedSets = filteredSavedSets.filter((savedSet) => !deletedSavedSetIds.has(savedSet.id));

  return {
    savedSets,
    statusMessage: buildSavedComparisonsStatus(
      loaderData,
      savedSets,
      hasLocalDeletion,
      filterText.trim() !== "",
      loaderData.savedSets.length > 0
    )
  };
};

function filterSavedComparisonSets(
  savedSets: readonly SavedComparisonSetSummary[],
  filterText: string
): SavedComparisonSetSummary[] {
  const normalizedFilter = filterText.trim().toLowerCase();

  if (!normalizedFilter) {
    return [...savedSets];
  }

  return savedSets.filter((savedSet) => {
    if (savedSet.name.toLowerCase().includes(normalizedFilter)) {
      return true;
    }

    return savedSet.slugs.some((slug) => slug.toLowerCase().includes(normalizedFilter));
  });
}
