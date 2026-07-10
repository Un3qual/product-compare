import {
  catalogProductSortLabel,
  type CatalogFilterMetadata,
  type CatalogFilters
} from "./filters";

export type CatalogFilterRemoval =
  | { kind: "query" }
  | { kind: "sort" }
  | { kind: "type" }
  | { kind: "useCase"; taxonId: string }
  | { kind: "numeric"; attributeId: string }
  | { kind: "boolean"; attributeId: string }
  | { kind: "enum"; attributeId: string };

export type CatalogFilterSummaryItem = {
  key: string;
  label: string;
  removal: CatalogFilterRemoval;
};

export function catalogFiltersWithout(
  filters: CatalogFilters,
  removal: CatalogFilterRemoval
): CatalogFilters {
  const copied = copyCatalogFilters(filters);

  switch (removal.kind) {
    case "query":
      return removeQueryFilter(copied);
    case "sort":
      return removeSortFilter(copied);
    case "type":
      return removeTypeFilter(copied);
    case "useCase":
      return removeUseCaseFilter(copied, removal.taxonId);
    case "numeric":
      return removeNumericFilter(copied, removal.attributeId);
    case "boolean":
      return removeBooleanFilter(copied, removal.attributeId);
    case "enum":
      return removeEnumFilter(copied, removal.attributeId);
    default:
      return unsupportedCatalogFilterRemoval(removal);
  }
}

function removeQueryFilter(filters: CatalogFilters): CatalogFilters {
  return { ...filters, query: undefined };
}

function removeSortFilter(filters: CatalogFilters): CatalogFilters {
  return { ...filters, sort: undefined };
}

function removeTypeFilter(filters: CatalogFilters): CatalogFilters {
  return {
    ...filters,
    typeTaxonId: undefined,
    includeTypeDescendants: undefined
  };
}

function removeUseCaseFilter(filters: CatalogFilters, taxonId: string): CatalogFilters {
  return {
    ...filters,
    useCaseTaxonIds: filters.useCaseTaxonIds.filter((candidateId) => candidateId !== taxonId)
  };
}

function removeNumericFilter(filters: CatalogFilters, attributeId: string): CatalogFilters {
  return {
    ...filters,
    numeric: filters.numeric.filter((filter) => filter.attributeId !== attributeId)
  };
}

function removeBooleanFilter(filters: CatalogFilters, attributeId: string): CatalogFilters {
  return {
    ...filters,
    booleans: filters.booleans.filter((filter) => filter.attributeId !== attributeId)
  };
}

function removeEnumFilter(filters: CatalogFilters, attributeId: string): CatalogFilters {
  return {
    ...filters,
    enums: filters.enums.filter((filter) => filter.attributeId !== attributeId)
  };
}

function unsupportedCatalogFilterRemoval(removal: never): never {
  throw new Error(`Unsupported catalog filter removal: ${JSON.stringify(removal)}`);
}

function copyCatalogFilters(filters: CatalogFilters): CatalogFilters {
  return {
    ...filters,
    useCaseTaxonIds: [...filters.useCaseTaxonIds],
    numeric: [...filters.numeric],
    booleans: [...filters.booleans],
    enums: [...filters.enums]
  };
}

export function catalogFilterSummaryItems(
  metadata: CatalogFilterMetadata,
  filters: CatalogFilters
): CatalogFilterSummaryItem[] {
  return [
    ...(filters.query
      ? [
          {
            key: "query",
            label: `Search: "${filters.query}"`,
            removal: { kind: "query" } as const
          }
        ]
      : []),
    ...(filters.sort
      ? [
          {
            key: "sort",
            label: `Sort: ${catalogProductSortLabel(filters.sort)}`,
            removal: { kind: "sort" } as const
          }
        ]
      : []),
    ...typeFilterSummaryItems(metadata, filters),
    ...selectedUseCaseSummaryItems(metadata),
    ...numericFilterSummaryItems(metadata),
    ...booleanFilterSummaryItems(metadata),
    ...enumFilterSummaryItems(metadata)
  ];
}

function typeFilterSummaryItems(
  metadata: CatalogFilterMetadata,
  filters: CatalogFilters
): CatalogFilterSummaryItem[] {
  const selectedType = metadata.typeOptions.find((option) => option.selected);

  return selectedType
    ? [
        {
          key: "type",
          label: filters.includeTypeDescendants
            ? `Type: ${selectedType.label} and descendants`
            : `Type: ${selectedType.label}`,
          removal: { kind: "type" } as const
        }
      ]
    : [];
}

function selectedUseCaseSummaryItems(
  metadata: CatalogFilterMetadata
): CatalogFilterSummaryItem[] {
  return metadata.useCaseOptions
    .filter((option) => option.selected)
    .map((option) => ({
      key: `use-case:${option.id}`,
      label: `Use case: ${option.label}`,
      removal: { kind: "useCase", taxonId: option.id } as const
    }));
}

function numericFilterSummaryItems(
  metadata: CatalogFilterMetadata
): CatalogFilterSummaryItem[] {
  return metadata.numericFilters.flatMap((filter) => {
    const summary = numericFilterSummary(filter);

    return summary
      ? [
          {
            key: `numeric:${filter.attributeId}`,
            label: `${filter.displayName}: ${summary}`,
            removal: { kind: "numeric", attributeId: filter.attributeId } as const
          }
        ]
      : [];
  });
}

function booleanFilterSummaryItems(
  metadata: CatalogFilterMetadata
): CatalogFilterSummaryItem[] {
  return metadata.booleanFilters.flatMap((filter) =>
    typeof filter.selectedValue === "boolean"
      ? [
          {
            key: `boolean:${filter.attributeId}`,
            label: `${filter.displayName}: ${filter.selectedValue ? "Yes" : "No"}`,
            removal: { kind: "boolean", attributeId: filter.attributeId } as const
          }
        ]
      : []
  );
}

function enumFilterSummaryItems(
  metadata: CatalogFilterMetadata
): CatalogFilterSummaryItem[] {
  return metadata.enumFilters.flatMap((filter) =>
    filter.options
      .filter((option) => option.selected)
      .map((option) => ({
        key: `enum:${filter.attributeId}:${option.id}`,
        label: `${filter.displayName}: ${option.label}`,
        removal: { kind: "enum", attributeId: filter.attributeId } as const
      }))
  );
}

function numericFilterSummary(filter: CatalogFilterMetadata["numericFilters"][number]) {
  const min = formatNumericValue(filter.selectedMin, filter.unitSymbol);
  const max = formatNumericValue(filter.selectedMax, filter.unitSymbol);

  if (min && max) {
    return `${min} to ${max}`;
  }

  if (min) {
    return `at least ${min}`;
  }

  if (max) {
    return `up to ${max}`;
  }

  return null;
}

function formatNumericValue(
  value: string | null | undefined,
  unitSymbol: string | null | undefined
) {
  if (!value) {
    return null;
  }

  return unitSymbol ? `${value} ${unitSymbol}` : value;
}
