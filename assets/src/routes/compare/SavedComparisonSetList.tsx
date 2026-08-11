import type { ReactElement, ReactNode } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import { DataList, DataListItem } from "$ui/components/data/DataList";
import { ContextRail } from "$ui/components/layout/ContextRail";
import { WorkspaceLayout } from "$ui/components/layout/WorkspaceLayout";
import { Pagination } from "$ui/components/navigation/Pagination";
import { DestructiveActionDialog } from "$ui/components/overlays/DestructiveActionDialog";
import { Button } from "$ui/primitives/Button";
import { Select } from "$ui/primitives/Select";
import { TextField } from "$ui/primitives/TextField";
import { tokens } from "$ui/theme/tokens.stylex";
import type { SavedComparisonSetSummary } from "./saved-data";
import {
  savedComparisonSortModeFromValue,
  type SavedComparisonSetViewState,
  type SavedComparisonSortMode
} from "./saved-view-state";

export type SavedComparisonSetPagination = {
  firstHref: string | null;
  nextHref: string | null;
};

export type SavedComparisonSetListActions = {
  onDelete: (savedComparisonSetId: string) => void;
  onOpenComparison: (savedSet: SavedComparisonSetSummary) => string;
  pendingDeleteIds: ReadonlySet<string>;
};

export type SavedComparisonSetListControls = {
  filterText: string;
  onFilterTextChange: (filterText: string) => void;
  onSortModeChange: (sortMode: SavedComparisonSortMode) => void;
  sortMode: SavedComparisonSortMode;
};

const styles = create({
  actions: {
    alignItems: "center",
    border: 0,
    display: "flex",
    flexWrap: "wrap",
    gap: "0.65rem",
    margin: 0,
    padding: 0
  },
  controlNote: {
    color: tokens.textSecondary,
    gridColumn: "1 / -1",
    margin: 0
  },
  controls: {
    alignItems: "end",
    backgroundColor: tokens.surfaceMuted,
    borderRadius: "var(--pc-radius-large)",
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))",
    padding: "1rem"
  },
  metadata: {
    color: tokens.textSecondary,
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
  }
});

export function SavedComparisonSetList({
  actions,
  children,
  controls,
  pagination,
  savedSets
}: {
  actions: SavedComparisonSetListActions;
  children?: ReactNode;
  controls: SavedComparisonSetListControls;
  pagination: SavedComparisonSetPagination;
  savedSets: readonly SavedComparisonSetViewState[];
}): ReactElement {
  return (
    <WorkspaceLayout
      context={
        <ContextRail
          description="Filter and sort the visible page while your saved records remain the primary focus."
          label="Saved comparison controls"
        >
          <SavedComparisonControls
            filterText={controls.filterText}
            onFilterTextChange={controls.onFilterTextChange}
            onSortModeChange={controls.onSortModeChange}
            sortMode={controls.sortMode}
          />
        </ContextRail>
      }
      label="Saved comparison records"
    >
      {children}
      {savedSets.length > 0 ? (
        <DataList label="Saved comparison sets">
          {savedSets.map((savedSet) => (
            <DataListItem key={savedSet.id}>
              <SavedComparisonSetItem
                onDelete={actions.onDelete}
                onOpenComparison={actions.onOpenComparison}
                pendingDeleteIds={actions.pendingDeleteIds}
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
        <Select
          onValueChange={(value) =>
            onSortModeChange(savedComparisonSortModeFromValue(value))
          }
          options={[
            { label: "Current order", value: "current" },
            { label: "Name A-Z", value: "name-asc" },
            { label: "Product count high-to-low", value: "product-count-desc" },
            { label: "Product count low-to-high", value: "product-count-asc" }
          ]}
          value={sortMode}
        />
      </label>
      <p {...props(styles.controlNote)}>Filtering and sorting apply to the visible page.</p>
    </div>
  );
}

function SavedComparisonSetItem({
  onDelete,
  onOpenComparison,
  pendingDeleteIds,
  savedSet
}: {
  onDelete: (savedComparisonSetId: string) => void;
  onOpenComparison: (savedSet: SavedComparisonSetSummary) => string;
  pendingDeleteIds: ReadonlySet<string>;
  savedSet: SavedComparisonSetViewState;
}) {
  const deletePending = pendingDeleteIds.has(savedSet.id);

  return (
    <article {...props(styles.savedSet)}>
      <h2 {...props(styles.title)}>{savedSet.name}</h2>
      <p {...props(styles.metadata)}>{savedSet.productCountText}</p>
      <p>{savedSet.productNamesText}</p>
      <fieldset {...props(styles.actions)}>
        <legend>Actions for {savedSet.name}</legend>
        <Button asChild variant="soft">
          <Link to={onOpenComparison(savedSet)}>Open comparison</Link>
        </Button>
        <DestructiveActionDialog
          confirmLabel="Delete comparison"
          description={`Deleting ${savedSet.name} permanently removes this saved comparison.`}
          disabled={deletePending}
          onConfirm={() => onDelete(savedSet.id)}
          title="Delete this saved comparison?"
          trigger={
            <Button disabled={deletePending} tone="danger" type="button">
              {deletePending ? "Deleting comparison..." : "Delete comparison"}
            </Button>
          }
        />
      </fieldset>
    </article>
  );
}
