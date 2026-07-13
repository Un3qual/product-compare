import type { ReactElement, ReactNode } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import { DataList, DataListItem } from "../../ui/components/data/DataList";
import { ContextRail } from "../../ui/components/layout/ContextRail";
import { WorkspaceLayout } from "../../ui/components/layout/WorkspaceLayout";
import { Pagination } from "../../ui/components/navigation/Pagination";
import { Button } from "../../ui/primitives/Button";
import { TextField } from "../../ui/primitives/TextField";
import { tokens } from "../../ui/theme/tokens.stylex";
import type { SavedComparisonSetSummary } from "./saved-data";
import type { SavedComparisonSortMode } from "./saved-view-state";

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
  savedSets: readonly SavedComparisonSetSummary[];
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
  savedSet: SavedComparisonSetSummary;
}) {
  const deletePending = pendingDeleteIds.has(savedSet.id);
  const productCount = savedSet.products.length;

  return (
    <article {...props(styles.savedSet)}>
      <h2 {...props(styles.title)}>{savedSet.name}</h2>
      <p {...props(styles.metadata)}>
        {productCount} {productCount === 1 ? "product" : "products"} in this saved comparison
      </p>
      <p>{savedSet.products.map(({ name }) => name).join(", ")}</p>
      <fieldset {...props(styles.actions)}>
        <legend>Actions for {savedSet.name}</legend>
        <Button asChild variant="soft">
          <Link to={onOpenComparison(savedSet)}>Open comparison</Link>
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
    </article>
  );
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
