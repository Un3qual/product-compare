import { describe, expect, test } from "vitest";
import {
  getRecommendationViewData,
  type RecommendationViewDataInput,
} from "../../../src/routes/compare/recommendation-view-data";

describe("getRecommendationViewData", () => {
  test("returns the matching winner with customer-facing reasons and supporting details", () => {
    const recommendation = buildRecommendation({
      rankings: [
        buildRanking({
          productId: "product-winner",
          productName: "Evidence Camera",
          reasons: ["Lowest eligible landed price: USD 119.00", "Two accepted claims."],
          claimIds: ["claim-1", "claim-2"],
        }),
      ],
      winnerProductId: "product-winner",
    });

    expect(getRecommendationViewData(recommendation)).toEqual({
      kind: "supported",
      productName: "Evidence Camera",
      reasons: ["Lowest current total price: USD 119.00", "Two verified product details."],
      details: "Based on the current price and 2 verified product details.",
    });
  });

  test("selects the first source-ordered ranking that matches the winner", () => {
    const recommendation = buildRecommendation({
      rankings: [
        buildRanking({
          productId: "product-winner",
          productName: "First winner",
        }),
        buildRanking({
          productId: "product-winner",
          productName: "Second winner",
        }),
      ],
      winnerProductId: "product-winner",
    });

    expect(getRecommendationViewData(recommendation)).toMatchObject({
      kind: "supported",
      productName: "First winner",
      details: "Based on the current price and 1 verified product detail.",
    });
  });

  test.each([
    ["missing winner", null, [buildRanking()]],
    ["unmatched winner", "product-not-ranked", [buildRanking()]],
  ] as const)(
    "translates recommendation blockers without exposing backend text for a %s",
    (_caseName, winnerProductId, rankings) => {
      const recommendation = buildRecommendation({
        winnerProductId,
        rankings,
        missingInputs: [
          "Products do not share one eligible offer currency.",
          "price_point_id=price-point-42 failed internal policy v3",
        ],
      });

      expect(getRecommendationViewData(recommendation)).toEqual({
        kind: "no-winner",
        reasons: [
          "These products do not have current prices in the same currency.",
          "More product or price details are needed before a winner can be recommended.",
        ],
      });
    },
  );

  test("explains a blocker safely when the backend supplies no details", () => {
    expect(
      getRecommendationViewData(
        buildRecommendation({ winnerProductId: null, rankings: [], missingInputs: [] }),
      ),
    ).toEqual({
      kind: "no-winner",
      reasons: ["More product or price details are needed before a winner can be recommended."],
    });
  });

  test.each([
    [
      "Top products have the same eligible landed price.",
      "The leading products have the same current total price.",
    ],
    [
      "Recommendations require two or three existing products.",
      "Choose two or three available products to get a recommendation.",
    ],
    ["Unsupported recommendation profile.", "This recommendation option is unavailable."],
  ] as const)("translates the current backend blocker %s", (missingInput, expectedReason) => {
    expect(
      getRecommendationViewData(
        buildRecommendation({ winnerProductId: null, rankings: [], missingInputs: [missingInput] }),
      ),
    ).toEqual({ kind: "no-winner", reasons: [expectedReason] });
  });

  test.each([
    [[], "Based on the current price and 0 verified product details."],
    [["claim-1"], "Based on the current price and 1 verified product detail."],
    [
      ["claim-1", "claim-2", "claim-3"],
      "Based on the current price and 3 verified product details.",
    ],
  ] as const)("uses exact product-detail copy for %s", (claimIds, detailCopy) => {
    const recommendation = buildRecommendation({
      rankings: [buildRanking({ claimIds })],
    });

    const data = getRecommendationViewData(recommendation);

    expect(data.kind).toBe("supported");
    if (data.kind === "supported") {
      expect(data.details).toBe(detailCopy);
    }
  });

  test("does not mutate the recommendation, rankings, reasons, claims, or missing inputs", () => {
    const recommendation = buildRecommendation({
      rankings: [
        buildRanking({
          reasons: ["First reason", "Second reason"],
          claimIds: ["claim-1", "claim-2"],
        }),
      ],
      missingInputs: ["Missing first input", "Missing second input"],
    });
    const original = structuredClone(recommendation);

    getRecommendationViewData(recommendation);

    expect(recommendation).toEqual(original);
  });
});

function buildRecommendation(
  overrides: Partial<RecommendationViewDataInput> = {},
): RecommendationViewDataInput {
  return {
    winnerProductId: "product-1",
    missingInputs: [],
    rankings: [buildRanking()],
    ...overrides,
  };
}

function buildRanking(
  overrides: Partial<RecommendationViewDataInput["rankings"][number]> = {},
): RecommendationViewDataInput["rankings"][number] {
  return {
    productId: "product-1",
    productName: "Default Camera",
    claimIds: ["claim-1"],
    reasons: ["Lowest eligible landed price: USD 100.00"],
    ...overrides,
  };
}
