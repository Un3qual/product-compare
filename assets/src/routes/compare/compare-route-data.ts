import type { CompareRouteQuery } from "$generated/CompareRouteQuery.graphql";
import type { RelayRouteQueryDescriptor } from "$relay/route-preload";
import { compareDecimalStrings } from "$relay/scalars";
import { parseGraphQLDateTime } from "$relay/scalars";
import type { CompareSpecMode } from "./paths";

export { MAX_COMPARE_PRODUCTS, type CompareSpecMode } from "./paths";
export {
  recommendationProfileFromUrl,
  shouldRevalidateCompareLoader,
  type RecommendationProfile,
} from "./recommendation-route-data";

export const COMPARE_OFFER_CONTEXT_PAGE_SIZE = 3;

export interface CompareProductSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  brandName: string | null;
  currentAttributes: CompareProductAttributeSummary[];
}

export interface CompareProductAttributeSummary {
  attributeId?: string;
  code: string;
  displayName: string;
  valueText: string;
  sortOrder?: number | null;
  groupLabel?: string | null;
  isRequired?: boolean;
  numericValue?: string | null;
  booleanValue?: boolean | null;
  enumOptionId?: string | null;
  unitSymbol?: string | null;
}

export type CompareOfferContextsByProductId = Record<string, CompareOfferContextSummary>;

export type CompareOfferContextSummary =
  | CompareAvailableOfferContextSummary
  | CompareUnavailableOfferContextSummary;

export interface CompareAvailableOfferContextSummary {
  status: "available";
  productId: string;
  activeOfferCount: number;
  bestCurrentPrice: CompareBestCurrentPriceSummary | null;
  hasLoadedCoupons: boolean;
  hasMoreActiveOffers: boolean;
  hasMoreCoupons: boolean;
  latestPriceObservedAt: string | null;
}

export interface CompareUnavailableOfferContextSummary {
  status: "unavailable";
  productId: string;
}

export interface CompareBestCurrentPriceSummary {
  currency: string;
  merchantName: string | null;
  price: string;
}

export type CompareRouteLoaderData =
  | {
      status: "empty";
      specMode: CompareSpecMode;
      slugs: [];
    }
  | {
      status: "too_many" | "not_found";
      specMode: CompareSpecMode;
      slugs: string[];
    }
  | {
      status: "ready";
      specMode: CompareSpecMode;
      slugs: string[];
      query: RelayRouteQueryDescriptor<CompareRouteQuery["variables"]>;
      offerContexts: CompareOfferContextsByProductId;
      products: CompareProductSummary[];
    };

type CompareProduct = CompareRouteQuery["response"]["comparisonProducts"][number];
type PresentCompareProduct = NonNullable<CompareProduct>;
type CompareOfferConnection = NonNullable<PresentCompareProduct["merchantProducts"]>;
type CompareOfferContextNode = CompareOfferConnection["edges"][number]["node"];

export function compareQueryViewData(
  slugs: readonly string[],
  data: CompareRouteQuery["response"],
) {
  const products = orderProductsByRequestedSlugs(slugs, data.comparisonProducts);

  if (products.some((product) => !product)) return null;

  const presentProducts = products.filter(isPresentProduct);

  return {
    offerContexts: summarizeOfferContexts(presentProducts),
    products: presentProducts.map(summarizeProduct),
  };
}

export function compareSpecModeFromUrl(requestUrl: string): CompareSpecMode {
  const url = new URL(requestUrl);

  switch (url.searchParams.get("specs")?.trim()) {
    case "all":
      return "all";
    case "differences":
      return "differences";
    default:
      return "shared";
  }
}

function orderProductsByRequestedSlugs(
  slugs: readonly string[],
  products: ReadonlyArray<CompareProduct>,
) {
  const productsBySlug = new Map(
    products.filter(isPresentProduct).map((product) => [product.slug, product]),
  );

  return slugs.map((slug) => productsBySlug.get(slug) ?? null);
}

function summarizeProduct(product: PresentCompareProduct): CompareProductSummary {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: typeof product.description === "string" ? product.description : null,
    brandName: product.brand?.name ?? null,
    currentAttributes: product.currentAttributes.map((attribute) => ({
      attributeId: attribute.attributeId,
      code: attribute.code,
      displayName: attribute.displayName,
      valueText: attribute.valueText,
      sortOrder: attribute.sortOrder,
      groupLabel: attribute.groupLabel,
      isRequired: attribute.isRequired,
      numericValue: attribute.numericValue,
      booleanValue: attribute.booleanValue,
      enumOptionId: attribute.enumOptionId,
      unitSymbol: attribute.unitSymbol,
    })),
  };
}

function summarizeOfferContexts(products: PresentCompareProduct[]) {
  const offerContexts: CompareOfferContextsByProductId = {};

  for (const product of products) {
    offerContexts[product.id] = product.merchantProducts
      ? summarizeOfferContext(product.id, product.merchantProducts)
      : summarizeUnavailableOfferContext(product.id);
  }

  return offerContexts;
}

function summarizeOfferContext(
  productId: string,
  connection: CompareOfferConnection,
): CompareAvailableOfferContextSummary {
  const offerNodes = connection.edges.map(({ node }) => node);
  const hasMoreActiveOffers = connection.pageInfo.hasNextPage;

  return {
    status: "available",
    productId,
    activeOfferCount: offerNodes.length,
    bestCurrentPrice: hasMoreActiveOffers ? null : lowestCurrentPrice(offerNodes),
    hasLoadedCoupons: offerNodes.some((offer) => (offer.activeCoupons?.edges.length ?? 0) > 0),
    hasMoreActiveOffers,
    hasMoreCoupons: offerNodes.some((offer) => offer.activeCoupons?.pageInfo.hasNextPage ?? false),
    latestPriceObservedAt: mostRecentObservedAt(offerNodes),
  };
}

function summarizeUnavailableOfferContext(
  productId: string,
): CompareUnavailableOfferContextSummary {
  return {
    status: "unavailable",
    productId,
  };
}

function lowestCurrentPrice(
  offerNodes: CompareOfferContextNode[],
): CompareBestCurrentPriceSummary | null {
  const candidates = offerNodes.flatMap((offer) => {
    const candidate = currentPriceCandidate(offer);

    return candidate ? [candidate] : [];
  });

  if (candidates.length === 0) {
    return null;
  }

  if (new Set(candidates.map((candidate) => candidate.currency)).size > 1) {
    return null;
  }

  const bestPrice = candidates.reduce((bestCandidate, candidate) =>
    compareDecimalStrings(candidate.price, bestCandidate.price) === -1 ? candidate : bestCandidate,
  );

  return {
    currency: bestPrice.currency,
    merchantName: bestPrice.merchantName,
    price: bestPrice.price,
  };
}

function currentPriceCandidate(
  offer: CompareOfferContextNode,
): CompareBestCurrentPriceSummary | null {
  const latestPrice = offer.latestPrice;

  if (!latestPrice || compareDecimalStrings(latestPrice.price, "0") === null) {
    return null;
  }

  return {
    currency: offer.currency,
    merchantName: offer.merchant?.name ?? null,
    price: latestPrice.price,
  };
}

function mostRecentObservedAt(offerNodes: CompareOfferContextNode[]) {
  const observedAtValues = offerNodes.flatMap((offer) => [
    offer.latestPrice?.observedAt,
    ...(offer.priceHistory?.edges.map(({ node }) => node.observedAt) ?? []),
  ]);
  let mostRecent: string | null = null;
  let mostRecentTime = Number.NEGATIVE_INFINITY;

  for (const observedAt of observedAtValues) {
    if (!observedAt) {
      continue;
    }

    const observedDate = parseGraphQLDateTime(observedAt);

    if (!observedDate) {
      continue;
    }

    const observedTime = observedDate.getTime();

    if (observedTime > mostRecentTime) {
      mostRecent = observedAt;
      mostRecentTime = observedTime;
    }
  }

  return mostRecent;
}

function isPresentProduct(product: CompareProduct): product is PresentCompareProduct {
  return Boolean(product);
}
