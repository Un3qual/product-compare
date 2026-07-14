import {
  buildSpecificationMatrixRows,
  type SpecificationMatrixProduct
} from "../../../src/routes/compare/specification-matrix-data";

test("buildSpecificationMatrixRows preserves first duplicates and stable row ordering", () => {
  const rows = buildSpecificationMatrixRows(
    [
      matrixProduct("first", [
        {
          code: "zeta",
          displayName: "Zebra",
          valueText: "First value"
        },
        {
          code: "zeta",
          displayName: "Duplicate label",
          valueText: "Duplicate value"
        },
        {
          code: "beta",
          displayName: "Beta",
          sortOrder: 20,
          valueText: "20"
        }
      ]),
      matrixProduct("second", [
        {
          code: "accent",
          displayName: "Älg",
          valueText: "Accent value"
        },
        {
          code: "zeta",
          displayName: "Second zebra",
          valueText: "Second value"
        },
        {
          code: "beta",
          displayName: "Beta",
          sortOrder: 20,
          valueText: "21"
        }
      ])
    ],
    "all"
  );

  expect(rows.map((row) => row.code)).toEqual(["beta", "accent", "zeta"]);
  expect(rows[2]).toMatchObject({
    displayName: "Zebra",
    values: ["First value", "Second value"]
  });
  expect(rows.flatMap((row) => row.values)).not.toContain("Duplicate value");
});

test("buildSpecificationMatrixRows preserves missing cells across every mode", () => {
  const products = [
    matrixProduct("first", [
      { code: "different", displayName: "Different", valueText: "IPS" },
      { code: "missing", displayName: "Missing", valueText: "Only first" },
      {
        code: "same-number",
        displayName: "Same number",
        numericValue: "1e3",
        unitSymbol: " GB ",
        valueText: "1000 GB"
      }
    ]),
    matrixProduct("second", [
      { code: "different", displayName: "Different", valueText: "OLED" },
      {
        code: "same-number",
        displayName: "Same number",
        numericValue: "1000.0",
        unitSymbol: "GB",
        valueText: "1000.0 GB"
      }
    ])
  ];

  expect(buildSpecificationMatrixRows(products, "all").map((row) => row.code)).toEqual([
    "different",
    "missing",
    "same-number"
  ]);
  expect(buildSpecificationMatrixRows(products, "shared").map((row) => row.code)).toEqual([
    "different",
    "same-number"
  ]);
  expect(buildSpecificationMatrixRows(products, "differences").map((row) => row.code)).toEqual([
    "different",
    "missing"
  ]);

  const missingRow = buildSpecificationMatrixRows(products, "all").find(
    (row) => row.code === "missing"
  );

  expect(missingRow).toMatchObject({
    comparisonValues: ["text:Only first", "missing"],
    missingValues: [false, true],
    values: ["Only first", "Not available"]
  });
});

test("buildSpecificationMatrixRows compares typed booleans and units before display text", () => {
  const products = [
    matrixProduct("first", [
      {
        booleanValue: true,
        code: "hdr",
        displayName: "HDR",
        valueText: "Yes"
      },
      {
        code: "depth",
        displayName: "Depth",
        numericValue: "1.0",
        unitSymbol: "in",
        valueText: "1 in"
      }
    ]),
    matrixProduct("second", [
      {
        booleanValue: true,
        code: "hdr",
        displayName: "HDR",
        valueText: "true"
      },
      {
        code: "depth",
        displayName: "Depth",
        numericValue: "1",
        unitSymbol: "cm",
        valueText: "1 cm"
      }
    ])
  ];

  const rows = buildSpecificationMatrixRows(products, "all");

  expect(rows.find((row) => row.code === "hdr")?.comparisonValues).toEqual([
    "boolean:true",
    "boolean:true"
  ]);
  expect(buildSpecificationMatrixRows(products, "differences").map((row) => row.code)).toEqual([
    "depth"
  ]);
});

test("buildSpecificationMatrixRows normalizes decimal exponents within the expansion bound", () => {
  const products = [
    matrixProduct("first", [
      {
        code: "bounded",
        displayName: "Bounded",
        numericValue: "+001.2300e2",
        unitSymbol: "GB",
        valueText: "123 GB"
      },
      {
        code: "unbounded",
        displayName: "Unbounded",
        numericValue: "1e1001",
        unitSymbol: "GB",
        valueText: "Large A"
      }
    ]),
    matrixProduct("second", [
      {
        code: "bounded",
        displayName: "Bounded",
        numericValue: "123",
        unitSymbol: "GB",
        valueText: "123.0 GB"
      },
      {
        code: "unbounded",
        displayName: "Unbounded",
        numericValue: "10e1000",
        unitSymbol: "GB",
        valueText: "Large B"
      }
    ])
  ];
  const rows = buildSpecificationMatrixRows(products, "all");

  expect(rows.find((row) => row.code === "bounded")?.comparisonValues).toEqual([
    "numeric:123:GB",
    "numeric:123:GB"
  ]);
  expect(rows.find((row) => row.code === "unbounded")?.comparisonValues[0]).toBe(
    "numeric:1e1001:GB"
  );
  expect(buildSpecificationMatrixRows(products, "differences").map((row) => row.code)).toEqual([
    "unbounded"
  ]);
});

function matrixProduct(
  id: string,
  currentAttributes: SpecificationMatrixProduct["currentAttributes"]
): SpecificationMatrixProduct {
  return {
    id,
    name: `Product ${id}`,
    currentAttributes
  };
}
