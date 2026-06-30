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
  const enumFilters = new Map<string, CatalogEnumFilter>();
  const typeTaxonId = nonBlankParam(url, "typeTaxonId");
  const includeTypeDescendants = url.searchParams.get("includeTypeDescendants") === "1";
  const useCaseTaxonIds = nonBlankParams(url, "useCaseTaxonId");

  for (const [name, rawValue] of url.searchParams.entries()) {
    if (storeNumericFilter(numericFilters, name, rawValue)) {
      continue;
    }

    if (storeBooleanFilter(booleanFilters, name, rawValue)) {
      continue;
    }

    storeEnumFilter(enumFilters, name, rawValue);
  }

  return {
    ...(typeTaxonId ? { typeTaxonId } : {}),
    ...(typeTaxonId && includeTypeDescendants ? { includeTypeDescendants: true } : {}),
    useCaseTaxonIds,
    numeric: Array.from(numericFilters.values()).filter(
      (filter) => filter.min !== undefined || filter.max !== undefined
    ),
    booleans: Array.from(booleanFilters.values()),
    enums: Array.from(enumFilters.values())
  };
}

function storeNumericFilter(
  numericFilters: Map<string, CatalogNumericFilter>,
  name: string,
  rawValue: string
) {
  const numericMatch = NUMERIC_FILTER_PARAM_PATTERN.exec(name);
  const value = rawValue.trim();

  if (!numericMatch || value === "") {
    return false;
  }

  const [, attributeId, bound] = numericMatch;
  const filter = numericFilters.get(attributeId) ?? { attributeId };

  numericFilters.set(attributeId, { ...filter, [bound]: value });

  return true;
}

function storeBooleanFilter(
  booleanFilters: Map<string, CatalogBooleanFilter>,
  name: string,
  rawValue: string
) {
  const booleanMatch = BOOLEAN_FILTER_PARAM_PATTERN.exec(name);
  const value = booleanFilterValue(rawValue);

  if (!booleanMatch || value === null) {
    return false;
  }

  booleanFilters.set(booleanMatch[1], {
    attributeId: booleanMatch[1],
    value
  });

  return true;
}

function storeEnumFilter(
  enumFilters: Map<string, CatalogEnumFilter>,
  name: string,
  rawValue: string
) {
  const enumMatch = ENUM_FILTER_PARAM_PATTERN.exec(name);
  const enumOptionId = rawValue.trim();

  if (!enumMatch || enumOptionId === "") {
    return false;
  }

  enumFilters.set(enumMatch[1], {
    attributeId: enumMatch[1],
    enumOptionId
  });

  return true;
}

export function catalogFiltersToProductFiltersInput(
  filters: CatalogFilters
): ProductFiltersInput | undefined {
  if (!hasActiveCatalogFilters(filters)) {
    return undefined;
  }

  const enumFilters = uniqueCatalogEnumFilters(filters.enums);

  return {
    ...(filters.typeTaxonId ? { primaryTypeTaxonId: filters.typeTaxonId } : {}),
    ...(filters.typeTaxonId && filters.includeTypeDescendants
      ? { includeTypeDescendants: true }
      : {}),
    ...(filters.useCaseTaxonIds.length > 0 ? { useCaseTaxonIds: filters.useCaseTaxonIds } : {}),
    ...(filters.numeric.length > 0 ? { numeric: filters.numeric } : {}),
    ...(filters.booleans.length > 0 ? { booleans: filters.booleans } : {}),
    ...(enumFilters.length > 0 ? { enums: enumFilters } : {})
  };
}

export function uniqueCatalogEnumFilters(filters: readonly CatalogEnumFilter[]) {
  const filtersByAttribute = new Map<string, CatalogEnumFilter>();

  for (const filter of filters) {
    filtersByAttribute.set(filter.attributeId, filter);
  }

  return Array.from(filtersByAttribute.values());
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
  return hasActiveCatalogFilters(filters)
    ? [
        ...typeFilterSummaryItems(metadata, filters),
        ...selectedUseCaseSummaryItems(metadata),
        ...numericFilterSummaryItems(metadata),
        ...booleanFilterSummaryItems(metadata),
        ...enumFilterSummaryItems(metadata)
      ]
    : [];
}

function typeFilterSummaryItems(metadata: CatalogFilterMetadata, filters: CatalogFilters) {
  const selectedType = metadata.typeOptions.find((option) => option.selected);

  if (!selectedType) {
    return [];
  }

  return [
    filters.includeTypeDescendants
      ? `Type: ${selectedType.label} and descendants`
      : `Type: ${selectedType.label}`
  ];
}

function selectedUseCaseSummaryItems(metadata: CatalogFilterMetadata) {
  return metadata.useCaseOptions
    .filter((option) => option.selected)
    .map((option) => `Use case: ${option.label}`);
}

function numericFilterSummaryItems(metadata: CatalogFilterMetadata) {
  return metadata.numericFilters.flatMap((filter) => {
    const rangeSummary = numericFilterSummary(filter);

    return rangeSummary ? [`${filter.displayName}: ${rangeSummary}`] : [];
  });
}

function booleanFilterSummaryItems(metadata: CatalogFilterMetadata) {
  return metadata.booleanFilters.flatMap((filter) =>
    typeof filter.selectedValue === "boolean"
      ? [`${filter.displayName}: ${filter.selectedValue ? "Yes" : "No"}`]
      : []
  );
}

function enumFilterSummaryItems(metadata: CatalogFilterMetadata) {
  return metadata.enumFilters.flatMap((filter) =>
    filter.options
      .filter((option) => option.selected)
      .map((option) => `${filter.displayName}: ${option.label}`)
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
