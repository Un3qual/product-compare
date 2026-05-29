import { Component, Suspense, useRef, useState, type ReactNode } from "react";
import { Link, useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import savedComparisonsRouteQuery, {
  type SavedComparisonsRouteQuery
} from "../../__generated__/SavedComparisonsRouteQuery.graphql";
import { useRoutePreloadedQuery } from "../../relay/route-preload";
import type {
  SavedComparisonSetQueryDescriptor,
  SavedComparisonSetSummary,
  SavedComparisonsRouteLoaderData
} from "./saved-data";
import {
  deleteSavedComparisonSet,
  savedComparisonsLoader,
  summarizeSavedComparisonSetsPage
} from "./saved-data";
import { CompareShell } from "./compare-shell";

export function SavedComparisonsRoute() {
  const loaderData = useLoaderData<typeof savedComparisonsLoader>();
  const [deletedSavedSetIds, setDeletedSavedSetIds] = useState<string[]>([]);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const inFlightDeleteIdsRef = useRef<Set<string>>(new Set());

  async function handleDelete(savedComparisonSetId: string) {
    if (inFlightDeleteIdsRef.current.has(savedComparisonSetId)) {
      return;
    }

    inFlightDeleteIdsRef.current.add(savedComparisonSetId);
    setPendingDeleteIds((currentPendingDeleteIds) =>
      currentPendingDeleteIds.includes(savedComparisonSetId)
        ? currentPendingDeleteIds
        : [...currentPendingDeleteIds, savedComparisonSetId]
    );
    setDeleteError(null);

    try {
      const result = await deleteSavedComparisonSet(savedComparisonSetId);

      if (result.savedComparisonSetId) {
        const deletedSavedSetId = result.savedComparisonSetId;

        setDeleteError(null);
        setDeletedSavedSetIds((currentDeletedSavedSetIds) =>
          currentDeletedSavedSetIds.includes(deletedSavedSetId)
            ? currentDeletedSavedSetIds
            : [...currentDeletedSavedSetIds, deletedSavedSetId]
        );
        return;
      }

      setDeleteError(result.errors[0]?.message ?? "Request failed. Please try again.");
    } catch {
      setDeleteError("Request failed. Please try again.");
    } finally {
      inFlightDeleteIdsRef.current.delete(savedComparisonSetId);
      setPendingDeleteIds((currentPendingDeleteIds) =>
        currentPendingDeleteIds.filter((pendingDeleteId) => pendingDeleteId !== savedComparisonSetId)
      );
    }
  }

  const viewState = buildSavedComparisonsViewState(loaderData, deletedSavedSetIds);
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
      ) : null}
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

type ResettableErrorBoundaryState = {
  hasError: boolean;
  resetToken: unknown;
};

class ResettableErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; resetToken: unknown },
  ResettableErrorBoundaryState
> {
  constructor(props: { children: ReactNode; fallback: ReactNode; resetToken: unknown }) {
    super(props);
    this.state = {
      hasError: false,
      resetToken: props.resetToken
    };
  }

  static getDerivedStateFromProps(
    props: { resetToken: unknown },
    state: ResettableErrorBoundaryState
  ): Partial<ResettableErrorBoundaryState> | null {
    if (props.resetToken === state.resetToken) {
      return null;
    }

    return {
      hasError: false,
      resetToken: props.resetToken
    };
  }

  static getDerivedStateFromError(): Partial<ResettableErrorBoundaryState> {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

function RelaySavedComparisonSetList({
  deletedSavedSetIds,
  onDelete,
  pendingDeleteIds,
  savedSetQueries
}: {
  deletedSavedSetIds: string[];
  onDelete: (savedComparisonSetId: string) => Promise<void>;
  pendingDeleteIds: string[];
  savedSetQueries: SavedComparisonSetQueryDescriptor[];
}) {
  return (
    <ul aria-label="Saved comparison sets">
      {savedSetQueries.map((savedSetQuery) => (
        <RelaySavedComparisonSetPage
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
  deletedSavedSetIds,
  onDelete,
  pendingDeleteIds,
  savedSetQuery
}: {
  deletedSavedSetIds: string[];
  onDelete: (savedComparisonSetId: string) => Promise<void>;
  pendingDeleteIds: string[];
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
  const savedSets = page.savedSets.filter(
    (savedSet) => !deletedSavedSetIds.includes(savedSet.id)
  );

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
  onDelete: (savedComparisonSetId: string) => Promise<void>;
  pendingDeleteIds: string[];
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
  onDelete: (savedComparisonSetId: string) => Promise<void>;
  pendingDeleteIds: string[];
  savedSet: SavedComparisonSetSummary;
}) {
  const deletePending = pendingDeleteIds.includes(savedSet.id);

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

function savedComparisonSetQueryKey(savedSetQuery: SavedComparisonSetQueryDescriptor) {
  return `${savedSetQuery.__relayQuery.operationName}:${JSON.stringify(
    savedSetQuery.__relayQuery.variables
  )}`;
}

const buildSavedComparisonsStatus = (
  loaderData: SavedComparisonsRouteLoaderData,
  visibleSavedSets: SavedComparisonSetSummary[],
  hasLocalDeletion: boolean
) => {
  if (loaderData.status === "unauthorized") {
    return "Sign in to view saved comparisons.";
  }

  if (hasLocalDeletion) {
    return "Comparison deleted.";
  }

  if (visibleSavedSets.length === 0) {
    return "No saved comparisons yet.";
  }

  return "";
};

const buildSavedComparisonsViewState = (
  loaderData: SavedComparisonsRouteLoaderData,
  deletedSavedSetIds: string[]
) => {
  const locallyDeletedSavedSetIds = deletedSavedSetIds.filter((deletedSavedSetId) =>
    loaderData.savedSets.some((savedSet) => savedSet.id === deletedSavedSetId)
  );
  const savedSets = loaderData.savedSets.filter(
    (savedSet) => !locallyDeletedSavedSetIds.includes(savedSet.id)
  );

  return {
    savedSets,
    statusMessage: buildSavedComparisonsStatus(
      loaderData,
      savedSets,
      locallyDeletedSavedSetIds.length > 0
    )
  };
};
