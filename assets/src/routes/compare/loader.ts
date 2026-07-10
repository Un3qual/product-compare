import type { LoaderFunctionArgs } from "react-router-dom";
import { getRequest } from "relay-runtime";
import productDetailRouteQuery, {
  type ProductDetailRouteQuery
} from "../../__generated__/ProductDetailRouteQuery.graphql";
import type { CompareRouteQuery } from "../../__generated__/CompareRouteQuery.graphql";
import {
  fetchRouteQuery,
  getRelayEnvironmentFromRouterContext,
  type RelayRouteQueryDescriptor
} from "../../relay/route-preload";
import { decimalStringToNumber } from "../decimal-values";
import { normalizeRouteLoaderThrownError } from "../loader-errors";
import { compareRouteQuery } from "./queries/CompareRouteQuery";

export const MAX_COMPARE_PRODUCTS = 3;
export const COMPARE_OFFER_CONTEXT_PAGE_SIZE = 3;
const COMPARE_PRODUCT_PICKER_PAGE_SIZE = 24;

export type CompareSpecMode = "shared" | "differences" | "all";

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
      productQueries: Array<RelayRouteQueryDescriptor<ProductDetailRouteQuery["variables"]>>;
      offerContexts: CompareOfferContextsByProductId;
      products: CompareProductSummary[];
    };

type CompareProduct = CompareRouteQuery["response"]["comparisonProducts"][number];
type PresentCompareProduct = NonNullable<CompareProduct>;
type CompareOfferConnection = NonNullable<PresentCompareProduct["merchantProducts"]>;
type CompareOfferContextNode = CompareOfferConnection["edges"][number]["node"];

export async function compareLoader({
  context,
  request
}: LoaderFunctionArgs): Promise<CompareRouteLoaderData> {
  const slugs = parseSelectedSlugs(request.url);
  const specMode = compareSpecModeFromUrl(request.url);

  if (slugs.length === 0) {
    return {
      status: "empty",
      specMode,
      slugs: []
    };
  }

  if (slugs.length > MAX_COMPARE_PRODUCTS) {
    return {
      status: "too_many",
      specMode,
      slugs
    };
  }

  const environment = getRelayEnvironmentFromRouterContext(context);

  try {
    const fetchedQuery = await fetchRouteQuery<CompareRouteQuery>(
      environment,
      compareRouteQuery,
      {
        slugs,
        offerFirst: COMPARE_OFFER_CONTEXT_PAGE_SIZE,
        pickerFirst: COMPARE_PRODUCT_PICKER_PAGE_SIZE,
        pickerAfter: null
      },
      { signal: request.signal }
    );
    const products = fetchedQuery.data.comparisonProducts;

    if (products.some((product) => !product)) {
      fetchedQuery.dispose();

      return {
        status: "not_found",
        specMode,
        slugs
      };
    }

    const presentProducts = products.filter(isPresentProduct);

    return {
      status: "ready",
      specMode,
      slugs,
      query: fetchedQuery.descriptor,
      productQueries: slugs.map(productDetailQueryDescriptor),
      offerContexts: summarizeOfferContexts(presentProducts),
      products: presentProducts.map(summarizeProduct)
    };
  } catch (error) {
    throw normalizeRouteLoaderThrownError(error, "Comparison fetch failed");
  }
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

function parseSelectedSlugs(requestUrl: string) {
  const url = new URL(requestUrl);
  const selected = new Set<string>();

  for (const rawSlug of url.searchParams.getAll("slug")) {
    const slug = rawSlug.trim();

    if (slug !== "") {
      selected.add(slug);
    }
  }

  return Array.from(selected);
}

function productDetailQueryDescriptor(
  slug: string
): RelayRouteQueryDescriptor<ProductDetailRouteQuery["variables"]> {
  const request = getRequest(productDetailRouteQuery);

  return {
    __relayQuery: {
      operationName: request.params.name,
      text: request.params.text,
      variables: { slug }
    }
  };
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
      unitSymbol: attribute.unitSymbol
    }))
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
  connection: CompareOfferConnection
): CompareAvailableOfferContextSummary {
  const offerNodes = connection.edges.map(({ node }) => node);
  const hasMoreActiveOffers = connection.pageInfo.hasNextPage;

  return {
    status: "available",
    productId,
    activeOfferCount: offerNodes.length,
    bestCurrentPrice: hasMoreActiveOffers ? null : lowestCurrentPrice(offerNodes),
    hasLoadedCoupons: offerNodes.some(
      (offer) => (offer.activeCoupons?.edges.length ?? 0) > 0
    ),
    hasMoreActiveOffers,
    hasMoreCoupons: offerNodes.some(
      (offer) => offer.activeCoupons?.pageInfo.hasNextPage ?? false
    ),
    latestPriceObservedAt: mostRecentObservedAt(offerNodes)
  };
}

function summarizeUnavailableOfferContext(productId: string): CompareUnavailableOfferContextSummary {
  return {
    status: "unavailable",
    productId
  };
}

function lowestCurrentPrice(
  offerNodes: CompareOfferContextNode[]
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
    candidate.numericPrice < bestCandidate.numericPrice ? candidate : bestCandidate
  );

  return {
    currency: bestPrice.currency,
    merchantName: bestPrice.merchantName,
    price: bestPrice.price
  };
}

type CompareBestCurrentPriceCandidate = CompareBestCurrentPriceSummary & {
  numericPrice: number;
};

function currentPriceCandidate(
  offer: CompareOfferContextNode
): CompareBestCurrentPriceCandidate | null {
  const latestPrice = offer.latestPrice;
  const numericPrice = decimalStringToNumber(latestPrice?.price);

  if (!latestPrice || numericPrice === null) {
    return null;
  }

  return {
    currency: offer.currency,
    merchantName: offer.merchant?.name ?? null,
    numericPrice,
    price: latestPrice.price
  };
}

function mostRecentObservedAt(offerNodes: CompareOfferContextNode[]) {
  const observedAtValues = offerNodes.flatMap((offer) => [
    offer.latestPrice?.observedAt,
    ...(offer.priceHistory?.edges.map(({ node }) => node.observedAt) ?? [])
  ]);
  let mostRecent: string | null = null;
  let mostRecentTime = Number.NEGATIVE_INFINITY;

  for (const observedAt of observedAtValues) {
    if (!observedAt) {
      continue;
    }

    const observedTime = Date.parse(observedAt);

    if (Number.isNaN(observedTime)) {
      continue;
    }

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
