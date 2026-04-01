import { useState } from "react";
import { Link, useLoaderData } from "react-router-dom";
import type { SavedComparisonSetSummary, SavedComparisonsRouteLoaderData } from "./api";
import { deleteSavedComparisonSet, savedComparisonsLoader } from "./api";
import { CompareShell } from "./compare-shell";

export function SavedComparisonsRoute() {
  const loaderData = useLoaderData<typeof savedComparisonsLoader>();
  const [deletedSavedSetIds, setDeletedSavedSetIds] = useState<string[]>([]);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete(savedComparisonSetId: string) {
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
      setPendingDeleteIds((currentPendingDeleteIds) =>
        currentPendingDeleteIds.filter((pendingDeleteId) => pendingDeleteId !== savedComparisonSetId)
      );
    }
  }

  const viewState = buildSavedComparisonsViewState(loaderData, deletedSavedSetIds);

  return (
    <CompareShell title="Saved comparisons">
      <p aria-live="polite" role="status">
        {viewState.statusMessage}
      </p>
      {deleteError ? <p role="alert">{deleteError}</p> : null}
      {loaderData.status === "unauthorized" ? <Link to="/auth/login">Sign in</Link> : null}
      {viewState.savedSets.length > 0 ? (
        <ul aria-label="Saved comparison sets">
          {viewState.savedSets.map((savedSet) => (
            <li key={savedSet.id}>
              <article>
                <h2>{savedSet.name}</h2>
                <p>{savedSet.slugs.join(", ")}</p>
                <p>
                  <Link to={buildSavedComparisonHref(savedSet.slugs)}>Open comparison</Link>
                </p>
                <button
                  disabled={pendingDeleteIds.includes(savedSet.id)}
                  onClick={() => void handleDelete(savedSet.id)}
                  type="button"
                >
                  {pendingDeleteIds.includes(savedSet.id)
                    ? "Deleting comparison..."
                    : "Delete comparison"}
                </button>
              </article>
            </li>
          ))}
        </ul>
      ) : null}
    </CompareShell>
  );
}

function buildSavedComparisonHref(slugs: string[]) {
  const searchParams = new URLSearchParams();

  for (const slug of slugs) {
    searchParams.append("slug", slug);
  }

  return `/compare?${searchParams.toString()}`;
}

function buildSavedComparisonsStatus(
  loaderData: SavedComparisonsRouteLoaderData,
  visibleSavedSets: SavedComparisonSetSummary[],
  hasLocalDeletion: boolean
) {
  if (loaderData.status === "unauthorized") {
    return "Sign in to view saved comparisons.";
  }

  if (hasLocalDeletion) {
    return "Comparison deleted.";
  }

  if (visibleSavedSets.length === 0) {
    return "No saved comparisons yet.";
  }

  return "Saved comparison sets loaded.";
}

function buildSavedComparisonsViewState(
  loaderData: SavedComparisonsRouteLoaderData,
  deletedSavedSetIds: string[]
) {
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
}
