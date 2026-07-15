import type { CatalogFilters } from "../../../src/routes/catalog/filters";
import {
  catalogFilterFormInitialTypeState,
  catalogFilterFormTypeSelection,
  hasInitiallyOpenCatalogAdvancedFilters
} from "../../../src/routes/catalog/catalog-filter-form-state";

function filters(overrides: Partial<CatalogFilters> = {}): CatalogFilters {
  return {
    useCaseTaxonIds: [],
    numeric: [],
    booleans: [],
    enums: [],
    ...overrides
  };
}

describe("catalogFilterFormInitialTypeState", () => {
  test.each([
    ["an absent type", filters(), { selectedTypeTaxonId: "", includeTypeDescendants: false }],
    [
      "an explicit empty type",
      filters({ typeTaxonId: "", includeTypeDescendants: true }),
      { selectedTypeTaxonId: "", includeTypeDescendants: false }
    ],
    [
      "a selected type",
      filters({ typeTaxonId: "type-laptops", includeTypeDescendants: true }),
      { selectedTypeTaxonId: "type-laptops", includeTypeDescendants: true }
    ]
  ])("uses $s", (_description, input, expected) => {
    expect(catalogFilterFormInitialTypeState(input)).toEqual(expected);
  });

  test.each([
    ["selected type with descendants enabled", "type-laptops", true, true],
    ["selected type with descendants disabled", "type-laptops", false, false],
    ["empty type with descendants enabled", "", true, false],
    ["empty type with descendants disabled", "", false, false]
  ])("initializes descendants for $s", (_description, typeTaxonId, input, expected) => {
    expect(
      catalogFilterFormInitialTypeState(filters({ typeTaxonId, includeTypeDescendants: input }))
    ).toHaveProperty("includeTypeDescendants", expected);
  });
});

describe("catalogFilterFormTypeSelection", () => {
  test("enables descendants for the first type selection", () => {
    expect(
      catalogFilterFormTypeSelection(
        { selectedTypeTaxonId: "", includeTypeDescendants: false },
        "type-laptops"
      )
    ).toEqual({ selectedTypeTaxonId: "type-laptops", includeTypeDescendants: true });
  });

  test.each([true, false])("disables descendants when clearing a selected type with %s", (value) => {
    expect(
      catalogFilterFormTypeSelection(
        { selectedTypeTaxonId: "type-laptops", includeTypeDescendants: value },
        ""
      )
    ).toEqual({ selectedTypeTaxonId: "", includeTypeDescendants: false });
  });

  test.each([true, false])(
    "preserves descendants set to %s when changing selected types",
    (value) => {
      expect(
        catalogFilterFormTypeSelection(
          { selectedTypeTaxonId: "type-laptops", includeTypeDescendants: value },
          "type-monitors"
        )
      ).toEqual({ selectedTypeTaxonId: "type-monitors", includeTypeDescendants: value });
    }
  );

  test.each([true, false])(
    "preserves descendants set to %s when selecting the current type again",
    (value) => {
      expect(
        catalogFilterFormTypeSelection(
          { selectedTypeTaxonId: "type-laptops", includeTypeDescendants: value },
          "type-laptops"
        )
      ).toEqual({ selectedTypeTaxonId: "type-laptops", includeTypeDescendants: value });
    }
  );

  test("does not mutate its previous state and returns a new result", () => {
    const previous = { selectedTypeTaxonId: "type-laptops", includeTypeDescendants: false };
    const previousSnapshot = { ...previous };

    const result = catalogFilterFormTypeSelection(previous, "type-monitors");

    expect(result).not.toBe(previous);
    expect(previous).toEqual(previousSnapshot);
  });
});

describe("hasInitiallyOpenCatalogAdvancedFilters", () => {
  test.each([
    ["use-case filters", filters({ useCaseTaxonIds: ["use-gaming"] })],
    ["numeric filters", filters({ numeric: [{ attributeId: "price", min: "10" }] })],
    ["boolean filters", filters({ booleans: [{ attributeId: "wireless", value: true }] })],
    ["enum filters", filters({ enums: [{ attributeId: "color", enumOptionId: "red" }] })]
  ])("opens for $s", (_description, input) => {
    expect(hasInitiallyOpenCatalogAdvancedFilters(input)).toBe(true);
  });

  test("stays closed when every advanced collection is empty", () => {
    expect(hasInitiallyOpenCatalogAdvancedFilters(filters())).toBe(false);
  });

  test("stays closed for non-advanced filters alone", () => {
    expect(
      hasInitiallyOpenCatalogAdvancedFilters(
        filters({
          query: "oled",
          sort: "NEWEST",
          typeTaxonId: "type-laptops",
          includeTypeDescendants: true
        })
      )
    ).toBe(false);
  });

  test("does not mutate filters while deriving initial state", () => {
    const input = filters({
      typeTaxonId: "type-laptops",
      includeTypeDescendants: true,
      useCaseTaxonIds: ["use-gaming"],
      numeric: [{ attributeId: "price", min: "10" }],
      booleans: [{ attributeId: "wireless", value: true }],
      enums: [{ attributeId: "color", enumOptionId: "red" }]
    });
    const snapshot = structuredClone(input);

    catalogFilterFormInitialTypeState(input);
    hasInitiallyOpenCatalogAdvancedFilters(input);

    expect(input).toEqual(snapshot);
  });
});
