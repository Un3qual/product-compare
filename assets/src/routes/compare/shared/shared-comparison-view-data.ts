import type { SharedComparisonRouteQuery } from "$generated/SharedComparisonRouteQuery.graphql";
import { buildComparePathFromSlugs } from "../paths";
import {
  recommendationBlockerReasons,
  recommendationReasonCopy,
} from "../recommendation-view-data";

export function buildSharedComparisonViewData(
  snapshot: NonNullable<SharedComparisonRouteQuery["response"]["comparisonSnapshot"]>,
) {
  const products = snapshot.products;
  const recommendation = snapshot.recommendation;
  const winner = recommendation.rankings.find(
    ({ productId }) => productId === recommendation.winnerProductId,
  );

  return {
    capturedAt: snapshot.capturedAt,
    disclaimer: snapshot.disclaimer,
    liveComparisonPath: buildComparePathFromSlugs(products.map(({ slug }) => slug)),
    products: products.map(projectProduct),
    recommendation: winner
      ? {
          evaluatedAt: recommendation.evaluatedAt,
          kind: "winner" as const,
          label: winner.productName,
          reasons: winner.reasons.map(recommendationReasonCopy),
        }
      : {
          evaluatedAt: recommendation.evaluatedAt,
          kind: "unsupported" as const,
          label: "No supported winner",
          reasons: recommendationBlockerReasons(recommendation.missingInputs),
        },
    title: nonBlankText(snapshot.title) ?? "Shared product comparison",
  };
}

function projectProduct(
  product: NonNullable<SharedComparisonRouteQuery["response"]["comparisonSnapshot"]>["products"][number],
) {
  const brandName = nonBlankText(product.brandName) ?? "Unknown brand";
  const modelNumber = nonBlankText(product.modelNumber);

  return {
    id: product.id,
    name: product.name,
    description: nonBlankText(product.description),
    brandModelLabel: modelNumber ? `${brandName} · ${modelNumber}` : brandName,
    attributes: product.attributes.map((attribute) => {
      const sourceName = nonBlankText(attribute.evidence[0]?.sourceName ?? null);

      return {
        key: attribute.claimId,
        displayName: attribute.displayName,
        valueText: attribute.valueText,
        sourceLabel: sourceName ? `Source: ${sourceName}` : "Source details unavailable",
      };
    }),
    offers: product.offers.map((offer) => {
      const merchantName = nonBlankText(offer.merchantName) ?? "Unknown merchant";
      const landedPrice = nonBlankText(offer.landedPrice);
      const currency = nonBlankText(offer.currency);

      return {
        key: offer.pricePointId,
        label:
          landedPrice && currency
            ? `${merchantName}: ${landedPrice} ${currency} total`
            : `${merchantName}: Current total price unavailable`,
        observedAt: nonBlankText(offer.observedAt),
      };
    }),
  };
}

function nonBlankText(value: string | null) {
  return value?.trim() ? value : null;
}
