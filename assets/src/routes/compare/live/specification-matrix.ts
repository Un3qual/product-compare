import { compareProductText } from "$frontend/formatting";
import type { CompareProductSummary, CompareSpecMode } from "../compare-route-data";

const TITLES = {
  all: "All specifications",
  differences: "Different specifications",
  shared: "Shared specifications",
} satisfies Record<CompareSpecMode, string>;

const EMPTY_MESSAGES = {
  all: "No specifications are available for these products yet.",
  differences: "No specification differences across these products yet.",
  shared: "No shared specifications across these products yet.",
} satisfies Record<CompareSpecMode, string>;

const MISSING_ATTRIBUTE_VALUE = "Not available";
const DECIMAL_COMPARISON_VALUE_PATTERN = /^[+-]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:[eE][+-]?\d+)?$/;
const MAX_DECIMAL_COMPARISON_EXPONENT_SHIFT = 1_000;

export type SpecificationMatrixProduct = Pick<
  CompareProductSummary,
  "currentAttributes" | "id" | "name"
>;
type SpecificationMatrixAttribute = SpecificationMatrixProduct["currentAttributes"][number];

export interface SpecificationMatrixRow {
  code: string;
  displayName: string;
  sortOrder: number | null;
  missingValues: boolean[];
  values: string[];
  comparisonValues: string[];
}

interface ParsedDecimalComparisonValue {
  sign: -1 | 1;
  integer: string;
  fraction: string;
  exponent: number;
}

export function buildSpecificationMatrixRows(
  products: readonly SpecificationMatrixProduct[],
  specMode: CompareSpecMode,
): SpecificationMatrixRow[] {
  const rows = buildAllSpecificationRows(products);

  if (specMode === "all") {
    return rows;
  }

  if (specMode === "differences") {
    return rows.filter(hasSpecificationDifference);
  }

  return rows.filter((row) => row.missingValues.every((isMissing) => !isMissing));
}

export function specificationMatrixView(
  products: readonly CompareProductSummary[],
  specMode: CompareSpecMode,
) {
  return {
    emptyMessage: EMPTY_MESSAGES[specMode],
    rows: buildSpecificationMatrixRows(products, specMode),
    title: TITLES[specMode],
  };
}

function buildAllSpecificationRows(
  products: readonly SpecificationMatrixProduct[],
): SpecificationMatrixRow[] {
  const [firstProduct, ...remainingProducts] = products;

  if (!firstProduct || remainingProducts.length === 0) {
    return [];
  }

  const attributeMaps = products.map((product) =>
    buildFirstAttributeByCode(product.currentAttributes),
  );
  const seenCodes = new Set<string>();
  const firstProductRows = firstProduct.currentAttributes.flatMap((attribute) => {
    if (seenCodes.has(attribute.code)) {
      return [];
    }

    seenCodes.add(attribute.code);

    return [
      buildSpecificationRow({
        attributeMaps,
        code: attribute.code,
        displayName: attribute.displayName,
      }),
    ];
  });
  const additionalRows = remainingProducts.flatMap((product) =>
    product.currentAttributes.flatMap((attribute) => {
      if (seenCodes.has(attribute.code)) {
        return [];
      }

      seenCodes.add(attribute.code);

      return [
        buildSpecificationRow({
          attributeMaps,
          code: attribute.code,
          displayName: attribute.displayName,
        }),
      ];
    }),
  );

  return [...firstProductRows, ...additionalRows].sort(compareSpecificationRows);
}

function buildSpecificationRow({
  attributeMaps,
  code,
  displayName,
}: {
  attributeMaps: Array<Map<string, SpecificationMatrixAttribute>>;
  code: string;
  displayName: string;
}): SpecificationMatrixRow {
  const attributes = attributeMaps.map((attributesByCode) => attributesByCode.get(code));

  return {
    code,
    displayName,
    sortOrder: firstPresentSortOrder(attributes),
    missingValues: attributes.map((attribute) => !attribute),
    values: attributes.map((attribute) => attribute?.valueText ?? MISSING_ATTRIBUTE_VALUE),
    comparisonValues: attributes.map(buildAttributeComparisonValue),
  };
}

function hasSpecificationDifference(row: SpecificationMatrixRow) {
  if (row.missingValues.some(Boolean)) {
    return true;
  }

  return new Set(row.comparisonValues).size > 1;
}

function compareSpecificationRows(
  firstRow: SpecificationMatrixRow,
  secondRow: SpecificationMatrixRow,
) {
  const sortOrderComparison = compareSpecificationSortOrders(
    firstRow.sortOrder,
    secondRow.sortOrder,
  );

  if (sortOrderComparison !== 0) {
    return sortOrderComparison;
  }

  const nameComparison = compareProductText(firstRow.displayName, secondRow.displayName);

  return nameComparison === 0 ? compareProductText(firstRow.code, secondRow.code) : nameComparison;
}

function compareSpecificationSortOrders(
  firstSortOrder: number | null,
  secondSortOrder: number | null,
) {
  if (firstSortOrder !== null && secondSortOrder !== null) {
    return firstSortOrder - secondSortOrder;
  }

  if (firstSortOrder !== null) {
    return -1;
  }

  if (secondSortOrder !== null) {
    return 1;
  }

  return 0;
}

function firstPresentSortOrder(attributes: Array<SpecificationMatrixAttribute | undefined>) {
  return (
    attributes.find((attribute) => attribute && attribute.sortOrder !== null)?.sortOrder ?? null
  );
}

function buildAttributeComparisonValue(attribute: SpecificationMatrixAttribute | undefined) {
  if (!attribute) {
    return "missing";
  }

  if (attribute.numericValue?.trim()) {
    const normalizedNumericValue = normalizeDecimalComparisonValue(attribute.numericValue);
    const normalizedUnitSymbol = normalizeUnitComparisonValue(attribute.unitSymbol);

    return `numeric:${normalizedNumericValue}:${normalizedUnitSymbol}`;
  }

  if (attribute.booleanValue !== null) {
    return `boolean:${attribute.booleanValue}`;
  }

  return `text:${attribute.valueText}`;
}

function normalizeDecimalComparisonValue(value: string) {
  const trimmedValue = value.trim();
  const parsedValue = parseDecimalComparisonValue(trimmedValue);

  if (!parsedValue) {
    return trimmedValue;
  }

  const digits = `${parsedValue.integer}${parsedValue.fraction}`;

  if (/^0*$/.test(digits)) {
    return "0";
  }

  const decimalPoint = parsedValue.integer.length + parsedValue.exponent;
  const [rawIntegerPart, rawFractionPart] = splitDecimalComparisonDigits(digits, decimalPoint);
  const sign = parsedValue.sign === -1 ? "-" : "";
  const normalizedIntegerPart = rawIntegerPart.replace(/^0+/, "") || "0";
  const normalizedFractionPart = rawFractionPart.replace(/0+$/, "");

  return normalizedFractionPart
    ? `${sign}${normalizedIntegerPart}.${normalizedFractionPart}`
    : `${sign}${normalizedIntegerPart}`;
}

function parseDecimalComparisonValue(value: string): ParsedDecimalComparisonValue | null {
  if (!DECIMAL_COMPARISON_VALUE_PATTERN.test(value)) {
    return null;
  }

  const sign = value.startsWith("-") ? -1 : 1;
  const unsignedValue = value.startsWith("-") || value.startsWith("+") ? value.slice(1) : value;
  const [coefficient, rawExponent = "0"] = unsignedValue.split(/[eE]/);
  const exponent = Number.parseInt(rawExponent, 10);

  if (
    !Number.isSafeInteger(exponent) ||
    Math.abs(exponent) > MAX_DECIMAL_COMPARISON_EXPONENT_SHIFT
  ) {
    return null;
  }

  const [integer, fraction = ""] = coefficient.split(".");

  return { sign, integer, fraction, exponent };
}

function splitDecimalComparisonDigits(digits: string, decimalPoint: number) {
  if (decimalPoint <= 0) {
    return ["0", `${"0".repeat(Math.abs(decimalPoint))}${digits}`];
  }

  if (decimalPoint >= digits.length) {
    return [`${digits}${"0".repeat(decimalPoint - digits.length)}`, ""];
  }

  return [digits.slice(0, decimalPoint), digits.slice(decimalPoint)];
}

function normalizeUnitComparisonValue(unitSymbol: string | null) {
  return unitSymbol?.trim() ?? "";
}

function buildFirstAttributeByCode(attributes: readonly SpecificationMatrixAttribute[]) {
  const attributesByCode = new Map<string, SpecificationMatrixAttribute>();

  for (const attribute of attributes) {
    if (!attributesByCode.has(attribute.code)) {
      attributesByCode.set(attribute.code, attribute);
    }
  }

  return attributesByCode;
}
