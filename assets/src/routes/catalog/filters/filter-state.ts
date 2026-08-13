import type {
  BrowseRouteQuery,
  ProductBooleanFilterInput,
  ProductEnumFilterInput,
  ProductFiltersInput,
  ProductNumericFilterInput,
  ProductSort,
} from "$generated/BrowseRouteQuery.graphql";

export interface CatalogFilters {
  query?: string;
  sort?: CatalogProductSort;
  typeTaxonId?: string;
  includeTypeDescendants?: boolean;
  useCaseTaxonIds: string[];
  numeric: ProductNumericFilterInput[];
  booleans: ProductBooleanFilterInput[];
  enums: ProductEnumFilterInput[];
}

export const CATALOG_PRODUCT_SORTS = [
  "RELEVANCE",
  "ID_ASC",
  "NAME_ASC",
  "BRAND_NAME_ASC",
  "NEWEST",
] as const;

export type CatalogProductSort = Exclude<ProductSort, "%future added value">;

type ProductFilterMetadata = BrowseRouteQuery["response"]["productFilterMetadata"];
type TypeOption = ProductFilterMetadata["typeOptions"][number];
type UseCaseOption = ProductFilterMetadata["useCaseOptions"][number];
type NumericFilterMetadata = ProductFilterMetadata["numericFilters"][number];
type BooleanFilterMetadata = ProductFilterMetadata["booleanFilters"][number];
type EnumFilterMetadata = ProductFilterMetadata["enumFilters"][number];
type EnumFilterOption = EnumFilterMetadata["options"][number];

export type CatalogFilterMetadata = {
  typeOptions: ReadonlyArray<Pick<TypeOption, "id" | "label" | "selected">>;
  useCaseOptions: ReadonlyArray<Pick<UseCaseOption, "id" | "label" | "selected">>;
  numericFilters: ReadonlyArray<
    Pick<
      NumericFilterMetadata,
      "attributeId" | "displayName" | "selectedMax" | "selectedMin" | "unitSymbol"
    >
  >;
  booleanFilters: ReadonlyArray<
    Pick<BooleanFilterMetadata, "attributeId" | "displayName" | "selectedValue">
  >;
  enumFilters: ReadonlyArray<
    Pick<EnumFilterMetadata, "attributeId" | "displayName"> & {
      options: ReadonlyArray<Pick<EnumFilterOption, "id" | "label" | "selected">>;
    }
  >;
};

const NUMERIC_FILTER_PARAM_PATTERN = /^numeric\.(.+)\.(min|max)$/;
const BOOLEAN_FILTER_PARAM_PATTERN = /^boolean\.(.+)$/;
const ENUM_FILTER_PARAM_PATTERN = /^enum\.(.+)$/;
const DECIMAL_FILTER_VALUE_PATTERN = /^[+-]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:[eE][+-]?\d+)?$/;
const MAX_DECIMAL_EXPONENT_SHIFT = 1_000;
export const MAX_CATALOG_SEARCH_QUERY_LENGTH = 100;

const CATALOG_PRODUCT_SORT_LABELS = {
  RELEVANCE: "Relevance",
  ID_ASC: "Catalog order",
  NAME_ASC: "Product name",
  BRAND_NAME_ASC: "Brand name",
  NEWEST: "Newest",
} satisfies Record<CatalogProductSort, string>;

export function catalogProductSortLabel(sort: CatalogProductSort) {
  return CATALOG_PRODUCT_SORT_LABELS[sort];
}

export function catalogProductSortFromValue(value: string): CatalogProductSort {
  return supportedCatalogProductSort(value) ?? "ID_ASC";
}

function supportedCatalogProductSort(value: string): CatalogProductSort | null {
  switch (value) {
    case "RELEVANCE":
    case "ID_ASC":
    case "NAME_ASC":
    case "BRAND_NAME_ASC":
    case "NEWEST":
      return value;
    default:
      return null;
  }
}

export function catalogProductSortParam(
  filters: Pick<CatalogFilters, "query" | "sort">,
): CatalogProductSort | undefined {
  if (filters.query) {
    return filters.sort === "RELEVANCE" ? undefined : filters.sort;
  }

  return filters.sort === "NAME_ASC" ||
    filters.sort === "BRAND_NAME_ASC" ||
    filters.sort === "NEWEST"
    ? filters.sort
    : undefined;
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
  const numericFilters = new Map<string, ProductNumericFilterInput>();
  const booleanFilters = new Map<string, ProductBooleanFilterInput>();
  const enumFilters = new Map<string, ProductEnumFilterInput>();
  const typeTaxonId = nonBlankParam(url, "typeTaxonId");
  const query = catalogSearchQuery(url.searchParams.get("q"));
  const sort = catalogProductSort(url.searchParams.get("sort"), Boolean(query));
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
    enums: Array.from(enumFilters.values()),
  };
}

function storeNumericFilter(
  numericFilters: Map<string, ProductNumericFilterInput>,
  name: string,
  rawValue: string,
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
  booleanFilters: Map<string, ProductBooleanFilterInput>,
  name: string,
  rawValue: string,
) {
  const booleanMatch = BOOLEAN_FILTER_PARAM_PATTERN.exec(name);
  const value = booleanFilterValue(rawValue);

  if (!booleanMatch || value === null) {
    return false;
  }

  booleanFilters.set(booleanMatch[1], {
    attributeId: booleanMatch[1],
    value,
  });

  return true;
}

function storeEnumFilter(
  enumFilters: Map<string, ProductEnumFilterInput>,
  name: string,
  rawValue: string,
) {
  const enumMatch = ENUM_FILTER_PARAM_PATTERN.exec(name);
  const enumOptionId = rawValue.trim();

  if (!enumMatch || enumOptionId === "") {
    return false;
  }

  enumFilters.set(enumMatch[1], {
    attributeId: enumMatch[1],
    enumOptionId,
  });

  return true;
}

export function catalogFiltersToProductFiltersInput(
  filters: CatalogFilters,
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
    ...(enumFilters.length > 0 ? { enums: enumFilters } : {}),
  };
}

export function uniqueCatalogEnumFilters(filters: readonly ProductEnumFilterInput[]) {
  const filtersByAttribute = new Map<string, ProductEnumFilterInput>();

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

function validCatalogNumericFilters(filters: readonly ProductNumericFilterInput[]) {
  return filters
    .filter(hasNumericFilterBound)
    .filter(hasValidNumericBounds)
    .filter(hasOrderedNumericBounds);
}

function hasNumericFilterBound(filter: ProductNumericFilterInput) {
  return filter.min != null || filter.max != null;
}

function hasValidNumericBounds(filter: ProductNumericFilterInput) {
  return (
    (filter.min == null || isValidDecimalFilterValue(filter.min)) &&
    (filter.max == null || isValidDecimalFilterValue(filter.max))
  );
}

function hasOrderedNumericBounds(filter: ProductNumericFilterInput) {
  if (filter.min == null || filter.max == null) {
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

  const sign = value.startsWith("-") ? -1 : 1;
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
  right: DecimalFilterValueParts,
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

function catalogSearchQuery(rawValue: string | null) {
  const value = rawValue?.trim() ?? "";

  return value === "" ? null : value.slice(0, MAX_CATALOG_SEARCH_QUERY_LENGTH);
}

function catalogProductSort(rawValue: string | null, hasQuery: boolean): CatalogProductSort | null {
  const value = rawValue?.trim() ?? "";
  const parsed = supportedCatalogProductSort(value);

  if (hasQuery) {
    return parsed ?? "RELEVANCE";
  }

  return catalogProductSortWithoutQuery(parsed);
}

function catalogProductSortWithoutQuery(
  parsed: CatalogProductSort | null,
): CatalogProductSort | null {
  switch (parsed) {
    case "NAME_ASC":
    case "BRAND_NAME_ASC":
    case "NEWEST":
      return parsed;
    default:
      return null;
  }
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
