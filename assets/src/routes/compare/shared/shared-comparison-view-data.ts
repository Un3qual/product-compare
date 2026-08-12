import type { SharedComparisonRouteQuery } from "$generated/SharedComparisonRouteQuery.graphql";
import { buildComparePathFromSlugs } from "../paths";
import {
  recommendationBlockerReasons,
  recommendationReasonCopy,
} from "../recommendation-view-data";

type SharedComparisonSnapshotNode = NonNullable<
  SharedComparisonRouteQuery["response"]["comparisonSnapshot"]
>;
type SharedComparisonProductNode = SharedComparisonSnapshotNode["products"][number];
type SharedComparisonAttributeNode = SharedComparisonProductNode["attributes"][number];
type SharedComparisonEvidenceNode = SharedComparisonAttributeNode["evidence"][number];
type SharedComparisonOfferNode = SharedComparisonProductNode["offers"][number];
type SharedComparisonRecommendationNode = SharedComparisonSnapshotNode["recommendation"];
type SharedComparisonRankingNode = SharedComparisonRecommendationNode["rankings"][number];

type SharedComparisonAttributeInput = Pick<
  SharedComparisonAttributeNode,
  "claimId" | "displayName" | "valueText"
> & {
  readonly evidence: ReadonlyArray<Pick<SharedComparisonEvidenceNode, "sourceName">>;
};

type SharedComparisonOfferInput = Pick<
  SharedComparisonOfferNode,
  "currency" | "landedPrice" | "merchantName" | "observedAt" | "pricePointId"
>;

type SharedComparisonProductInput = Pick<
  SharedComparisonProductNode,
  "brandName" | "description" | "id" | "modelNumber" | "name" | "slug"
> & {
  readonly attributes: readonly SharedComparisonAttributeInput[];
  readonly offers: readonly SharedComparisonOfferInput[];
};

type SharedComparisonRecommendationInput = Pick<
  SharedComparisonRecommendationNode,
  "evaluatedAt" | "missingInputs" | "winnerProductId"
> & {
  readonly rankings: ReadonlyArray<
    Pick<SharedComparisonRankingNode, "productId" | "productName" | "reasons">
  >;
};

type SharedComparisonSnapshotInput = Pick<
  SharedComparisonSnapshotNode,
  "capturedAt" | "disclaimer" | "title"
> & {
  readonly products: readonly SharedComparisonProductInput[];
  readonly recommendation: SharedComparisonRecommendationInput;
};

export function buildSharedComparisonViewData(snapshot: SharedComparisonSnapshotInput) {
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

function projectProduct(product: SharedComparisonProductInput) {
  const brandName = nonBlankText(product.brandName) ?? "Unknown brand";
  const modelNumber = nonBlankText(product.modelNumber);

  return {
    id: product.id,
    name: product.name,
    description: nonBlankText(product.description),
    brandModelLabel: modelNumber ? `${brandName} · ${modelNumber}` : brandName,
    attributes: product.attributes.map((attribute) => {
      const sourceName = nonBlankText(attribute.evidence[0]?.sourceName);

      return {
        key: attribute.claimId,
        displayName: attribute.displayName,
        valueText: attribute.valueText,
        sourceLabel: sourceName ? `Source: ${sourceName}` : "Source details unavailable",
      };
    }),
    offers: product.offers.map((offer) => {
      const merchantName = nonBlankText(offer.merchantName) ?? "Unknown merchant";
      const landedPrice = scalarText(offer.landedPrice);
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

function nonBlankText(value: string | null | undefined) {
  return value?.trim() ? value : null;
}

function scalarText(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const text = String(value).trim();

  return text || null;
}
