export interface CatalogFilters {
  query?: string;
  sort?: CatalogProductSort;
  typeTaxonId?: string;
  includeTypeDescendants?: boolean;
  useCaseTaxonIds: string[];
  numeric: CatalogNumericFilter[];
  booleans: CatalogBooleanFilter[];
  enums: CatalogEnumFilter[];
}

export const CATALOG_PRODUCT_SORTS = [
  "ID_ASC",
  "NAME_ASC",
  "BRAND_NAME_ASC",
  "NEWEST"
] as const;

export type CatalogProductSort = (typeof CATALOG_PRODUCT_SORTS)[number];

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
  query?: string;
  sort?: CatalogProductSort;
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
const DECIMAL_FILTER_VALUE_PATTERN =
  /^[+-]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:[eE][+-]?\d+)?$/;
const MAX_DECIMAL_EXPONENT_SHIFT = 1_000;
export const MAX_CATALOG_SEARCH_QUERY_LENGTH = 100;

const CATALOG_PRODUCT_SORT_LABELS: Record<CatalogProductSort, string> = {
  ID_ASC: "Catalog order",
  NAME_ASC: "Product name",
  BRAND_NAME_ASC: "Brand name",
  NEWEST: "Newest"
};

export function catalogProductSortLabel(sort: CatalogProductSort) {
  return CATALOG_PRODUCT_SORT_LABELS[sort];
}

interface DecimalFilterValueParts {
  sign: -1 | 1;
  integer: string;
  fraction: string;
}

interface ParsedDecimalFilterValue {
  sign: -1 | 1;
  rawInteger: string;
  rawFraction: string;
  exponent: number;
}

export function catalogFiltersFromUrl(url: URL): CatalogFilters {
  const numericFilters = new Map<string, CatalogNumericFilter>();
  const booleanFilters = new Map<string, CatalogBooleanFilter>();
  const enumFilters = new Map<string, CatalogEnumFilter>();
  const typeTaxonId = nonBlankParam(url, "typeTaxonId");
  const query = catalogSearchQuery(url.searchParams.get("q"));
  const sort = catalogProductSort(url.searchParams.get("sort"));
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
    ...(query ? { query } : {}),
    ...(sort ? { sort } : {}),
    ...(typeTaxonId ? { typeTaxonId } : {}),
    ...(typeTaxonId && includeTypeDescendants ? { includeTypeDescendants: true } : {}),
    useCaseTaxonIds,
    numeric: validCatalogNumericFilters(Array.from(numericFilters.values())),
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

  if (!numericMatch) {
    return false;
  }

  if (value === "" || !isValidDecimalFilterValue(value)) {
    return true;
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
  if (!hasActiveCatalogFilters(filters) && !filters.sort) {
    return undefined;
  }

  const enumFilters = uniqueCatalogEnumFilters(filters.enums);
  const numericFilters = validCatalogNumericFilters(filters.numeric);

  return {
    ...(filters.query ? { query: filters.query } : {}),
    ...(filters.sort ? { sort: filters.sort } : {}),
    ...(filters.typeTaxonId ? { primaryTypeTaxonId: filters.typeTaxonId } : {}),
    ...(filters.typeTaxonId && filters.includeTypeDescendants
      ? { includeTypeDescendants: true }
      : {}),
    ...(filters.useCaseTaxonIds.length > 0 ? { useCaseTaxonIds: filters.useCaseTaxonIds } : {}),
    ...(numericFilters.length > 0 ? { numeric: numericFilters } : {}),
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
    Boolean(filters.query) ||
    Boolean(filters.typeTaxonId) ||
    filters.useCaseTaxonIds.length > 0 ||
    validCatalogNumericFilters(filters.numeric).length > 0 ||
    filters.booleans.length > 0 ||
    filters.enums.length > 0
  );
}

function validCatalogNumericFilters(filters: readonly CatalogNumericFilter[]) {
  return filters
    .filter(hasNumericFilterBound)
    .filter(hasValidNumericBounds)
    .filter(hasOrderedNumericBounds);
}

function hasNumericFilterBound(filter: CatalogNumericFilter) {
  return filter.min !== undefined || filter.max !== undefined;
}

function hasValidNumericBounds(filter: CatalogNumericFilter) {
  return (
    (filter.min === undefined || isValidDecimalFilterValue(filter.min)) &&
    (filter.max === undefined || isValidDecimalFilterValue(filter.max))
  );
}

function hasOrderedNumericBounds(filter: CatalogNumericFilter) {
  if (filter.min === undefined || filter.max === undefined) {
    return true;
  }

  return compareDecimalFilterValues(filter.min, filter.max) <= 0;
}

function isValidDecimalFilterValue(value: string) {
  return decimalFilterValueParts(value) !== null;
}

function compareDecimalFilterValues(left: string, right: string) {
  const leftParts = decimalFilterValueParts(left);
  const rightParts = decimalFilterValueParts(right);

  if (!leftParts || !rightParts) {
    return 0;
  }

  if (leftParts.sign !== rightParts.sign) {
    return leftParts.sign > rightParts.sign ? 1 : -1;
  }

  const absoluteComparison = compareAbsoluteDecimalFilterValues(leftParts, rightParts);

  return leftParts.sign === -1 ? -absoluteComparison : absoluteComparison;
}

function decimalFilterValueParts(value: string): DecimalFilterValueParts | null {
  const parsed = parseDecimalFilterValue(value);

  if (!parsed) {
    return null;
  }

  const digits = decimalDigits(parsed);

  if (isZeroDecimalDigits(digits)) {
    return { sign: 1, integer: "0", fraction: "" };
  }

  return normalizeDecimalParts(parsed.sign, digits, parsed.rawInteger.length + parsed.exponent);
}

function parseDecimalFilterValue(value: string): ParsedDecimalFilterValue | null {
  if (!DECIMAL_FILTER_VALUE_PATTERN.test(value)) {
    return null;
  }

  const sign: -1 | 1 = value.startsWith("-") ? -1 : 1;
  const unsignedValue = value.startsWith("-") || value.startsWith("+") ? value.slice(1) : value;
  const [coefficient, rawExponent = "0"] = unsignedValue.split(/[eE]/);
  const exponent = Number.parseInt(rawExponent, 10);

  if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > MAX_DECIMAL_EXPONENT_SHIFT) {
    return null;
  }

  const [rawInteger, rawFraction = ""] = coefficient.split(".");

  return { sign, rawInteger, rawFraction, exponent };
}

function decimalDigits(value: ParsedDecimalFilterValue) {
  return `${value.rawInteger}${value.rawFraction}`;
}

function isZeroDecimalDigits(digits: string) {
  return /^0*$/.test(digits);
}

function normalizeDecimalParts(sign: -1 | 1, digits: string, decimalPoint: number) {
  const [rawInteger, rawFraction] = splitDecimalDigits(digits, decimalPoint);
  const integer = rawInteger.replace(/^0+/, "") || "0";
  const fraction = rawFraction.replace(/0+$/, "");

  return { sign, integer, fraction };
}

function splitDecimalDigits(digits: string, decimalPoint: number) {
  if (decimalPoint <= 0) {
    return ["0", `${"0".repeat(Math.abs(decimalPoint))}${digits}`];
  }

  if (decimalPoint >= digits.length) {
    return [`${digits}${"0".repeat(decimalPoint - digits.length)}`, ""];
  }

  return [digits.slice(0, decimalPoint), digits.slice(decimalPoint)];
}

function compareAbsoluteDecimalFilterValues(
  left: DecimalFilterValueParts,
  right: DecimalFilterValueParts
) {
  if (left.integer.length !== right.integer.length) {
    return left.integer.length > right.integer.length ? 1 : -1;
  }

  if (left.integer !== right.integer) {
    return left.integer > right.integer ? 1 : -1;
  }

  const fractionLength = Math.max(left.fraction.length, right.fraction.length);
  const leftFraction = left.fraction.padEnd(fractionLength, "0");
  const rightFraction = right.fraction.padEnd(fractionLength, "0");

  if (leftFraction === rightFraction) {
    return 0;
  }

  return leftFraction > rightFraction ? 1 : -1;
}

export function catalogFilterSummaryItems(
  metadata: CatalogFilterMetadata,
  filters: CatalogFilters
) {
  return [
    ...(filters.query ? [`Search: "${filters.query}"`] : []),
    ...(filters.sort ? [`Sort: ${catalogProductSortLabel(filters.sort)}`] : []),
    ...typeFilterSummaryItems(metadata, filters),
    ...selectedUseCaseSummaryItems(metadata),
    ...numericFilterSummaryItems(metadata),
    ...booleanFilterSummaryItems(metadata),
    ...enumFilterSummaryItems(metadata)
  ];
}

function catalogSearchQuery(rawValue: string | null) {
  const value = rawValue?.trim() ?? "";

  return value === "" ? null : value.slice(0, MAX_CATALOG_SEARCH_QUERY_LENGTH);
}

function catalogProductSort(rawValue: string | null): CatalogProductSort | null {
  const value = rawValue?.trim() ?? "";

  return CATALOG_PRODUCT_SORTS.includes(value as CatalogProductSort)
    ? (value as CatalogProductSort)
    : null;
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
