export type RecommendationViewDataInput = {
  algorithmVersion: string;
  missingInputs: readonly string[];
  rankings: readonly RecommendationRanking[];
  winnerProductId: string | null | undefined;
};

type RecommendationRanking = {
  claimIds: readonly string[];
  pricePointId: string;
  productId: string;
  productName: string;
  reasons: readonly string[];
};

export type RecommendationViewData =
  | {
      kind: "supported";
      evidence: string;
      productName: string;
      reasons: readonly string[];
    }
  | {
      kind: "no-winner";
      reasons: readonly string[];
    };

export function getRecommendationViewData(
  recommendation: RecommendationViewDataInput
): RecommendationViewData {
  const winner = recommendation.rankings.find(
    (ranking) => ranking.productId === recommendation.winnerProductId
  );

  if (!winner) {
    return { kind: "no-winner", reasons: recommendation.missingInputs };
  }

  const claimReference = winner.claimIds.length === 1 ? "reference" : "references";

  return {
    kind: "supported",
    productName: winner.productName,
    reasons: winner.reasons,
    evidence: `Evidence: price observation ${winner.pricePointId}; ${winner.claimIds.length} accepted claim ${claimReference}. Algorithm ${recommendation.algorithmVersion}.`
  };
}
