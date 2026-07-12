import { useRef, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link, useLoaderData } from "react-router-dom";
import { useMutation } from "react-relay";
import deleteSavedComparisonSetMutation, {
  type DeleteSavedComparisonSetMutation
} from "../../__generated__/DeleteSavedComparisonSetMutation.graphql";
import savedComparisonsRouteQuery, {
  type SavedComparisonsRouteQuery
} from "../../__generated__/SavedComparisonsRouteQuery.graphql";
import { stableJsonValue, useRoutePreloadedQuery } from "../../relay/route-preload";
import { DataList, DataListItem } from "../../ui/components/data/DataList";
import { FeedbackState } from "../../ui/components/feedback/FeedbackState";
import { ContextRail } from "../../ui/components/layout/ContextRail";
import { WorkspaceLayout } from "../../ui/components/layout/WorkspaceLayout";
import { Pagination } from "../../ui/components/navigation/Pagination";
import { Button } from "../../ui/primitives/Button";
import { TextField } from "../../ui/primitives/TextField";
import { tokens } from "../../ui/theme/tokens.stylex";
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

type SavedComparisonSortMode =
  | "current"
  | "name-asc"
  | "product-count-desc"
  | "product-count-asc";

const styles = create({
  controls: {
    alignItems: "end",
    backgroundColor: tokens.surfaceMuted,
    borderRadius: "var(--pc-radius-large)",
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))",
    padding: "1rem"
  },
  controlNote: {
    color: tokens.textSecondary,
    gridColumn: "1 / -1",
    margin: 0
  },
  savedSet: {
    display: "grid",
    gap: "0.55rem"
  },
  title: {
    fontSize: "1.25rem",
    letterSpacing: "-0.02em",
    margin: 0
  },
  metadata: {
    color: tokens.textSecondary,
    margin: 0
  },
  actions: {
    alignItems: "center",
    border: 0,
    display: "flex",
    flexWrap: "wrap",
    gap: "0.65rem",
    margin: 0,
    padding: 0
  }
});

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
      <p aria-label="Saved comparisons status" aria-live="polite" role="status">
        {viewState.statusMessage}
      </p>
      {loaderData.status === "unauthorized" ? (
        <Button asChild variant="solid">
          <Link to="/auth/login">Sign in to view saved comparisons</Link>
        </Button>
      ) : (
        <WorkspaceLayout
          context={
            <ContextRail
              description="Filter and sort the visible page while your saved records remain the primary focus."
              label="Saved comparison controls"
            >
              <SavedComparisonControls
                filterText={filterText}
                onFilterTextChange={setFilterText}
                onSortModeChange={setSortMode}
                sortMode={sortMode}
              />
            </ContextRail>
          }
          label="Saved comparison records"
        >
          {deleteError ? <FeedbackState kind="error" title={deleteError} /> : null}
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
          <SavedComparisonsPagination
            after={loaderData.after ?? null}
            endCursor={loaderData.endCursor ?? null}
            hasNextPage={loaderData.hasNextPage ?? false}
          />
        </WorkspaceLayout>
      )}
    </CompareShell>
  );
}

function SavedComparisonControls({
  filterText,
  onFilterTextChange,
  onSortModeChange,
  sortMode
}: {
  filterText: string;
  onFilterTextChange: (filterText: string) => void;
  onSortModeChange: (sortMode: SavedComparisonSortMode) => void;
  sortMode: SavedComparisonSortMode;
}) {
  return (
    <div {...props(styles.controls)}>
      <div>
        <span id="saved-comparison-filter-label">Filter saved comparisons</span>
        <TextField
          aria-labelledby="saved-comparison-filter-label"
          onChange={(event) => onFilterTextChange(event.target.value)}
          value={filterText}
        />
      </div>
      <label>
        Sort saved comparisons
        <select
          onChange={(event) => onSortModeChange(savedComparisonSortModeFromValue(event.target.value))}
          value={sortMode}
        >
          <option value="current">Current order</option>
          <option value="name-asc">Name A-Z</option>
          <option value="product-count-desc">Product count high-to-low</option>
          <option value="product-count-asc">Product count low-to-high</option>
        </select>
      </label>
      <p {...props(styles.controlNote)}>
        Filtering and sorting apply to the visible page.
      </p>
    </div>
  );
}

function SavedComparisonsPagination({
  after,
  endCursor,
  hasNextPage
}: {
  after: string | null;
  endCursor: string | null;
  hasNextPage: boolean;
}) {
  return (
    <Pagination
      firstHref={after ? "/compare/saved" : null}
      label="Saved comparison pages"
      nextHref={hasNextPage && endCursor ? savedComparisonsPagePath(endCursor) : null}
    />
  );
}

function savedComparisonsPagePath(after: string) {
  const searchParams = new URLSearchParams({ after });

  return `/compare/saved?${searchParams.toString()}`;
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
    <DataList label="Saved comparison sets">
      {savedSets.map((savedSet) => (
        <DataListItem key={savedSet.id}>
          <SavedComparisonSetItem
            onDelete={onDelete}
            pendingDeleteIds={pendingDeleteIds}
            savedSet={savedSet}
          />
        </DataListItem>
      ))}
    </DataList>
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
  const savedProductCount = formatSavedProductCount(savedSet.products.length);

  return (
    <article {...props(styles.savedSet)}>
      <h2 {...props(styles.title)}>{savedSet.name}</h2>
      <p {...props(styles.metadata)}>{savedProductCount} in this saved comparison</p>
      <p>{savedSet.products.map(({ name }) => name).join(", ")}</p>
      <SavedComparisonSetActions
        deletePending={deletePending}
        onDelete={onDelete}
        savedSet={savedSet}
      />
    </article>
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
    <fieldset {...props(styles.actions)}>
      <legend>Actions for {savedSet.name}</legend>
      <Button asChild variant="soft">
        <Link to={buildSavedComparisonHref(savedSet.products.map(({ slug }) => slug))}>
          Open comparison
        </Link>
      </Button>
      <Button
        disabled={deletePending}
        onClick={() => {
          onDelete(savedSet.id);
        }}
        tone="danger"
        type="button"
      >
        {deletePending ? "Deleting comparison..." : "Delete comparison"}
      </Button>
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
