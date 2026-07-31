import { describe, expect, test } from "vitest";
import {
  getRecommendationViewData,
  type RecommendationViewDataInput,
} from "../../../src/routes/compare/recommendation-view-data";

describe("getRecommendationViewData", () => {
  test("returns the matching winner with source-ordered reasons and exact evidence", () => {
    const recommendation = buildRecommendation({
      rankings: [
        buildRanking({
          productId: "product-winner",
          productName: "Evidence Camera",
          reasons: ["Lowest eligible landed price: USD 119.00", "Two accepted claims."],
          claimIds: ["claim-1", "claim-2"],
          pricePointId: "price-point-4",
        }),
      ],
      winnerProductId: "product-winner",
    });

    expect(getRecommendationViewData(recommendation)).toEqual({
      kind: "supported",
      productName: "Evidence Camera",
      reasons: ["Lowest eligible landed price: USD 119.00", "Two accepted claims."],
      evidence:
        "Evidence: price observation price-point-4; 2 accepted claim references. Algorithm best-supported-current-cost-v1.",
    });
  });

  test("selects the first source-ordered ranking that matches the winner", () => {
    const recommendation = buildRecommendation({
      rankings: [
        buildRanking({
          productId: "product-winner",
          productName: "First winner",
          pricePointId: "first-observation",
        }),
        buildRanking({
          productId: "product-winner",
          productName: "Second winner",
          pricePointId: "second-observation",
        }),
      ],
      winnerProductId: "product-winner",
    });

    expect(getRecommendationViewData(recommendation)).toMatchObject({
      kind: "supported",
      productName: "First winner",
      evidence: expect.stringContaining("first-observation"),
    });
  });

  test.each([
    ["missing winner", null, [buildRanking()]],
    ["unmatched winner", "product-not-ranked", [buildRanking()]],
  ] as const)(
    "uses source-ordered missing inputs for a %s",
    (_caseName, winnerProductId, rankings) => {
      const recommendation = buildRecommendation({
        winnerProductId,
        rankings,
        missingInputs: ["No complete in-stock offer.", "No shared eligible currency."],
      });

      expect(getRecommendationViewData(recommendation)).toEqual({
        kind: "no-winner",
        reasons: ["No complete in-stock offer.", "No shared eligible currency."],
      });
    },
  );

  test.each([
    [[], "0 accepted claim references"],
    [["claim-1"], "1 accepted claim reference"],
    [["claim-1", "claim-2", "claim-3"], "3 accepted claim references"],
  ] as const)("uses exact claim-reference copy for %s", (claimIds, claimReferenceCopy) => {
    const recommendation = buildRecommendation({
      rankings: [buildRanking({ claimIds })],
    });

    const data = getRecommendationViewData(recommendation);

    expect(data.kind).toBe("supported");
    if (data.kind === "supported") {
      expect(data.evidence).toContain(claimReferenceCopy);
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
    algorithmVersion: "best-supported-current-cost-v1",
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
    pricePointId: "price-point-1",
    claimIds: ["claim-1"],
    reasons: ["Lowest eligible landed price: USD 100.00"],
    ...overrides,
  };
}
