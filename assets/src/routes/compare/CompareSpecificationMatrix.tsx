import {
  Root as ScrollAreaRoot,
  Scrollbar as ScrollAreaScrollbar,
  Thumb as ScrollAreaThumb,
  Viewport as ScrollAreaViewport
} from "@radix-ui/react-scroll-area";
import { create, props } from "@stylexjs/stylex";
import { tokens } from "../../ui/theme/tokens.stylex";
import type { CompareProductSummary, CompareSpecMode } from "./loader";

const MISSING_ATTRIBUTE_VALUE = "Not available";
const SPECIFICATION_MATRIX_TITLES: Record<CompareSpecMode, string> = {
  all: "All specifications",
  differences: "Different specifications",
  shared: "Shared specifications"
};
const EMPTY_SPECIFICATION_MATRIX_MESSAGES: Record<CompareSpecMode, string> = {
  all: "No specifications are available for these products yet.",
  differences: "No specification differences across these products yet.",
  shared: "No shared specifications across these products yet."
};

const styles = create({
  tableWorkspace: {
    overflow: "hidden",
    paddingBlockEnd: "0.35rem"
  },
  tableViewport: {
    width: "100%"
  },
  tableScrollbar: {
    backgroundColor: tokens.surfaceMuted,
    display: "flex",
    height: "0.65rem",
    padding: "0.15rem",
    userSelect: "none"
  },
  tableThumb: {
    backgroundColor: tokens.borderEmphasized,
    borderRadius: "999px",
    flex: 1
  },
  table: {
    borderCollapse: "collapse",
    minWidth: "48rem",
    width: "100%"
  }
});

export function CompareSpecificationMatrix({
  products,
  specMode
}: {
  products: CompareProductSummary[];
  specMode: CompareSpecMode;
}) {
  if (products.length < 2) {
    return null;
  }

  const rows = buildSpecificationRows(products, specMode);
  const title = specificationMatrixTitle(specMode);

  return (
    <section aria-label="Specification comparison">
      <h2>{title}</h2>
      <ScrollAreaRoot type="auto" {...props(styles.tableWorkspace)}>
        <ScrollAreaViewport {...props(styles.tableViewport)}>
          {rows.length === 0 ? (
            <p>{emptySpecificationMatrixMessage(specMode)}</p>
          ) : (
            <SpecificationTable products={products} rows={rows} title={title} />
          )}
        </ScrollAreaViewport>
        <ScrollAreaScrollbar orientation="horizontal" {...props(styles.tableScrollbar)}>
          <ScrollAreaThumb {...props(styles.tableThumb)} />
        </ScrollAreaScrollbar>
      </ScrollAreaRoot>
    </section>
  );
}

interface CompareSpecificationRow {
  code: string;
  displayName: string;
  sortOrder: number | null;
  missingValues: boolean[];
  values: string[];
  comparisonValues: string[];
}

function SpecificationTable({
  products,
  rows,
  title
}: {
  products: CompareProductSummary[];
  rows: CompareSpecificationRow[];
  title: string;
}) {
  return (
    <table aria-label={title} {...props(styles.table)}>
      <thead>
        <tr>
          <th scope="col">Specification</th>
          {products.map((product) => (
            <th key={product.id} scope="col">
              {product.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.code}>
            <th scope="row">{row.displayName}</th>
            {row.values.map((value, index) => (
              <td key={`${row.code}-${products[index]?.id ?? index}`}>{value}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function buildSpecificationRows(
  products: CompareProductSummary[],
  specMode: CompareSpecMode
) {
  const rows = buildAllSpecificationRows(products);

  if (specMode === "all") {
    return rows;
  }

  if (specMode === "differences") {
    return rows.filter(hasSpecificationDifference);
  }

  return rows.filter((row) => row.missingValues.every((isMissing) => !isMissing));
}

function buildAllSpecificationRows(products: CompareProductSummary[]): CompareSpecificationRow[] {
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
  attributeMaps: Array<Map<string, CompareProductSummary["currentAttributes"][number]>>;
  code: string;
  displayName: string;
}): CompareSpecificationRow {
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

function hasSpecificationDifference(row: CompareSpecificationRow) {
  if (row.missingValues.some(Boolean)) {
    return true;
  }

  return new Set(row.comparisonValues).size > 1;
}

function compareSpecificationRows(
  firstRow: CompareSpecificationRow,
  secondRow: CompareSpecificationRow
) {
  const sortOrderComparison = compareSpecificationSortOrders(
    firstRow.sortOrder,
    secondRow.sortOrder
  );

  if (sortOrderComparison !== 0) {
    return sortOrderComparison;
  }

  const nameComparison = firstRow.displayName.localeCompare(secondRow.displayName);

  return nameComparison === 0 ? firstRow.code.localeCompare(secondRow.code) : nameComparison;
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
  attributes: Array<CompareProductSummary["currentAttributes"][number] | undefined>
) {
  return attributes.find((attribute) => typeof attribute?.sortOrder === "number")?.sortOrder ?? null;
}

function buildAttributeComparisonValue(
  attribute: CompareProductSummary["currentAttributes"][number] | undefined
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

const DECIMAL_COMPARISON_VALUE_PATTERN =
  /^[+-]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:[eE][+-]?\d+)?$/;
const MAX_DECIMAL_COMPARISON_EXPONENT_SHIFT = 1_000;

interface ParsedDecimalComparisonValue {
  sign: -1 | 1;
  integer: string;
  fraction: string;
  exponent: number;
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

function specificationMatrixTitle(specMode: CompareSpecMode) {
  return SPECIFICATION_MATRIX_TITLES[specMode] ?? SPECIFICATION_MATRIX_TITLES.shared;
}

function emptySpecificationMatrixMessage(specMode: CompareSpecMode) {
  return (
    EMPTY_SPECIFICATION_MATRIX_MESSAGES[specMode] ?? EMPTY_SPECIFICATION_MATRIX_MESSAGES.shared
  );
}

function buildFirstAttributeByCode(attributes: CompareProductSummary["currentAttributes"]) {
  const attributesByCode = new Map<string, CompareProductSummary["currentAttributes"][number]>();

  for (const attribute of attributes ?? []) {
    if (!attributesByCode.has(attribute.code)) {
      attributesByCode.set(attribute.code, attribute);
    }
  }

  return attributesByCode;
}
