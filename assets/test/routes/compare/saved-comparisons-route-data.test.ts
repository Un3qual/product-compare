import { describe, expect, test } from "vitest";
import {
  buildSavedComparisonReopenPath,
  buildSavedComparisonsPagination,
} from "../../../src/routes/compare/saved-comparisons-route-data";

describe("buildSavedComparisonReopenPath", () => {
  test("builds a comparison path for an empty product selection", () => {
    expect(buildSavedComparisonReopenPath([])).toBe("/compare?");
  });

  test("preserves saved product order in repeated slug parameters", () => {
    expect(buildSavedComparisonReopenPath(["chair", "desk", "lamp"])).toBe(
      "/compare?slug=chair&slug=desk&slug=lamp",
    );
  });

  test("encodes reserved product slugs with URLSearchParams semantics", () => {
    expect(buildSavedComparisonReopenPath(["desk lamp", "chair/plus+?&"])).toBe(
      "/compare?slug=desk+lamp&slug=chair%2Fplus%2B%3F%26",
    );
  });
});

describe("buildSavedComparisonsPagination", () => {
  test("hides pagination paths for unauthorized saved comparisons", () => {
    expect(
      buildSavedComparisonsPagination({
        after: "cursor-current",
        endCursor: "cursor-next",
        hasNextPage: true,
        status: "unauthorized",
      }),
    ).toEqual({ firstHref: null, nextHref: null });
  });

  test("does not show a first-page return path on the first page", () => {
    expect(
      buildSavedComparisonsPagination({
        after: null,
        endCursor: "cursor-next",
        hasNextPage: true,
        status: "ready",
      }),
    ).toEqual({ firstHref: null, nextHref: "/compare/saved?after=cursor-next" });
  });

  test("shows a first-page return path after a cursor", () => {
    expect(
      buildSavedComparisonsPagination({
        after: "cursor-current",
        endCursor: null,
        hasNextPage: false,
        status: "empty",
      }),
    ).toEqual({ firstHref: "/compare/saved", nextHref: null });
  });

  test.each([null, ""])(
    "hides the next-page path when its cursor is absent or empty (%j)",
    (endCursor) => {
      expect(
        buildSavedComparisonsPagination({
          after: null,
          endCursor,
          hasNextPage: true,
          status: "ready",
        }),
      ).toEqual({ firstHref: null, nextHref: null });
    },
  );

  test("hides the next-page path when its cursor does not advance", () => {
    expect(
      buildSavedComparisonsPagination({
        after: "cursor-current",
        endCursor: "cursor-current",
        hasNextPage: true,
        status: "ready",
      }),
    ).toEqual({ firstHref: "/compare/saved", nextHref: null });
  });

  test("hides the next-page path when no next page exists", () => {
    expect(
      buildSavedComparisonsPagination({
        after: "cursor-current",
        endCursor: "cursor-next",
        hasNextPage: false,
        status: "ready",
      }),
    ).toEqual({ firstHref: "/compare/saved", nextHref: null });
  });

  test("encodes an advancing next-page cursor", () => {
    expect(
      buildSavedComparisonsPagination({
        after: "cursor-current",
        endCursor: "next page/+?&",
        hasNextPage: true,
        status: "ready",
      }),
    ).toEqual({
      firstHref: "/compare/saved",
      nextHref: "/compare/saved?after=next+page%2F%2B%3F%26",
    });
  });
});
