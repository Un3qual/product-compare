import type { ReactElement } from "react";
import { useRef, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import { graphql, useFragment, useMutation } from "react-relay";
import type { SavedComparisonSetListDeleteSavedComparisonSetMutation } from "$generated/SavedComparisonSetListDeleteSavedComparisonSetMutation.graphql";
import type {
  SavedComparisonSetList_savedSets$data,
  SavedComparisonSetList_savedSets$key,
} from "$generated/SavedComparisonSetList_savedSets.graphql";
import { DataList, DataListItem } from "$ui/components/data/DataList";
import { FeedbackState } from "$ui/components/feedback/FeedbackState";
import { ContextRail } from "$ui/components/layout/ContextRail";
import { WorkspaceLayout } from "$ui/components/layout/WorkspaceLayout";
import { Pagination } from "$ui/components/navigation/Pagination";
import { DestructiveActionDialog } from "$ui/components/overlays/DestructiveActionDialog";
import { Button } from "$ui/primitives/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "$ui/primitives/Select";
import { Input } from "$ui/primitives/Input";
import { Label } from "$ui/primitives/Label";
import { tokens } from "$ui/theme/tokens.stylex";
import { addSetValue, removeSetValue } from "../immutable-collection-state";
import { commitRouteMutation } from "../relay-mutations";
import { DEFAULT_MUTATION_ERROR_MESSAGE } from "$relay/mutation-errors";
import { resolveDeleteSavedComparisonSetMutationOutcome } from "./saved-comparison-delete-mutation-data";
import {
  buildSavedComparisonReopenPath,
  type SavedComparisonsPagination,
} from "./saved-comparisons-route-data";
import {
  buildSavedComparisonsViewState,
  savedComparisonSortModeFromValue,
  type SavedComparisonSetSummary,
  type SavedComparisonSetViewState,
  type SavedComparisonSortMode,
} from "./saved-view-state";

const savedComparisonSetsFragment = graphql`
  fragment SavedComparisonSetList_savedSets on SavedComparisonSetConnection {
    edges {
      node {
        id
        name
        items {
          position
          product {
            name
            slug
          }
        }
      }
    }
  }
`;

export const deleteSavedComparisonSetMutation = graphql`
  mutation SavedComparisonSetListDeleteSavedComparisonSetMutation($savedComparisonSetId: ID!) {
    deleteSavedComparisonSet(savedComparisonSetId: $savedComparisonSetId) {
      savedComparisonSet {
        id
      }
      errors {
        code
        field
        message
      }
    }
  }
`;

const styles = create({
  actions: {
    alignItems: "center",
    border: 0,
    display: "flex",
    flexWrap: "wrap",
    gap: "0.65rem",
    margin: 0,
    padding: 0,
  },
  controlNote: { color: tokens.textSecondary, gridColumn: "1 / -1", margin: 0 },
  controls: {
    alignItems: "end",
    backgroundColor: tokens.surfaceMuted,
    borderRadius: "var(--pc-radius-large)",
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))",
    padding: "1rem",
  },
  metadata: { color: tokens.textSecondary, margin: 0 },
  savedSet: { display: "grid", gap: "0.55rem" },
  title: { fontSize: "1.25rem", letterSpacing: "-0.02em", margin: 0 },
  openLink: {
    alignItems: "center",
    color: tokens.actionAccent,
    display: "inline-flex",
    fontWeight: 700,
    minHeight: tokens.controlHeight,
    textDecoration: "none",
    textDecorationLine: { ":hover": "underline", default: "none" },
    textUnderlineOffset: "0.2em",
  },
});

export function SavedComparisonSetList({
  fragmentRef,
  pagination,
}: {
  fragmentRef: SavedComparisonSetList_savedSets$key;
  pagination: SavedComparisonsPagination;
}): ReactElement {
  const connection = useFragment(savedComparisonSetsFragment, fragmentRef);
  const savedSets = summarizeSavedComparisonSets(connection);
  const [deletedSavedSetIds, setDeletedSavedSetIds] = useState<ReadonlySet<string>>(new Set());
  const [pendingDeleteIds, setPendingDeleteIds] = useState<ReadonlySet<string>>(new Set());
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");
  const [sortMode, setSortMode] = useState<SavedComparisonSortMode>("current");
  const inFlightDeleteIdsRef = useRef<Set<string>>(new Set());
  const [commitDeleteSavedComparisonSet] =
    useMutation<SavedComparisonSetListDeleteSavedComparisonSetMutation>(
      deleteSavedComparisonSetMutation,
    );

  const finishDelete = (savedComparisonSetId: string) => {
    inFlightDeleteIdsRef.current.delete(savedComparisonSetId);
    setPendingDeleteIds((current) => removeSetValue(current, savedComparisonSetId));
  };

  const handleDelete = (savedComparisonSetId: string) => {
    if (inFlightDeleteIdsRef.current.has(savedComparisonSetId)) return;

    inFlightDeleteIdsRef.current.add(savedComparisonSetId);
    setPendingDeleteIds((current) => addSetValue(current, savedComparisonSetId));
    setDeleteError(null);

    commitRouteMutation(
      commitDeleteSavedComparisonSet,
      {
        variables: { savedComparisonSetId },
        onCompleted: (response, graphQLErrors) => {
          const outcome = resolveDeleteSavedComparisonSetMutationOutcome(
            response.deleteSavedComparisonSet,
            graphQLErrors,
          );
          if (outcome.deletedSavedComparisonSetId) {
            setDeletedSavedSetIds((current) =>
              addSetValue(current, outcome.deletedSavedComparisonSetId),
            );
          } else {
            setDeleteError(outcome.error);
          }
          finishDelete(savedComparisonSetId);
        },
        onError: () => {
          setDeleteError(DEFAULT_MUTATION_ERROR_MESSAGE);
          finishDelete(savedComparisonSetId);
        },
      },
      () => {
        setDeleteError(DEFAULT_MUTATION_ERROR_MESSAGE);
        finishDelete(savedComparisonSetId);
      },
    );
  };

  const viewState = buildSavedComparisonsViewState(
    { status: savedSets.length === 0 ? "empty" : "ready", savedSets },
    deletedSavedSetIds,
    filterText,
    sortMode,
  );
  const showReturnActions = viewState.savedSets.length === 0;

  return (
    <>
      <p aria-label="Saved comparisons status" aria-live="polite" role="status">
        {viewState.statusMessage}
      </p>
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
        {showReturnActions ? <SavedComparisonReturnActions /> : null}
        {viewState.savedSets.length > 0 ? (
          <DataList label="Saved comparison sets">
            {viewState.savedSets.map((savedSet) => (
              <DataListItem key={savedSet.id}>
                <SavedComparisonSetItem
                  onDelete={handleDelete}
                  pendingDeleteIds={pendingDeleteIds}
                  savedSet={savedSet}
                />
              </DataListItem>
            ))}
          </DataList>
        ) : null}
        <Pagination
          firstHref={pagination.firstHref}
          label="Saved comparison pages"
          nextHref={pagination.nextHref}
        />
      </WorkspaceLayout>
    </>
  );
}

function summarizeSavedComparisonSets(
  connection: SavedComparisonSetList_savedSets$data,
): SavedComparisonSetSummary[] {
  return connection.edges.map(({ node }) => ({
    id: node.id,
    name: node.name,
    products: [...node.items]
      .sort((left, right) => left.position - right.position)
      .map(({ product }) => ({ name: product.name, slug: product.slug })),
  }));
}

function SavedComparisonControls({
  filterText,
  onFilterTextChange,
  onSortModeChange,
  sortMode,
}: {
  filterText: string;
  onFilterTextChange: (filterText: string) => void;
  onSortModeChange: (sortMode: SavedComparisonSortMode) => void;
  sortMode: SavedComparisonSortMode;
}) {
  const options = [
    { label: "Current order", value: "current" },
    { label: "Name A-Z", value: "name-asc" },
    { label: "Product count high-to-low", value: "product-count-desc" },
    { label: "Product count low-to-high", value: "product-count-asc" },
  ];

  return (
    <div {...props(styles.controls)}>
      <div>
        <span id="saved-comparison-filter-label">Filter saved comparisons</span>
        <Input
          aria-labelledby="saved-comparison-filter-label"
          onChange={(event) => onFilterTextChange(event.target.value)}
          value={filterText}
        />
      </div>
      <Label>
        Sort saved comparisons
        <Select
          items={options}
          onValueChange={(value) => onSortModeChange(savedComparisonSortModeFromValue(value ?? ""))}
          value={sortMode}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Label>
      <p {...props(styles.controlNote)}>Filtering and sorting apply to the visible page.</p>
    </div>
  );
}

function SavedComparisonSetItem({
  onDelete,
  pendingDeleteIds,
  savedSet,
}: {
  onDelete: (savedComparisonSetId: string) => void;
  pendingDeleteIds: ReadonlySet<string>;
  savedSet: SavedComparisonSetViewState;
}) {
  const deletePending = pendingDeleteIds.has(savedSet.id);
  const comparisonPath = buildSavedComparisonReopenPath(savedSet.products.map(({ slug }) => slug));

  return (
    <article {...props(styles.savedSet)}>
      <h2 {...props(styles.title)}>{savedSet.name}</h2>
      <p {...props(styles.metadata)}>{savedSet.productCountText}</p>
      <p>{savedSet.productNamesText}</p>
      <fieldset {...props(styles.actions)}>
        <legend>Actions for {savedSet.name}</legend>
        <Link to={comparisonPath} {...props(styles.openLink)}>
          Open comparison&nbsp;<span aria-hidden="true">→</span>
        </Link>
        <DestructiveActionDialog
          confirmLabel="Delete comparison"
          description={`Deleting ${savedSet.name} permanently removes this saved comparison.`}
          disabled={deletePending}
          onConfirm={() => onDelete(savedSet.id)}
          title="Delete this saved comparison?"
          trigger={
            <Button disabled={deletePending} variant="destructive" type="button">
              {deletePending ? "Deleting comparison..." : "Delete comparison"}
            </Button>
          }
        />
      </fieldset>
    </article>
  );
}

function SavedComparisonReturnActions() {
  return (
    <nav aria-label="Saved comparison return paths">
      <Link to="/products">Browse products</Link> <Link to="/compare">Start a new comparison</Link>
    </nav>
  );
}
