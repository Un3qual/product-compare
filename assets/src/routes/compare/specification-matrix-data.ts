import { compareProductText } from "../product-formatting";

const MISSING_ATTRIBUTE_VALUE = "Not available";
const DECIMAL_COMPARISON_VALUE_PATTERN =
  /^[+-]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:[eE][+-]?\d+)?$/;
const MAX_DECIMAL_COMPARISON_EXPONENT_SHIFT = 1_000;

export type SpecificationMatrixMode = "shared" | "differences" | "all";

export interface SpecificationMatrixProduct {
  id: string;
  name: string;
  currentAttributes: readonly SpecificationMatrixAttribute[];
}

export interface SpecificationMatrixAttribute {
  code: string;
  displayName: string;
  valueText: string;
  sortOrder?: number | null;
  numericValue?: string | null;
  booleanValue?: boolean | null;
  unitSymbol?: string | null;
}

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
  specMode: SpecificationMatrixMode
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

function buildAllSpecificationRows(
  products: readonly SpecificationMatrixProduct[]
): SpecificationMatrixRow[] {
  const [firstProduct, ...remainingProducts] = products;

  if (!firstProduct || remainingProducts.length === 0) {
    return [];
  }

  const attributeMaps = products.map((product) =>
    buildFirstAttributeByCode(product.currentAttributes)
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
        displayName: attribute.displayName
      })
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
          displayName: attribute.displayName
        })
      ];
    })
  );

  return [...firstProductRows, ...additionalRows].sort(compareSpecificationRows);
}

function buildSpecificationRow({
  attributeMaps,
  code,
  displayName
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
    comparisonValues: attributes.map(buildAttributeComparisonValue)
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
  secondRow: SpecificationMatrixRow
) {
  const sortOrderComparison = compareSpecificationSortOrders(
    firstRow.sortOrder,
    secondRow.sortOrder
  );

  if (sortOrderComparison !== 0) {
    return sortOrderComparison;
  }

  const nameComparison = compareProductText(firstRow.displayName, secondRow.displayName);

  return nameComparison === 0
    ? compareProductText(firstRow.code, secondRow.code)
    : nameComparison;
}

function compareSpecificationSortOrders(
  firstSortOrder: number | null,
  secondSortOrder: number | null
) {
  if (typeof firstSortOrder === "number" && typeof secondSortOrder === "number") {
    return firstSortOrder - secondSortOrder;
  }

  if (typeof firstSortOrder === "number") {
    return -1;
  }

  if (typeof secondSortOrder === "number") {
    return 1;
  }

  return 0;
}

function firstPresentSortOrder(
  attributes: Array<SpecificationMatrixAttribute | undefined>
) {
  return attributes.find((attribute) => typeof attribute?.sortOrder === "number")?.sortOrder ?? null;
}

function buildAttributeComparisonValue(
  attribute: SpecificationMatrixAttribute | undefined
) {
  if (!attribute) {
    return "missing";
  }

  if (typeof attribute.numericValue === "string" && attribute.numericValue.trim() !== "") {
    const normalizedNumericValue = normalizeDecimalComparisonValue(attribute.numericValue);
    const normalizedUnitSymbol = normalizeUnitComparisonValue(attribute.unitSymbol);

    return `numeric:${normalizedNumericValue}:${normalizedUnitSymbol}`;
  }

  if (typeof attribute.booleanValue === "boolean") {
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

  const sign: -1 | 1 = value.startsWith("-") ? -1 : 1;
  const unsignedValue = value.startsWith("-") || value.startsWith("+") ? value.slice(1) : value;
  const [coefficient, rawExponent = "0"] = unsignedValue.split(/[eE]/);
  const exponent = Number.parseInt(rawExponent, 10);

  if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > MAX_DECIMAL_COMPARISON_EXPONENT_SHIFT) {
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

function normalizeUnitComparisonValue(unitSymbol: string | null | undefined) {
  return unitSymbol?.trim() ?? "";
}

function buildFirstAttributeByCode(
  attributes: readonly SpecificationMatrixAttribute[]
) {
  const attributesByCode = new Map<string, SpecificationMatrixAttribute>();

  for (const attribute of attributes ?? []) {
    if (!attributesByCode.has(attribute.code)) {
      attributesByCode.set(attribute.code, attribute);
    }
  }

  return attributesByCode;
}
