import { describe, expect, test } from "vitest";
import {
  buildRecommendationProfilePath,
  recommendationProfileFromUrl,
  shouldRevalidateCompareLoader
} from "../../../src/routes/compare/recommendation-route-data";

describe("recommendationProfileFromUrl", () => {
  test.each([
    ["/compare", "lowest_current_cost"],
    ["/compare?recommend=", "lowest_current_cost"],
    ["/compare?recommend=BEST_VALUE", "lowest_current_cost"],
    ["/compare?recommend=best-value", "lowest_current_cost"],
    ["/compare?recommend=unknown", "lowest_current_cost"],
    ["/compare?recommend=other&recommend=best_value", "lowest_current_cost"],
    ["/compare?recommend=best_value&recommend=other", "best_value"],
    ["/compare?recommend=best_value", "best_value"],
    ["https://example.test/compare?recommend=best_value", "best_value"]
  ] as const)("parses %s as %s", (url, profile) => {
    expect(recommendationProfileFromUrl(url)).toBe(profile);
  });
});

describe("buildRecommendationProfilePath", () => {
  test.each([
    [[], "shared", "lowest_current_cost", "/compare?"],
    [["chair", "desk", "lamp"], "shared", "lowest_current_cost", "/compare?slug=chair&slug=desk&slug=lamp"],
    [["desk lamp", "chair/plus+?&"], "all", "lowest_current_cost", "/compare?slug=desk+lamp&slug=chair%2Fplus%2B%3F%26&specs=all"],
    [["first", "second"], "differences", "best_value", "/compare?slug=first&slug=second&specs=differences&recommend=best_value"],
    [["first", "second"], "shared", "best_value", "/compare?slug=first&slug=second&recommend=best_value"]
  ] as const)("builds %s with %s specs and %s profile", (slugs, specMode, profile, path) => {
    expect(buildRecommendationProfilePath(slugs, specMode, profile)).toBe(path);
  });
});

describe("shouldRevalidateCompareLoader", () => {
  test.each([
    ["https://example.test/compare?slug=one&slug=two", "https://example.test/compare?slug=one&slug=two&recommend=best_value"],
    ["https://example.test/compare?slug=one&slug=two&recommend=best_value", "https://example.test/compare?slug=one&slug=two"],
    ["https://example.test/compare?slug=one&slug=two&recommend=unknown", "https://example.test/compare?slug=one&slug=two&recommend=best_value"]
  ])("suppresses core revalidation when only the raw profile changes", (currentUrl, nextUrl) => {
    expect(
      shouldRevalidateCompareLoader({
        currentUrl: new URL(currentUrl),
        nextUrl: new URL(nextUrl),
        defaultShouldRevalidate: true
      })
    ).toBe(false);
  });

  test.each([
    ["https://example.test/compare?slug=one&slug=two", "https://example.test/compare?slug=one&slug=two#recommendation"],
    ["https://example.test/compare?slug=one&slug=two", "https://example.test/compare?slug=one&slug=two"],
    ["https://example.test/compare?slug=one&slug=two", "https://example.test/catalog?slug=one&slug=two&recommend=best_value"],
    ["https://example.test/compare?slug=one&slug=two", "https://example.test/compare?slug=one&slug=three&recommend=best_value"],
    ["https://example.test/compare?slug=one&slug=two&specs=all", "https://example.test/compare?slug=one&slug=two&specs=differences&recommend=best_value"],
    ["https://example.test/compare?slug=one&sort=price", "https://example.test/compare?slug=one&sort=name&recommend=best_value"]
  ])("defers to the router default for unrelated route changes", (currentUrl, nextUrl) => {
    expect(
      shouldRevalidateCompareLoader({
        currentUrl: new URL(currentUrl),
        nextUrl: new URL(nextUrl),
        defaultShouldRevalidate: false
      })
    ).toBe(false);
  });
});
