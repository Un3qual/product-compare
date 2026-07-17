import { describe, expect, test, vi } from "vitest";
import { buildCompareSelectionTrayViewData } from "../../../src/routes/compare/compare-selection-tray-data";

describe("compare selection tray data", () => {
  test("returns exact zero-selection copy and stable empty rows", () => {
    const removePathForIndex = vi.fn((index: number) => `/remove/${index}`);

    const first = buildCompareSelectionTrayViewData({
      items: [],
      maxProducts: 3,
      removePathForIndex,
      selectedSlugs: []
    });
    const second = buildCompareSelectionTrayViewData({
      items: [],
      maxProducts: 3,
      removePathForIndex,
      selectedSlugs: []
    });

    expect(first.selectionCountCopy).toBe("0 of 3 products selected.");
    expect(first.showOpenAction).toBe(false);
    expect(first.rows).toEqual([]);
    expect(first.rows).toBe(second.rows);
    expect(removePathForIndex).not.toHaveBeenCalled();
  });

  test("preserves selected order with exact-slug labels and slug fallbacks", () => {
    const items = [
      { label: "Uppercase product", slug: "EXACT" },
      { label: "Lowercase product", slug: "exact" },
      { label: "Unselected product", slug: "other" }
    ] as const;

    const data = buildCompareSelectionTrayViewData({
      items,
      maxProducts: 3,
      removePathForIndex: (index) => `/compare/remove/${index}`,
      selectedSlugs: ["exact", "missing", "EXACT"]
    });

    expect(data).toEqual({
      rows: [
        { label: "Lowercase product", removePath: "/compare/remove/0", slug: "exact" },
        { label: "missing", removePath: "/compare/remove/1", slug: "missing" },
        { label: "Uppercase product", removePath: "/compare/remove/2", slug: "EXACT" }
      ],
      selectionCountCopy: "3 of 3 products selected.",
      showOpenAction: true
    });
  });

  test("projects bounded selection copy and caller-owned removal paths", () => {
    const removePathForIndex = vi.fn((index: number) => `/browse?remove=${index}`);

    const data = buildCompareSelectionTrayViewData({
      items: [{ label: "First product", slug: "first" }],
      maxProducts: 3,
      removePathForIndex,
      selectedSlugs: ["first", "second"]
    });

    expect(data.selectionCountCopy).toBe("2 of 3 products selected.");
    expect(data.showOpenAction).toBe(true);
    expect(data.rows.map(({ removePath }) => removePath)).toEqual([
      "/browse?remove=0",
      "/browse?remove=1"
    ]);
    expect(removePathForIndex.mock.calls).toEqual([[0], [1]]);
  });

  test("does not mutate deeply frozen selected slugs or loaded items", () => {
    const firstItem = Object.freeze({ label: "First product", slug: "first" });
    const items = Object.freeze([firstItem]);
    const selectedSlugs = Object.freeze(["first", "missing"]);

    buildCompareSelectionTrayViewData({
      items,
      maxProducts: 3,
      removePathForIndex: (index) => `/remove/${index}`,
      selectedSlugs
    });

    expect(items).toEqual([firstItem]);
    expect(selectedSlugs).toEqual(["first", "missing"]);
  });
});
