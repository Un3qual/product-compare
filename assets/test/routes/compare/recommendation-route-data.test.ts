import { describe, expect, test } from "vitest";
import {
  buildRecommendationQueryInput,
  buildRecommendationProfilePath,
  recommendationProfileFromUrl,
  shouldRevalidateCompareLoader,
} from "../../../src/routes/compare/recommendation-route-data";
import { shouldRevalidate as shouldRevalidateCompareRoute } from "../../../src/routes/compare/CompareRoute";

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
    ["https://example.test/compare?recommend=best_value", "best_value"],
  ] as const)("parses %s as %s", (url, profile) => {
    expect(recommendationProfileFromUrl(url)).toBe(profile);
  });
});

describe("buildRecommendationProfilePath", () => {
  test.each([
    [[], "shared", "lowest_current_cost", "/compare?"],
    [
      ["chair", "desk", "lamp"],
      "shared",
      "lowest_current_cost",
      "/compare?slug=chair&slug=desk&slug=lamp",
    ],
    [
      ["desk lamp", "chair/plus+?&"],
      "all",
      "lowest_current_cost",
      "/compare?slug=desk+lamp&slug=chair%2Fplus%2B%3F%26&specs=all",
    ],
    [
      ["first", "second"],
      "differences",
      "best_value",
      "/compare?slug=first&slug=second&specs=differences&recommend=best_value",
    ],
    [
      ["first", "second"],
      "shared",
      "best_value",
      "/compare?slug=first&slug=second&recommend=best_value",
    ],
  ] as const)("builds %s with %s specs and %s profile", (slugs, specMode, profile, path) => {
    expect(buildRecommendationProfilePath(slugs, specMode, profile)).toBe(path);
  });
});

describe("buildRecommendationQueryInput", () => {
  test.each([
    ["lowest_current_cost", "LOWEST_CURRENT_COST"],
    ["best_value", "BEST_VALUE"],
  ] as const)("maps %s to the %s GraphQL profile enum", (profile, queryProfile) => {
    expect(buildRecommendationQueryInput(["chair", "desk"], profile).queryVariables).toEqual({
      slugs: ["chair", "desk"],
      profile: queryProfile,
    });
  });

  test("preserves selected-slug order without mutating the input", () => {
    const slugs = ["third", "first", "second"];
    const { queryVariables } = buildRecommendationQueryInput(slugs, "best_value");

    expect(queryVariables.slugs).toEqual(["third", "first", "second"]);
    expect(queryVariables.slugs).not.toBe(slugs);
    expect(slugs).toEqual(["third", "first", "second"]);
  });

  test("changes reset identity when the profile changes", () => {
    expect(
      buildRecommendationQueryInput(["chair", "desk"], "lowest_current_cost").resetToken,
    ).not.toBe(buildRecommendationQueryInput(["chair", "desk"], "best_value").resetToken);
  });

  test("distinguishes delimiter-containing slug lists in reset identity", () => {
    expect(buildRecommendationQueryInput(["one|two", "three"], "best_value").resetToken).not.toBe(
      buildRecommendationQueryInput(["one", "two|three"], "best_value").resetToken,
    );
  });
});

describe("shouldRevalidateCompareLoader", () => {
  test("is exported through the framework route contract", () => {
    expect(
      shouldRevalidateCompareRoute({
        currentUrl: new URL("https://example.test/compare?slug=one&recommend=best_value"),
        nextUrl: new URL("https://example.test/compare?slug=one"),
        defaultShouldRevalidate: true,
      }),
    ).toBe(false);
  });

  test.each([
    [
      "https://example.test/compare?slug=one&slug=two",
      "https://example.test/compare?slug=one&slug=two&recommend=best_value",
    ],
    [
      "https://example.test/compare?slug=one&slug=two&recommend=best_value",
      "https://example.test/compare?slug=one&slug=two",
    ],
    [
      "https://example.test/compare?slug=one&slug=two&recommend=unknown",
      "https://example.test/compare?slug=one&slug=two&recommend=best_value",
    ],
  ])("suppresses core revalidation when only the raw profile changes", (currentUrl, nextUrl) => {
    expect(
      shouldRevalidateCompareLoader({
        currentUrl: new URL(currentUrl),
        nextUrl: new URL(nextUrl),
        defaultShouldRevalidate: true,
      }),
    ).toBe(false);
  });

  test.each([
    [
      "https://example.test/compare?slug=one&slug=two",
      "https://example.test/compare?slug=one&slug=two#recommendation",
    ],
    [
      "https://example.test/compare?slug=one&slug=two",
      "https://example.test/compare?slug=one&slug=two",
    ],
    [
      "https://example.test/compare?slug=one&slug=two",
      "https://example.test/catalog?slug=one&slug=two&recommend=best_value",
    ],
    [
      "https://example.test/compare?slug=one&slug=two",
      "https://example.test/compare?slug=one&slug=three&recommend=best_value",
    ],
    [
      "https://example.test/compare?slug=one&slug=two&specs=all",
      "https://example.test/compare?slug=one&slug=two&specs=differences&recommend=best_value",
    ],
    [
      "https://example.test/compare?slug=one&sort=price",
      "https://example.test/compare?slug=one&sort=name&recommend=best_value",
    ],
  ])("defers to either router default for unrelated route changes", (currentUrl, nextUrl) => {
    for (const defaultShouldRevalidate of [false, true]) {
      expect(
        shouldRevalidateCompareLoader({
          currentUrl: new URL(currentUrl),
          nextUrl: new URL(nextUrl),
          defaultShouldRevalidate,
        }),
      ).toBe(defaultShouldRevalidate);
    }
  });
});
