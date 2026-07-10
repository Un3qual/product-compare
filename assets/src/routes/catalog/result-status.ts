export type CatalogResultStatus = {
  emptyMessage: string | null;
  guidance: string;
};

export function catalogResultStatus({
  hasActiveFilters,
  hasVisibleProducts,
  resultCount
}: {
  hasActiveFilters: boolean;
  hasVisibleProducts: boolean;
  resultCount: number;
}): CatalogResultStatus {
  return {
    emptyMessage: catalogEmptyMessage(
      hasActiveFilters,
      hasVisibleProducts,
      resultCount
    ),
    guidance: catalogResultGuidance(resultCount)
  };
}

function catalogResultGuidance(resultCount: number) {
  if (resultCount <= 0) {
    return "No matching products";
  }

  return resultCount === 1 ? "1 matching product" : `${resultCount} matching products`;
}

function catalogEmptyMessage(
  hasActiveFilters: boolean,
  hasVisibleProducts: boolean,
  resultCount: number
) {
  if (hasVisibleProducts) {
    return null;
  }

  return hasActiveFilters && resultCount <= 0
    ? "No products match these filters."
    : "No products available yet.";
}
