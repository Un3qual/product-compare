import { describe, expect, test } from "vitest";
import {
  appendUniqueComparePickerProducts,
  availableComparePickerProducts,
  buildComparePickerOptions,
  comparePickerEmptyMessage,
  comparePickerResetToken,
  isComparePickerEmpty,
  nextComparePickerPageCursor,
} from "../../../src/routes/compare/picker/compare-picker";

const PRODUCTS = [
  {
    id: "product-1",
    name: "First product",
    slug: "first-product",
    brand: { id: "brand-acme", name: "Acme" },
  },
  { id: "product-2", name: "Second product", slug: "second-product", brand: null },
  {
    id: "product-3",
    name: "Third product",
    slug: "third-product",
    brand: { id: "brand-bravo", name: "Bravo" },
  },
] as const;

describe("compare picker data", () => {
  test("derives reset identity from the selected products and specification mode", () => {
    expect(comparePickerResetToken("all", ["first-product", "second-product"])).toBe(
      "all:first-product|second-product",
    );
  });

  test("accumulates product pages in first-seen order without duplicate ids", () => {
    expect(
      appendUniqueComparePickerProducts(
        [PRODUCTS[0]],
        [PRODUCTS[1], PRODUCTS[1], PRODUCTS[2], PRODUCTS[0]],
      ),
    ).toEqual([PRODUCTS[0], PRODUCTS[1], PRODUCTS[2]]);
  });

  test("excludes selected product slugs from available picker products", () => {
    expect(availableComparePickerProducts(PRODUCTS, ["second-product"])).toEqual([
      PRODUCTS[0],
      PRODUCTS[2],
    ]);
  });

  test("builds options with an unknown-brand fallback", () => {
    expect(buildComparePickerOptions([PRODUCTS[1]], [], "shared")).toEqual([
      {
        brandName: "Unknown brand",
        href: "/compare?slug=second-product",
        id: "product-2",
        name: "Second product",
      },
    ]);
  });

  test("uses the cursor only when another product page exists", () => {
    expect(nextComparePickerPageCursor({ hasNextPage: true, endCursor: "cursor-2" })).toBe(
      "cursor-2",
    );
    expect(nextComparePickerPageCursor({ hasNextPage: false, endCursor: "cursor-2" })).toBeNull();
    expect(nextComparePickerPageCursor({ hasNextPage: true, endCursor: null })).toBeNull();
    expect(nextComparePickerPageCursor({ hasNextPage: true, endCursor: " " })).toBeNull();
    expect(
      nextComparePickerPageCursor({ hasNextPage: true, endCursor: "cursor-2" }, "cursor-2"),
    ).toBeNull();
  });

  test("uses the selected state to derive the empty picker copy", () => {
    expect(isComparePickerEmpty([], null)).toBe(true);
    expect(isComparePickerEmpty([], "cursor-2")).toBe(false);
    expect(comparePickerEmptyMessage([])).toBe("No products are available to compare yet.");
    expect(comparePickerEmptyMessage(["first-product"])).toBe(
      "No additional products are available to compare yet.",
    );
  });

  test("uses canonical maximum selection, encoded paths, and specification mode", () => {
    expect(
      buildComparePickerOptions(
        [
          {
            id: "product-4",
            name: "Fourth product",
            slug: "fourth & product",
            brand: { id: "brand-delta", name: "Delta" },
          },
        ],
        ["first product", "second-product", "third-product"],
        "all",
      ),
    ).toEqual([
      {
        brandName: "Delta",
        href: "/compare?slug=first+product&slug=second-product&slug=third-product&specs=all",
        id: "product-4",
        name: "Fourth product",
      },
    ]);

    expect(
      buildComparePickerOptions(
        [
          {
            id: "product-5",
            name: "Fifth product",
            slug: "fifth & product",
            brand: { id: "brand-echo", name: "Echo" },
          },
        ],
        ["first product"],
        "differences",
      ),
    ).toMatchObject([
      {
        href: "/compare?slug=first+product&slug=fifth+%26+product&specs=differences",
      },
    ]);
  });
});
