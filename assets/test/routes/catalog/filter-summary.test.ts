import {
  catalogFiltersWithout,
  catalogFilterSummaryItems,
  type CatalogFilterRemoval
} from "../../../src/routes/catalog/filter-summary";
import type {
  CatalogFilterMetadata,
  CatalogFilters
} from "../../../src/routes/catalog/filters";

const filters: CatalogFilters = {
  query: "monitor",
  sort: "NEWEST",
  typeTaxonId: "type-1",
  includeTypeDescendants: true,
  useCaseTaxonIds: ["use-1", "use-2"],
  numeric: [{ attributeId: "refresh", min: "120" }],
  booleans: [{ attributeId: "hdr", value: true }],
  enums: [{ attributeId: "panel", enumOptionId: "oled" }]
};

const metadata: CatalogFilterMetadata = {
  typeOptions: [{ id: "type-1", label: "Monitors", selected: true }],
  useCaseOptions: [
    { id: "use-1", label: "Gaming", selected: true },
    { id: "use-2", label: "Work", selected: true }
  ],
  numericFilters: [
    {
      attributeId: "refresh",
      displayName: "Refresh rate",
      selectedMin: "120",
      selectedMax: null,
      unitSymbol: "Hz"
    }
  ],
  booleanFilters: [
    { attributeId: "hdr", displayName: "HDR", selectedValue: true }
  ],
  enumFilters: [
    {
      attributeId: "panel",
      displayName: "Panel",
      options: [{ id: "oled", label: "OLED", selected: true }]
    }
  ]
};

test("builds labels with typed removal intent", () => {
  expect(catalogFilterSummaryItems(metadata, filters)).toEqual(
    expect.arrayContaining([
      { key: "query", label: 'Search: "monitor"', removal: { kind: "query" } },
      { key: "sort", label: "Sort: Newest", removal: { kind: "sort" } },
      {
        key: "type",
        label: "Type: Monitors and descendants",
        removal: { kind: "type" }
      },
      {
        key: "use-case:use-1",
        label: "Use case: Gaming",
        removal: { kind: "useCase", taxonId: "use-1" }
      },
      {
        key: "numeric:refresh",
        label: "Refresh rate: at least 120 Hz",
        removal: { kind: "numeric", attributeId: "refresh" }
      }
    ])
  );
});

test("omits relevance from active filter summaries", () => {
  expect(
    catalogFilterSummaryItems(metadata, {
      ...filters,
      query: "monitor",
      sort: "RELEVANCE"
    }).map((item) => item.key)
  ).not.toContain("sort");
});

test("removing a query also removes its relevance default", () => {
  expect(
    catalogFiltersWithout(
      { ...filters, query: "monitor", sort: "RELEVANCE" },
      { kind: "query" }
    )
  ).toMatchObject({ query: undefined, sort: undefined });
});

test.each<[CatalogFilterRemoval, Partial<CatalogFilters>]>([
  [{ kind: "query" }, { query: undefined }],
  [{ kind: "sort" }, { sort: undefined }],
  [{ kind: "type" }, { typeTaxonId: undefined, includeTypeDescendants: undefined }],
  [{ kind: "useCase", taxonId: "use-1" }, { useCaseTaxonIds: ["use-2"] }],
  [{ kind: "numeric", attributeId: "refresh" }, { numeric: [] }],
  [{ kind: "boolean", attributeId: "hdr" }, { booleans: [] }],
  [{ kind: "enum", attributeId: "panel" }, { enums: [] }]
])("applies removal intent %#", (removal, expected) => {
  expect(catalogFiltersWithout(filters, removal)).toMatchObject(expected);
});

test("rejects an unsupported removal intent", () => {
  const unsupportedRemoval = {
    kind: "unsupported"
  } as unknown as CatalogFilterRemoval;

  expect(() => catalogFiltersWithout(filters, unsupportedRemoval)).toThrow(
    "Unsupported catalog filter removal"
  );
});
