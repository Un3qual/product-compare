import { describe, expect, test } from "vitest";
import { createBrowseRouteData } from "../../../src/routes/catalog/browse-route-data";
import { normalizedCompareSlugs } from "../../../src/routes/compare/paths";

describe("createBrowseRouteData", () => {
  test("normalizes the root browse pathname", () => {
    const routeData = createBrowseRouteData({
      pathname: "/",
      search: "",
      selectedCompareSlugs: []
    });

    expect(routeData.pathname).toBe("/products");
  });

  test("builds encoded product detail paths while preserving the selection", () => {
    const routeData = createBrowseRouteData({
      pathname: "/products",
      search: "?first=24",
      selectedCompareSlugs: ["first-product", "second product"]
    });

    expect(routeData.productDetailPathFor("reserved/product?variant=1")).toBe(
      "/products/reserved%2Fproduct%3Fvariant%3D1?slug=first-product&slug=second+product"
    );
  });

  test("adds an unselected product after the preserved compare selection", () => {
    const routeData = createBrowseRouteData({
      pathname: "/products",
      search: "?first=24&q=oled&slug=stale-product&slug=another-stale-product",
      selectedCompareSlugs: ["first-product", "second-product"]
    });

    expect(routeData.compareActionFor("third-product")).toEqual({
      href: "/products?first=24&q=oled&slug=first-product&slug=second-product&slug=third-product",
      kind: "add"
    });
  });

  test("reports selected and full compare states", () => {
    const selectedRouteData = createBrowseRouteData({
      pathname: "/products",
      search: "",
      selectedCompareSlugs: ["first-product"]
    });
    const fullRouteData = createBrowseRouteData({
      pathname: "/products",
      search: "",
      selectedCompareSlugs: ["first-product", "second-product", "third-product"]
    });

    expect(selectedRouteData.compareActionFor("first-product")).toEqual({ kind: "selected" });
    expect(fullRouteData.compareActionFor("fourth-product")).toEqual({ kind: "full" });
  });

  test("clamps selections to the canonical three-product maximum before deriving paths and actions", () => {
    const routeData = createBrowseRouteData({
      pathname: "/products",
      search: "",
      selectedCompareSlugs: [
        " first-product ",
        "",
        "first-product",
        "second-product",
        "third-product",
        "fourth-product"
      ]
    });

    expect(routeData.selectedCompareSlugs).toEqual([
      "first-product",
      "second-product",
      "third-product"
    ]);
    expect(routeData.productDetailPathFor("reserved/product")).toBe(
      "/products/reserved%2Fproduct?slug=first-product&slug=second-product&slug=third-product"
    );
    expect(routeData.compareActionFor("fourth-product")).toEqual({ kind: "full" });
  });

  test("removes the selected item at its index while preserving order and filters", () => {
    const routeData = createBrowseRouteData({
      pathname: "/products",
      search: "?first=24&q=oled&slug=stale-product",
      selectedCompareSlugs: ["first-product", "second-product", "third-product"]
    });

    expect(routeData.removeSelectedPathForIndex(1)).toBe(
      "/products?first=24&q=oled&slug=first-product&slug=third-product"
    );
  });

  test("shares whitespace, blank, duplicate, order, and maximum normalization", () => {
    expect(
      normalizedCompareSlugs(
        [" first-product ", "", "first-product", "second-product", " third-product ", "fourth-product"],
        { maxProducts: 3 }
      )
    ).toEqual(["first-product", "second-product", "third-product"]);
  });
});
