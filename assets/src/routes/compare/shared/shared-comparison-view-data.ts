import { buildComparePathFromSlugs } from "../paths";

interface SharedComparisonRankingInput {
  readonly productId: string;
  readonly productName: string;
  readonly reasons?: readonly string[] | null;
}

interface SharedComparisonEvidenceInput {
  readonly sourceName?: string | null;
}

interface SharedComparisonAttributeInput {
  readonly claimId: string;
  readonly displayName: string;
  readonly valueText: string;
  readonly evidence?: readonly SharedComparisonEvidenceInput[] | null;
}

interface SharedComparisonOfferInput {
  readonly pricePointId: string;
  readonly merchantName?: string | null;
  readonly landedPrice?: unknown;
  readonly currency?: string | null;
  readonly observedAt?: string | null;
}

interface SharedComparisonProductInput {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description?: string | null;
  readonly brandName?: string | null;
  readonly modelNumber?: string | null;
  readonly attributes?: readonly SharedComparisonAttributeInput[] | null;
  readonly offers?: readonly SharedComparisonOfferInput[] | null;
}

interface SharedComparisonRecommendationInput {
  readonly algorithmVersion: string;
  readonly evaluatedAt: string;
  readonly winnerProductId?: string | null;
  readonly missingInputs?: readonly string[] | null;
  readonly rankings?: readonly SharedComparisonRankingInput[] | null;
}

export interface SharedComparisonSnapshotInput {
  readonly capturedAt: string;
  readonly disclaimer: string;
  readonly title?: string | null;
  readonly products?: readonly SharedComparisonProductInput[] | null;
  readonly recommendation: SharedComparisonRecommendationInput;
}

export function buildSharedComparisonViewData(
  snapshot: SharedComparisonSnapshotInput
) {
  const products = collection(snapshot.products);
  const recommendation = snapshot.recommendation;
  const winner = collection(recommendation.rankings).find(
    ({ productId }) => productId === recommendation.winnerProductId
  );

  return {
    capturedAt: snapshot.capturedAt,
    disclaimer: snapshot.disclaimer,
    liveComparisonPath: buildComparePathFromSlugs(
      products.map(({ slug }) => slug)
    ),
    products: products.map(projectProduct),
    recommendation: winner
      ? {
          algorithmVersion: recommendation.algorithmVersion,
          evaluatedAt: recommendation.evaluatedAt,
          kind: "winner" as const,
          label: winner.productName,
          reasons: [...collection(winner.reasons)]
        }
      : {
          algorithmVersion: recommendation.algorithmVersion,
          evaluatedAt: recommendation.evaluatedAt,
          kind: "unsupported" as const,
          label: "No supported winner",
          reasons: [...collection(recommendation.missingInputs)]
        },
    title: nonBlankText(snapshot.title) ?? "Shared product comparison"
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
    attributes: collection(product.attributes).map((attribute) => {
      const sourceName = nonBlankText(collection(attribute.evidence)[0]?.sourceName);

      return {
        claimId: attribute.claimId,
        displayName: attribute.displayName,
        valueText: attribute.valueText,
        evidenceLabel: sourceName
          ? `Accepted claim ${attribute.claimId} · ${sourceName}`
          : `Accepted claim ${attribute.claimId}`
      };
    }),
    offers: collection(product.offers).map((offer) => {
      const merchantName = nonBlankText(offer.merchantName) ?? "Unknown merchant";
      const landedPrice = scalarText(offer.landedPrice);
      const currency = nonBlankText(offer.currency);

      return {
        pricePointId: offer.pricePointId,
        label:
          landedPrice && currency
            ? `${merchantName}: ${landedPrice} ${currency} landed`
            : `${merchantName}: Landed price unavailable`,
        observedAt: nonBlankText(offer.observedAt)
      };
    })
  };
}

function collection<T>(value: readonly T[] | null | undefined): readonly T[] {
  return Array.isArray(value) ? value : [];
}

function nonBlankText(value: string | null | undefined) {
  return value && value.trim() ? value : null;
}

function scalarText(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const text = String(value).trim();

  return text || null;
}
