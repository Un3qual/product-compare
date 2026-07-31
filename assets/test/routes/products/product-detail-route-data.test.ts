import { describe, expect, test } from "vitest";
import {
  createProductDetailRouteData,
  overviewSummaryItems,
} from "../../../src/routes/products/product-detail-route-data";

describe("createProductDetailRouteData", () => {
  test.each([
    ["#overview", "", "overview"],
    ["#specifications", "", "specifications"],
    ["#offers", "", "offers"],
    ["#community", "", "community"],
    ["#unknown", "", "overview"],
    ["", "?offersAfter=next-page", "offers"],
  ])(
    "uses explicit tabs and falls back to offers for an offer cursor",
    (hash, search, detailView) => {
      expect(
        createProductDetailRouteData({
          hash,
          productSlug: "detail-product",
          search,
        }).detailView,
      ).toBe(detailView);
    },
  );

  test("builds overview counts", () => {
    expect(
      overviewSummaryItems({
        attributeCount: 8,
        hasMoreOffers: true,
        loadedOfferCount: 6,
      }),
    ).toEqual([
      { label: "Specifications available", value: 8 },
      { label: "Active offers loaded", value: "6+" },
    ]);
  });

  test("builds encoded product paths and preserves compare selections", () => {
    const routeData = createProductDetailRouteData({
      hash: "#specifications",
      productSlug: "reserved/product?variant=1",
      search: "?offersAfter=next-page&slug=first-product&slug=second+product",
    });

    expect(routeData.productPath).toBe("/products/reserved%2Fproduct%3Fvariant%3D1");
    expect(routeData.browsePath).toBe("/products?slug=first-product&slug=second+product");
    expect(routeData.selectedCompareSlugs).toEqual(["first-product", "second product"]);
  });

  test("adds an unselected product while preserving unrelated search state and hash", () => {
    const routeData = createProductDetailRouteData({
      hash: "#specifications",
      productSlug: "detail-product",
      search: "?offersAfter=cursor-next-page&q=oled&slug=second-product",
    });

    expect(routeData.compareAction).toEqual({
      href: "/products/detail-product?offersAfter=cursor-next-page&q=oled&slug=second-product&slug=detail-product#specifications",
      kind: "add",
    });
  });

  test("reports selected and full compare states", () => {
    const selectedRouteData = createProductDetailRouteData({
      hash: "",
      productSlug: "detail-product",
      search: "?slug=detail-product",
    });
    const fullRouteData = createProductDetailRouteData({
      hash: "",
      productSlug: "detail-product",
      search: "?slug=first-product&slug=second-product&slug=third-product",
    });

    expect(selectedRouteData.compareAction).toEqual({ kind: "selected" });
    expect(fullRouteData.compareAction).toEqual({ kind: "full" });
  });

  test("clamps selections to the canonical three-product maximum before deriving compare paths", () => {
    const routeData = createProductDetailRouteData({
      hash: "",
      productSlug: "detail-product",
      search:
        "?slug=first-product&slug=&slug=first-product&slug=second-product&slug=third-product&slug=fourth-product",
    });

    expect(routeData.selectedCompareSlugs).toEqual([
      "first-product",
      "second-product",
      "third-product",
    ]);
    expect(routeData.comparePath).toBe(
      "/compare?slug=first-product&slug=second-product&slug=third-product",
    );
    expect(routeData.compareAction).toEqual({ kind: "full" });
  });

  test("removes selected items by index while preserving order, unrelated search state, and hash", () => {
    const routeData = createProductDetailRouteData({
      hash: "#offers",
      productSlug: "detail-product",
      search:
        "?offersAfter=cursor-next-page&q=oled&slug=first-product&slug=second-product&slug=third-product",
    });

    expect(routeData.removeSelectedPathForIndex(1)).toBe(
      "/products/detail-product?offersAfter=cursor-next-page&q=oled&slug=first-product&slug=third-product#offers",
    );
  });
});
