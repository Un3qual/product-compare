import {
  catalogAdvancedFilterViewData,
  type CatalogAdvancedFilterMetadata,
  type CatalogAdvancedFilterSelections
} from "../../../src/routes/catalog/catalog-advanced-filter-data";

const emptySelections: CatalogAdvancedFilterSelections = {
  useCaseTaxonIds: [],
  numeric: [],
  booleans: [],
  enums: []
};

function metadataFixture(): CatalogAdvancedFilterMetadata {
  return {
    useCaseOptions: [
      { id: "use-gaming", label: "Gaming", count: 4, selected: false, disabled: true },
      { id: "use-office", label: "Office", count: 3, selected: true, disabled: false }
    ],
    numericFilters: [
      {
        attributeId: "attr-refresh",
        displayName: "Refresh Rate",
        selectedMin: "120",
        selectedMax: "240"
      }
    ],
    booleanFilters: [
      {
        attributeId: "attr-wireless",
        displayName: "Wireless",
        trueCount: 5,
        falseCount: 2,
        selectedValue: true
      }
    ],
    enumFilters: [
      {
        attributeId: "attr-color",
        displayName: "Color",
        options: [
          { id: "enum-red", label: "Red", count: 2, selected: true, disabled: true },
          { id: "enum-blue", label: "Blue", count: 1, selected: false, disabled: false }
        ]
      }
    ]
  };
}

test("prefers URL selections, including empty strings and false, over metadata selections", () => {
  const data = catalogAdvancedFilterViewData(
    {
      useCaseTaxonIds: ["use-gaming"],
      numeric: [{ attributeId: "attr-refresh", min: "", max: "" }],
      booleans: [{ attributeId: "attr-wireless", value: false }],
      enums: [{ attributeId: "attr-color", enumOptionId: "enum-blue" }]
    },
    metadataFixture()
  );

  expect(data.useCaseRows[0]).toMatchObject({ selected: true, disabled: false });
  expect(data.useCaseRows[1]).toMatchObject({ selected: true, disabled: false });
  expect(data.numericRows[0]).toMatchObject({
    minValue: "",
    maxValue: ""
  });
  expect(data.booleanRows[0]).toMatchObject({ defaultValue: "false" });
  expect(data.enumRows[0].options).toMatchObject([
    { id: "enum-red", selected: false, disabled: true },
    { id: "enum-blue", selected: true, disabled: false }
  ]);
});

test("uses metadata selections when URL state does not select a field", () => {
  const data = catalogAdvancedFilterViewData(emptySelections, metadataFixture());

  expect(data.useCaseRows.map((row) => row.selected)).toEqual([false, true]);
  expect(data.numericRows[0].minValue).toBe("120");
  expect(data.numericRows[0].maxValue).toBe("240");
  expect(data.booleanRows[0].defaultValue).toBe("true");
  expect(data.enumRows[0].options.map((option) => option.selected)).toEqual([true, false]);
  expect(data.enumRows[0].anySelected).toBe(false);
});

test("uses the last repeated enum selection for an attribute", () => {
  const data = catalogAdvancedFilterViewData(
    {
      ...emptySelections,
      enums: [
        { attributeId: "attr-color", enumOptionId: "enum-red" },
        { attributeId: "attr-color", enumOptionId: "enum-blue" }
      ]
    },
    metadataFixture()
  );

  expect(data.enumRows[0].options.map((option) => option.selected)).toEqual([false, true]);
});

test("preserves metadata identities in source order and omits empty groups", () => {
  const metadata = metadataFixture();
  const data = catalogAdvancedFilterViewData(emptySelections, {
    ...metadata,
    useCaseOptions: [metadata.useCaseOptions[1], metadata.useCaseOptions[0]]
  });

  expect(data.useCaseRows.map((row) => row.id)).toEqual(["use-office", "use-gaming"]);
  expect(data.numericRows.map((row) => row.attributeId)).toEqual(["attr-refresh"]);
  expect(data.booleanRows.map((row) => row.attributeId)).toEqual(["attr-wireless"]);
  expect(data.enumRows.map((row) => row.attributeId)).toEqual(["attr-color"]);
  expect(data.enumRows[0].options.map((option) => option.id)).toEqual([
    "enum-red",
    "enum-blue"
  ]);

  const emptyGroups = catalogAdvancedFilterViewData(emptySelections, {
    ...metadata,
    useCaseOptions: [],
    numericFilters: [],
    booleanFilters: [],
    enumFilters: []
  });

  expect(emptyGroups.useCaseRows).toEqual([]);
  expect(emptyGroups.numericRows).toEqual([]);
  expect(emptyGroups.booleanRows).toEqual([]);
  expect(emptyGroups.enumRows).toEqual([]);
});

test("does not mutate selection or metadata inputs", () => {
  const selections = Object.freeze({
    useCaseTaxonIds: Object.freeze(["use-gaming"]),
    numeric: Object.freeze([{ attributeId: "attr-refresh", min: "144" }]),
    booleans: Object.freeze([{ attributeId: "attr-wireless", value: false }]),
    enums: Object.freeze([{ attributeId: "attr-color", enumOptionId: "enum-blue" }])
  });
  const metadata = metadataFixture();
  const before = structuredClone({ selections, metadata });

  catalogAdvancedFilterViewData(selections, metadata);

  expect({ selections, metadata }).toEqual(before);
});
