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
import { savedComparisonsLoader } from "./saved-data";
import { CompareShell } from "./compare-shell";

type SavedComparisonSortMode =
  | "current"
  | "name-asc"
  | "product-count-desc"
  | "product-count-asc";

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

  return (
    <CompareShell title="Saved comparisons">
      <p aria-live="polite" role="status">
        {viewState.statusMessage}
      </p>
      {deleteError ? <p role="alert">{deleteError}</p> : null}
      {loaderData.status === "unauthorized" ? (
        <Link to="/auth/login">Sign in to view saved comparisons</Link>
      ) : (
        <>
          <label>
            Filter saved comparisons
            <input
              onChange={(event) => {
                setFilterText(event.target.value);
              }}
              type="text"
              value={filterText}
            />
          </label>
          <label>
            Sort saved comparisons
            <select
              onChange={(event) => {
                setSortMode(savedComparisonSortModeFromValue(event.target.value));
              }}
              value={sortMode}
            >
              <option value="current">Current order</option>
              <option value="name-asc">Name A-Z</option>
              <option value="product-count-desc">Product count high-to-low</option>
              <option value="product-count-asc">Product count low-to-high</option>
            </select>
          </label>
        </>
      )}
      {shouldShowReturnActions ? <SavedComparisonReturnActions /> : null}
      {savedSetQueries.length > 0 ? (
        <SavedComparisonSetQueryRetainers savedSetQueries={savedSetQueries} />
      ) : null}
      {viewState.savedSets.length > 0 ? (
        <SavedComparisonSetList
          onDelete={handleDelete}
          pendingDeleteIds={pendingDeleteIds}
          savedSets={viewState.savedSets}
        />
      ) : null}
    </CompareShell>
  );
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

function SavedComparisonReturnActions() {
  return (
    <nav aria-label="Saved comparison return paths">
      <Link to="/products">Browse products</Link>{" "}
      <Link to="/compare">Start a new comparison</Link>
    </nav>
  );
}

function formatSavedProductCount(productCount: number) {
  return `${productCount} ${productCount === 1 ? "product" : "products"}`;
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
  const savedProductCount = formatSavedProductCount(savedSet.slugs.length);

  return (
    <li>
      <article>
        <h2>{savedSet.name}</h2>
        <p>{savedProductCount} in this saved comparison</p>
        <p>{savedSet.slugs.join(", ")}</p>
        <SavedComparisonSetActions
          deletePending={deletePending}
          onDelete={onDelete}
          savedSet={savedSet}
        />
      </article>
    </li>
  );
}

function SavedComparisonSetActions({
  deletePending,
  onDelete,
  savedSet
}: {
  deletePending: boolean;
  onDelete: (savedComparisonSetId: string) => void;
  savedSet: SavedComparisonSetSummary;
}) {
  return (
    <fieldset>
      <legend>Actions for {savedSet.name}</legend>
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
    </fieldset>
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
  filterText: string,
  sortMode: SavedComparisonSortMode
) => {
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
};

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

function savedComparisonSortModeFromValue(value: string): SavedComparisonSortMode {
  switch (value) {
    case "name-asc":
    case "product-count-desc":
    case "product-count-asc":
      return value;
    default:
      return "current";
  }
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
      sortedSavedSets.sort((left, right) => right.slugs.length - left.slugs.length);
      break;
    case "product-count-asc":
      sortedSavedSets.sort((left, right) => left.slugs.length - right.slugs.length);
      break;
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

  return savedSet.slugs.some((slug) => slug.toLowerCase().includes(normalizedFilter));
}
