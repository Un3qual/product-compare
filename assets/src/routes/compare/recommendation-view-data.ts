export type RecommendationViewDataInput = {
  missingInputs: readonly string[];
  rankings: readonly RecommendationRanking[];
  winnerProductId: string | null | undefined;
};

type RecommendationRanking = {
  claimIds: readonly string[];
  productId: string;
  productName: string;
  reasons: readonly string[];
};

export type RecommendationViewData =
  | {
      kind: "supported";
      details: string;
      productName: string;
      reasons: readonly string[];
    }
  | {
      kind: "no-winner";
      reasons: readonly string[];
    };

export function getRecommendationViewData(
  recommendation: RecommendationViewDataInput,
): RecommendationViewData {
  const winner = recommendation.rankings.find(
    (ranking) => ranking.productId === recommendation.winnerProductId,
  );

  if (!winner) {
    return { kind: "no-winner", reasons: recommendation.missingInputs };
  }

  const detailLabel = winner.claimIds.length === 1 ? "product detail" : "product details";

  return {
    kind: "supported",
    productName: winner.productName,
    reasons: winner.reasons.map(recommendationReasonCopy),
    details: `Based on the current price and ${winner.claimIds.length} verified ${detailLabel}.`,
  };
}

export function recommendationReasonCopy(reason: string) {
  return reason
    .replace(
      /accepted specification evidence is unavailable/gi,
      "Verified product details are unavailable",
    )
    .replace(/eligible landed price/gi, "current total price")
    .replace(/accepted claims?/gi, "verified product details")
    .replace(/accepted specification evidence/gi, "verified product details")
    .replace(/price observations?/gi, "current prices")
    .replace(/insufficient evidence/gi, "not enough product details");
}
