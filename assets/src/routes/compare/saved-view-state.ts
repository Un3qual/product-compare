export interface SavedComparisonSetSummary {
  id: string;
  name: string;
  products: Array<{
    name: string;
    slug: string;
  }>;
}

export type SavedComparisonsViewInput = {
  readonly status: "ready" | "empty" | "unauthorized";
  readonly savedSets: readonly SavedComparisonSetSummary[];
};

export type SavedComparisonSortMode =
  | "current"
  | "name-asc"
  | "product-count-desc"
  | "product-count-asc";

export function savedComparisonSortModeFromValue(
  value: string
): SavedComparisonSortMode {
  switch (value) {
    case "name-asc":
    case "product-count-desc":
    case "product-count-asc":
      return value;
    default:
      return "current";
  }
}

const SAVED_COMPARISON_NAME_COLLATOR = new Intl.Collator("en-US", {
  sensitivity: "base"
});

export function buildSavedComparisonsViewState<T extends SavedComparisonsViewInput>(
  loaderData: T,
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

function buildSavedComparisonsStatus(
  loaderData: SavedComparisonsViewInput,
  visibleSavedSets: SavedComparisonSetSummary[],
  hasLocalDeletion: boolean,
  hasFilter: boolean,
  hasLoadedSavedSets: boolean
) {
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
        SAVED_COMPARISON_NAME_COLLATOR.compare(left.name, right.name)
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
