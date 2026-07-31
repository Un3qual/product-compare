import { useRef, useState } from "react";
import { Link, useLoaderData } from "react-router-dom";
import { useMutation } from "react-relay";
import type { SavedComparisonOperationsDeleteSavedComparisonSetMutation } from "../../__generated__/SavedComparisonOperationsDeleteSavedComparisonSetMutation.graphql";
import type { SavedComparisonOperationsQuery } from "../../__generated__/SavedComparisonOperationsQuery.graphql";
import {
  relayRouteQueryDescriptorIdentity,
  useRoutePreloadedQuery
} from "../../relay/route-preload";
import { FeedbackState } from "../../ui/components/feedback/FeedbackState";
import { Button } from "../../ui/primitives/Button";
import { commitRouteMutation } from "../relay-mutations";
import { addSetValue, removeSetValue } from "../immutable-collection-state";
import {
  DEFAULT_ROUTE_ERROR_MESSAGE
} from "../route-errors";
import type {
  savedComparisonsLoader,
  SavedComparisonSetQueryDescriptor,
  SavedComparisonSetSummary
} from "./saved-data";
import { CompareShell } from "./CompareShell";
import {
  deleteSavedComparisonSetMutation,
  savedComparisonOperationsQuery
} from "./SavedComparisonOperations";
import {
  SavedComparisonSetList
} from "./SavedComparisonSetList";
import {
  buildSavedComparisonReopenPath,
  buildSavedComparisonsPagination
} from "./saved-comparisons-route-data";
import { resolveDeleteSavedComparisonSetMutationOutcome } from "./saved-comparison-delete-mutation-data";
import {
  buildSavedComparisonsViewState,
  type SavedComparisonSortMode
} from "./saved-view-state";

export function SavedComparisonsRoute() {
  const loaderData = useLoaderData<typeof savedComparisonsLoader>();
  const [deletedSavedSetIds, setDeletedSavedSetIds] = useState<ReadonlySet<string>>(new Set());
  const [pendingDeleteIds, setPendingDeleteIds] = useState<ReadonlySet<string>>(new Set());
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");
  const [sortMode, setSortMode] = useState<SavedComparisonSortMode>("current");
  const inFlightDeleteIdsRef = useRef<Set<string>>(new Set());
  const [commitDeleteSavedComparisonSet] = useMutation<SavedComparisonOperationsDeleteSavedComparisonSetMutation>(
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
        variables: { savedComparisonSetId },
        onCompleted: (response, graphQLErrors) => {
          const payload = response.deleteSavedComparisonSet;
          const outcome = resolveDeleteSavedComparisonSetMutationOutcome(payload, graphQLErrors);

          if (outcome.deletedSavedComparisonSetId) {
            setDeleteError(null);
            setDeletedSavedSetIds((currentDeletedSavedSetIds) =>
              addSetValue(currentDeletedSavedSetIds, outcome.deletedSavedComparisonSetId)
            );
          } else {
            setDeleteError(outcome.error);
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
  return buildSavedComparisonReopenPath(savedSet.products.map(({ slug }) => slug));
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
          key={relayRouteQueryDescriptorIdentity(savedSetQuery)}
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
  useRoutePreloadedQuery<SavedComparisonOperationsQuery>(
    savedComparisonOperationsQuery,
    savedSetQuery
  );

  return null;
}

function SavedComparisonReturnActions() {
  return (
    <nav aria-label="Saved comparison return paths">
      <Link to="/products">Browse products</Link>{" "}
      <Link to="/compare">Start a new comparison</Link>
    </nav>
  );
}
