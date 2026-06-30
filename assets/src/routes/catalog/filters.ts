export interface CatalogFilters {
  typeTaxonId?: string;
  includeTypeDescendants?: boolean;
  useCaseTaxonIds: string[];
  numeric: CatalogNumericFilter[];
  booleans: CatalogBooleanFilter[];
  enums: CatalogEnumFilter[];
}

export interface CatalogNumericFilter {
  attributeId: string;
  min?: string;
  max?: string;
}

export interface CatalogBooleanFilter {
  attributeId: string;
  value: boolean;
}

export interface CatalogEnumFilter {
  attributeId: string;
  enumOptionId: string;
}

export interface ProductFiltersInput {
  primaryTypeTaxonId?: string;
  includeTypeDescendants?: boolean;
  useCaseTaxonIds?: string[];
  numeric?: CatalogNumericFilter[];
  booleans?: CatalogBooleanFilter[];
  enums?: CatalogEnumFilter[];
}

export interface CatalogFilterOptionMetadata {
  id: string;
  label: string;
  selected: boolean;
}

export interface CatalogFilterMetadata {
  typeOptions: readonly CatalogFilterOptionMetadata[];
  useCaseOptions: readonly CatalogFilterOptionMetadata[];
  numericFilters: readonly {
    displayName: string;
    selectedMin?: string | null;
    selectedMax?: string | null;
    unitSymbol?: string | null;
  }[];
  booleanFilters: readonly {
    displayName: string;
    selectedValue?: boolean | null;
  }[];
  enumFilters: readonly {
    displayName: string;
    options: readonly CatalogFilterOptionMetadata[];
  }[];
}

const NUMERIC_FILTER_PARAM_PATTERN = /^numeric\.(.+)\.(min|max)$/;
const BOOLEAN_FILTER_PARAM_PATTERN = /^boolean\.(.+)$/;
const ENUM_FILTER_PARAM_PATTERN = /^enum\.(.+)$/;

export function catalogFiltersFromUrl(url: URL): CatalogFilters {
  const numericFilters = new Map<string, CatalogNumericFilter>();
  const booleanFilters = new Map<string, CatalogBooleanFilter>();
  const enumFilters: CatalogEnumFilter[] = [];
  const typeTaxonId = nonBlankParam(url, "typeTaxonId");
  const includeTypeDescendants = url.searchParams.get("includeTypeDescendants") === "1";
  const useCaseTaxonIds = nonBlankParams(url, "useCaseTaxonId");

  for (const [name, rawValue] of url.searchParams.entries()) {
    const numericMatch = NUMERIC_FILTER_PARAM_PATTERN.exec(name);

    if (numericMatch) {
      const value = rawValue.trim();

      if (value === "") {
        continue;
      }

      const [, attributeId, bound] = numericMatch;
      const filter = numericFilters.get(attributeId) ?? { attributeId };

      if (bound === "min") {
        filter.min = value;
      } else {
        filter.max = value;
      }

      numericFilters.set(attributeId, filter);
      continue;
    }

    const booleanMatch = BOOLEAN_FILTER_PARAM_PATTERN.exec(name);

    if (booleanMatch) {
      const value = booleanFilterValue(rawValue);

      if (value === null) {
        continue;
      }

      booleanFilters.set(booleanMatch[1], {
        attributeId: booleanMatch[1],
        value
      });
      continue;
    }

    const enumMatch = ENUM_FILTER_PARAM_PATTERN.exec(name);

    if (enumMatch) {
      const enumOptionId = rawValue.trim();

      if (enumOptionId === "") {
        continue;
      }

      enumFilters.push({
        attributeId: enumMatch[1],
        enumOptionId
      });
    }
  }

  return {
    ...(typeTaxonId ? { typeTaxonId } : {}),
    ...(typeTaxonId && includeTypeDescendants ? { includeTypeDescendants: true } : {}),
    useCaseTaxonIds,
    numeric: Array.from(numericFilters.values()).filter(
      (filter) => filter.min !== undefined || filter.max !== undefined
    ),
    booleans: Array.from(booleanFilters.values()),
    enums: enumFilters
  };
}

export function catalogFiltersToProductFiltersInput(
  filters: CatalogFilters
): ProductFiltersInput | undefined {
  if (!hasActiveCatalogFilters(filters)) {
    return undefined;
  }

  return {
    ...(filters.typeTaxonId ? { primaryTypeTaxonId: filters.typeTaxonId } : {}),
    ...(filters.typeTaxonId && filters.includeTypeDescendants
      ? { includeTypeDescendants: true }
      : {}),
    ...(filters.useCaseTaxonIds.length > 0 ? { useCaseTaxonIds: filters.useCaseTaxonIds } : {}),
    ...(filters.numeric.length > 0 ? { numeric: filters.numeric } : {}),
    ...(filters.booleans.length > 0 ? { booleans: filters.booleans } : {}),
    ...(filters.enums.length > 0 ? { enums: filters.enums } : {})
  };
}

export function hasActiveCatalogFilters(filters: CatalogFilters) {
  return (
    Boolean(filters.typeTaxonId) ||
    filters.useCaseTaxonIds.length > 0 ||
    filters.numeric.length > 0 ||
    filters.booleans.length > 0 ||
    filters.enums.length > 0
  );
}

export function catalogFilterSummaryItems(
  metadata: CatalogFilterMetadata,
  filters: CatalogFilters
) {
  if (!hasActiveCatalogFilters(filters)) {
    return [];
  }

  const summaryItems: string[] = [];
  const selectedType = metadata.typeOptions.find((option) => option.selected);

  if (selectedType) {
    summaryItems.push(
      filters.includeTypeDescendants
        ? `Type: ${selectedType.label} and descendants`
        : `Type: ${selectedType.label}`
    );
  }

  for (const selectedUseCase of metadata.useCaseOptions.filter((option) => option.selected)) {
    summaryItems.push(`Use case: ${selectedUseCase.label}`);
  }

  for (const numericFilter of metadata.numericFilters) {
    const rangeSummary = numericFilterSummary(numericFilter);

    if (rangeSummary) {
      summaryItems.push(`${numericFilter.displayName}: ${rangeSummary}`);
    }
  }

  for (const booleanFilter of metadata.booleanFilters) {
    if (typeof booleanFilter.selectedValue === "boolean") {
      summaryItems.push(`${booleanFilter.displayName}: ${booleanFilter.selectedValue ? "Yes" : "No"}`);
    }
  }

  for (const enumFilter of metadata.enumFilters) {
    for (const selectedOption of enumFilter.options.filter((option) => option.selected)) {
      summaryItems.push(`${enumFilter.displayName}: ${selectedOption.label}`);
    }
  }

  return summaryItems;
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

function formatNumericValue(value: string | null | undefined, unitSymbol: string | null | undefined) {
  if (!value) {
    return null;
  }

  return unitSymbol ? `${value} ${unitSymbol}` : value;
}

function nonBlankParam(url: URL, name: string) {
  const rawValue = url.searchParams.get(name);

  if (rawValue === null) {
    return null;
  }

  const value = rawValue.trim();

  return value === "" ? null : value;
}

function nonBlankParams(url: URL, name: string) {
  return url.searchParams.getAll(name).flatMap((rawValue) => {
    const value = rawValue.trim();

    return value === "" ? [] : [value];
  });
}

function booleanFilterValue(value: string) {
  const normalizedValue = value.trim();

  if (normalizedValue === "true") {
    return true;
  }

  if (normalizedValue === "false") {
    return false;
  }

  return null;
}
