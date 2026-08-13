import type { CatalogFilters } from "./filter-state";

export type CatalogFilterFormTypeState = {
  selectedTypeTaxonId: string;
  includeTypeDescendants: boolean;
};

export function catalogFilterFormInitialTypeState(
  filters: Pick<CatalogFilters, "typeTaxonId" | "includeTypeDescendants">,
): CatalogFilterFormTypeState {
  const selectedTypeTaxonId = filters.typeTaxonId ?? "";

  return {
    selectedTypeTaxonId,
    includeTypeDescendants: Boolean(selectedTypeTaxonId && filters.includeTypeDescendants),
  };
}

export function catalogFilterFormTypeSelection(
  previous: CatalogFilterFormTypeState,
  selectedTypeTaxonId: string,
): CatalogFilterFormTypeState {
  return {
    selectedTypeTaxonId,
    includeTypeDescendants:
      selectedTypeTaxonId === ""
        ? false
        : previous.selectedTypeTaxonId === ""
          ? true
          : previous.includeTypeDescendants,
  };
}

export function hasInitiallyOpenCatalogAdvancedFilters(
  filters: Pick<CatalogFilters, "useCaseTaxonIds" | "numeric" | "booleans" | "enums">,
) {
  return (
    filters.useCaseTaxonIds.length > 0 ||
    filters.numeric.length > 0 ||
    filters.booleans.length > 0 ||
    filters.enums.length > 0
  );
}
