import { readFileSync } from "node:fs";

const dataTables = [
  "src/routes/commerce/revenue/AttributionLedger.tsx",
  "src/routes/compare/CompareSpecificationMatrix.tsx",
  "src/routes/compare/DecisionSummary.tsx",
] as const;

test.each(dataTables)("%s delegates its row and column model to TanStack Table", (path) => {
  const source = readFileSync(path, "utf8");

  expect(source).toContain('from "@tanstack/react-table"');
  expect(source).toContain("tableFeatures(");
  expect(source).toContain("useTable(");
  expect(source).toContain("<table.FlexRender");
});
