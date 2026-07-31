import { describe, expect, test, vi } from "vitest";
import {
  buildSavedComparisonsViewState,
  savedComparisonSortModeFromValue,
  type SavedComparisonSortMode,
} from "../../../src/routes/compare/saved-view-state";
import type {
  SavedComparisonSetSummary,
  SavedComparisonsRouteLoaderData,
} from "../../../src/routes/compare/saved-data";

const savedSets: SavedComparisonSetSummary[] = [
  {
    id: "saved-set-1",
    name: "Desk setup",
    products: [{ name: "Ergonomic Chair", slug: "chair" }],
  },
  {
    id: "saved-set-2",
    name: "Alpha kit",
    products: [
      { name: "Standing Desk", slug: "standing-desk" },
      { name: "Keyboard", slug: "keyboard" },
    ],
  },
  {
    id: "saved-set-3",
    name: "Office suite",
    products: [
      { name: "Monitor", slug: "monitor" },
      { name: "Mouse", slug: "mouse" },
      { name: "Lamp", slug: "reading-lamp" },
    ],
  },
];

function readyLoaderData(
  sets: SavedComparisonSetSummary[] = savedSets,
): SavedComparisonsRouteLoaderData {
  return {
    status: sets.length === 0 ? "empty" : "ready",
    savedSetQueries: [],
    savedSets: sets,
  };
}

function savedSetIds(viewState: ReturnType<typeof buildSavedComparisonsViewState>) {
  return viewState.savedSets.map(({ id }) => id);
}

test("returns the sign-in status before local deletion or filter state", () => {
  const viewState = buildSavedComparisonsViewState(
    { status: "unauthorized", savedSetQueries: [], savedSets: [] },
    new Set(["saved-set-1"]),
    "desk",
    "name-asc",
  );

  expect(savedSetIds(viewState)).toEqual([]);
  expect(viewState.statusMessage).toBe("Sign in to view saved comparisons.");
});

test("hides locally deleted sets and announces the deletion before an empty state", () => {
  const viewState = buildSavedComparisonsViewState(
    readyLoaderData([savedSets[0]]),
    new Set(["saved-set-1"]),
    "",
    "current",
  );

  expect(savedSetIds(viewState)).toEqual([]);
  expect(viewState.statusMessage).toBe("Comparison deleted.");
});

test("announces a local deletion before an active filter's no-match state", () => {
  const viewState = buildSavedComparisonsViewState(
    readyLoaderData([savedSets[0]]),
    new Set(["saved-set-1"]),
    "sofa",
    "current",
  );

  expect(savedSetIds(viewState)).toEqual([]);
  expect(viewState.statusMessage).toBe("Comparison deleted.");
});

test("reports a no-match status for a filter against loaded saved sets", () => {
  const viewState = buildSavedComparisonsViewState(readyLoaderData(), new Set(), "sofa", "current");

  expect(savedSetIds(viewState)).toEqual([]);
  expect(viewState.statusMessage).toBe("No saved comparisons match your filter.");
});

test("reports the empty status when no saved sets are loaded", () => {
  const viewState = buildSavedComparisonsViewState(readyLoaderData([]), new Set(), "", "current");

  expect(savedSetIds(viewState)).toEqual([]);
  expect(viewState.statusMessage).toBe("No saved comparisons yet.");
});

describe("saved comparison card display data", () => {
  test("projects singular, plural, zero, ordered, and duplicate product display copy without mutating products", () => {
    const products = Object.freeze([
      Object.freeze({ name: "Desk Chair", slug: "chair" }),
      Object.freeze({ name: "Standing Desk", slug: "desk" }),
      Object.freeze({ name: "Desk Chair", slug: "chair-duplicate" }),
    ]);
    const input = [
      { id: "single", name: "Single", products: [products[0]] },
      { id: "many", name: "Many", products },
      { id: "empty", name: "Empty", products: [] },
    ];

    const viewState = buildSavedComparisonsViewState(
      readyLoaderData(input),
      new Set(),
      "",
      "current",
    );

    expect(
      viewState.savedSets.map(({ productCountText, productNamesText }) => ({
        productCountText,
        productNamesText,
      })),
    ).toEqual([
      {
        productCountText: "1 product in this saved comparison",
        productNamesText: "Desk Chair",
      },
      {
        productCountText: "3 products in this saved comparison",
        productNamesText: "Desk Chair, Standing Desk, Desk Chair",
      },
      {
        productCountText: "0 products in this saved comparison",
        productNamesText: "",
      },
    ]);
    expect(products).toEqual([
      { name: "Desk Chair", slug: "chair" },
      { name: "Standing Desk", slug: "desk" },
      { name: "Desk Chair", slug: "chair-duplicate" },
    ]);
  });
});

describe("filtering", () => {
  test.each([
    ["saved-set name", "SETUP", ["saved-set-1"]],
    ["product name", "standing", ["saved-set-2"]],
    ["product slug", "READING-LAMP", ["saved-set-3"]],
  ])("matches a saved set by case-insensitive %s", (_source, filterText, expectedIds) => {
    const viewState = buildSavedComparisonsViewState(
      readyLoaderData(),
      new Set(),
      filterText,
      "current",
    );

    expect(savedSetIds(viewState)).toEqual(expectedIds);
    expect(viewState.statusMessage).toBe("");
  });
});

describe("sorting", () => {
  test.each<readonly [string, SavedComparisonSortMode]>([
    ["current", "current"],
    ["name-asc", "name-asc"],
    ["product-count-desc", "product-count-desc"],
    ["product-count-asc", "product-count-asc"],
    ["", "current"],
    ["unknown", "current"],
    ["future-sort-mode", "current"],
  ])("normalizes raw sort value %j to %s", (value, expected) => {
    expect(savedComparisonSortModeFromValue(value)).toBe(expected);
  });

  test.each<readonly [SavedComparisonSortMode, string[]]>([
    ["current", ["saved-set-1", "saved-set-2", "saved-set-3"]],
    ["name-asc", ["saved-set-2", "saved-set-1", "saved-set-3"]],
    ["product-count-desc", ["saved-set-3", "saved-set-2", "saved-set-1"]],
    ["product-count-asc", ["saved-set-1", "saved-set-2", "saved-set-3"]],
  ])("orders visible saved sets with %s", (sortMode, expectedIds) => {
    const viewState = buildSavedComparisonsViewState(readyLoaderData(), new Set(), "", sortMode);

    expect(savedSetIds(viewState)).toEqual(expectedIds);
  });

  test("preserves source order for name ties", () => {
    const viewState = buildSavedComparisonsViewState(
      readyLoaderData([
        { id: "saved-set-1", name: "alpha kit", products: [] },
        { id: "saved-set-2", name: "Alpha kit", products: [] },
        { id: "saved-set-3", name: "Bravo kit", products: [] },
      ]),
      new Set(),
      "",
      "name-asc",
    );

    expect(savedSetIds(viewState)).toEqual(["saved-set-1", "saved-set-2", "saved-set-3"]);
  });

  test("orders names without depending on the host locale", () => {
    const localeCompare = vi.spyOn(String.prototype, "localeCompare").mockImplementation(() => {
      throw new Error("ambient locale comparison used");
    });

    try {
      const viewState = buildSavedComparisonsViewState(
        readyLoaderData([
          { id: "saved-set-1", name: "Zulu", products: [] },
          { id: "saved-set-2", name: "Älpha", products: [] },
        ]),
        new Set(),
        "",
        "name-asc",
      );

      expect(savedSetIds(viewState)).toEqual(["saved-set-2", "saved-set-1"]);
    } finally {
      localeCompare.mockRestore();
    }
  });

  test("orders non-decomposing Latin letters alphabetically", () => {
    const viewState = buildSavedComparisonsViewState(
      readyLoaderData([
        { id: "saved-set-1", name: "Zulu", products: [] },
        { id: "saved-set-2", name: "Ømega", products: [] },
        { id: "saved-set-3", name: "Æther", products: [] },
      ]),
      new Set(),
      "",
      "name-asc",
    );

    expect(savedSetIds(viewState)).toEqual(["saved-set-3", "saved-set-2", "saved-set-1"]);
  });

  test.each([
    ["product-count-desc", ["saved-set-1", "saved-set-2", "saved-set-3"]],
    ["product-count-asc", ["saved-set-3", "saved-set-1", "saved-set-2"]],
  ] as const)("preserves source order for tied %s results", (sortMode, expectedIds) => {
    const viewState = buildSavedComparisonsViewState(
      readyLoaderData([
        { id: "saved-set-1", name: "First", products: savedSets[0].products },
        { id: "saved-set-2", name: "Second", products: savedSets[0].products },
        { id: "saved-set-3", name: "Third", products: [] },
      ]),
      new Set(),
      "",
      sortMode,
    );

    expect(savedSetIds(viewState)).toEqual(expectedIds);
  });
});
