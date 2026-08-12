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

const RECOMMENDATION_BLOCKER_FALLBACK =
  "More product or price details are needed before a winner can be recommended.";

export function getRecommendationViewData(
  recommendation: RecommendationViewDataInput,
): RecommendationViewData {
  const winner = recommendation.rankings.find(
    (ranking) => ranking.productId === recommendation.winnerProductId,
  );

  if (!winner) {
    return {
      kind: "no-winner",
      reasons: recommendationBlockerReasons(recommendation.missingInputs),
    };
  }

  const detailLabel = winner.claimIds.length === 1 ? "product detail" : "product details";

  return {
    kind: "supported",
    productName: winner.productName,
    reasons: winner.reasons.map(recommendationReasonCopy),
    details: `Based on the current price and ${winner.claimIds.length} verified ${detailLabel}.`,
  };
}

export function recommendationBlockerReasons(blockers: readonly string[]) {
  if (blockers.length === 0) return [RECOMMENDATION_BLOCKER_FALLBACK];

  return [...new Set(blockers.map(recommendationBlockerCopy))];
}

function recommendationBlockerCopy(blocker: string) {
  const normalized = blocker.trim().replace(/\s+/g, " ");

  if (/accepted specification evidence/i.test(normalized)) {
    return "One or more products need verified product details.";
  }
  if (/eligible offer currency|shared eligible currency/i.test(normalized)) {
    return "These products do not have current prices in the same currency.";
  }
  if (/same eligible landed price/i.test(normalized)) {
    return "The leading products have the same current total price.";
  }
  if (/recommendations require two or three existing products/i.test(normalized)) {
    return "Choose two or three available products to get a recommendation.";
  }
  if (/unsupported recommendation profile/i.test(normalized)) {
    return "This recommendation option is unavailable.";
  }

  return RECOMMENDATION_BLOCKER_FALLBACK;
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
