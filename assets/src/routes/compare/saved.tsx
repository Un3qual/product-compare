import { useState } from "react";
import { Link, useLoaderData } from "react-router-dom";
import type { SavedComparisonsRouteLoaderData } from "./api";
import { deleteSavedComparisonSet, savedComparisonsLoader } from "./api";

export function SavedComparisonsRoute() {
  const loaderData = useLoaderData<typeof savedComparisonsLoader>() as SavedComparisonsRouteLoaderData;
  const [savedSets, setSavedSets] = useState(loaderData.savedSets);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete(savedComparisonSetId: string) {
    setDeletingId(savedComparisonSetId);
    setDeleteError(null);

    try {
      const result = await deleteSavedComparisonSet(savedComparisonSetId);

      if (result.savedComparisonSetId) {
        setSavedSets((currentSavedSets) =>
          currentSavedSets.filter((savedSet) => savedSet.id !== result.savedComparisonSetId)
        );
        return;
      }

      setDeleteError(result.errors[0]?.message ?? "Request failed. Please try again.");
    } catch {
      setDeleteError("Request failed. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section>
      <h1>Saved comparisons</h1>
      {loaderData.status === "unauthorized" ? (
        <p>
          Sign in to view saved comparisons. <Link to="/auth/login">Sign in</Link>
        </p>
      ) : null}
      {loaderData.status === "error" ? <p>Saved comparisons unavailable.</p> : null}
      {deleteError ? <p role="alert">{deleteError}</p> : null}
      {loaderData.status !== "unauthorized" &&
      loaderData.status !== "error" &&
      savedSets.length === 0 ? (
        <p>No saved comparisons yet.</p>
      ) : null}
      {savedSets.length > 0 ? (
        <ul>
          {savedSets.map((savedSet) => (
            <li key={savedSet.id}>
              <article>
                <h2>{savedSet.name}</h2>
                <p>{savedSet.slugs.join(", ")}</p>
                <p>
                  <Link to={buildSavedComparisonHref(savedSet.slugs)}>Open comparison</Link>
                </p>
                <button
                  disabled={deletingId === savedSet.id}
                  onClick={() => void handleDelete(savedSet.id)}
                  type="button"
                >
                  {deletingId === savedSet.id ? "Deleting comparison..." : "Delete comparison"}
                </button>
              </article>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function buildSavedComparisonHref(slugs: string[]) {
  const searchParams = new URLSearchParams();

  for (const slug of slugs) {
    searchParams.append("slug", slug);
  }

  return `/compare?${searchParams.toString()}`;
}
