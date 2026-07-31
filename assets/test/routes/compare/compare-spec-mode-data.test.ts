import { describe, expect, test } from "vitest";
import { buildCompareSpecModeNavigationData } from "../../../src/routes/compare/compare-spec-mode-data";

describe("compare specification-mode navigation data", () => {
  test("projects stable ordered labels, canonical destinations, and one current mode", () => {
    const data = buildCompareSpecModeNavigationData({
      selectedSlugs: ["first-product", "second-product"],
      specMode: "differences",
    });

    expect(data.modes).toEqual([
      {
        isCurrent: false,
        label: "Shared specs",
        mode: "shared",
        path: "/compare?slug=first-product&slug=second-product",
      },
      {
        isCurrent: true,
        label: "Differences",
        mode: "differences",
        path: "/compare?slug=first-product&slug=second-product&specs=differences",
      },
      {
        isCurrent: false,
        label: "All specs",
        mode: "all",
        path: "/compare?slug=first-product&slug=second-product&specs=all",
      },
    ]);
    expect(data.modes.filter((mode) => mode.isCurrent)).toHaveLength(1);
  });

  test("preserves selected-slug order without mutating caller input", () => {
    const selectedSlugs = Object.freeze(["second product", "first-product"]);

    const data = buildCompareSpecModeNavigationData({
      selectedSlugs,
      specMode: "shared",
    });

    expect(data.modes.map((mode) => mode.path)).toEqual([
      "/compare?slug=second+product&slug=first-product",
      "/compare?slug=second+product&slug=first-product&specs=differences",
      "/compare?slug=second+product&slug=first-product&specs=all",
    ]);
    expect(selectedSlugs).toEqual(["second product", "first-product"]);
  });
});
