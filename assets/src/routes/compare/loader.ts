import type { LoaderFunctionArgs } from "react-router-dom";
import type { Environment } from "relay-runtime";
import productDetailRouteQuery, {
  type ProductDetailRouteQuery
} from "../../__generated__/ProductDetailRouteQuery.graphql";
import compareOfferContextQuery, {
  type CompareOfferContextQuery
} from "../../__generated__/CompareOfferContextQuery.graphql";
import {
  fetchRouteQuery,
  getRelayEnvironmentFromRouterContext,
  type FetchedRelayRouteQuery,
  type RelayRouteQueryDescriptor
} from "../../relay/route-preload";
import { normalizeRouteLoaderThrownError } from "../loader-errors";

export const MAX_COMPARE_PRODUCTS = 3;
export const COMPARE_OFFER_CONTEXT_FIRST = 3;

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
      productQueries: Array<RelayRouteQueryDescriptor<ProductDetailRouteQuery["variables"]>>;
      offerContexts: CompareOfferContextsByProductId;
      products: CompareProductSummary[];
    };

type FetchedCompareProductQuery = FetchedRelayRouteQuery<ProductDetailRouteQuery>;
type FetchedCompareOfferContextQuery = FetchedRelayRouteQuery<CompareOfferContextQuery>;

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
  const productResults = await Promise.allSettled(
    slugs.map((slug) =>
      fetchRouteQuery<ProductDetailRouteQuery>(
        environment,
        productDetailRouteQuery,
        { slug },
        { signal: request.signal }
      )
    )
  );
  const fetchedProductQueries = productResults
    .filter(isFulfilled)
    .map((result) => result.value);
  const rejectedResult = productResults.find(isRejected);

  if (rejectedResult) {
    disposeFetchedProductQueries(fetchedProductQueries);
    throw normalizeRouteLoaderThrownError(rejectedResult.reason, "Product fetch failed");
  }

  const products = fetchedProductQueries.map(({ data }) => data.product);

  if (products.some((product) => !product)) {
    disposeFetchedProductQueries(fetchedProductQueries);

    return {
      status: "not_found",
      specMode,
      slugs
    };
  }
  const presentProducts = products.filter(isPresentProduct);
  const offerContexts = await fetchOfferContextsByProductId(
    environment,
    presentProducts,
    request.signal
  );

  return {
    status: "ready",
    specMode,
    slugs,
    productQueries: fetchedProductQueries.map((query) => query.descriptor),
    offerContexts,
    products: presentProducts.map(summarizeProduct)
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

function summarizeProduct(
  product: NonNullable<ProductDetailRouteQuery["response"]["product"]>
): CompareProductSummary {
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

async function fetchOfferContextsByProductId(
  environment: Environment,
  products: Array<NonNullable<ProductDetailRouteQuery["response"]["product"]>>,
  signal: AbortSignal
): Promise<CompareOfferContextsByProductId> {
  const offerContextResults = await Promise.allSettled(
    products.map((product) =>
      fetchRouteQuery<CompareOfferContextQuery>(
        environment,
        compareOfferContextQuery,
        { productId: product.id, first: COMPARE_OFFER_CONTEXT_FIRST },
        { signal }
      )
    )
  );
  const offerContexts: CompareOfferContextsByProductId = {};

  products.forEach((product, index) => {
    const result = offerContextResults[index];

    if (!result || result.status === "rejected") {
      offerContexts[product.id] = summarizeUnavailableOfferContext(product.id);
      return;
    }

    try {
      offerContexts[product.id] = summarizeOfferContextQuery(product.id, result.value);
    } catch {
      offerContexts[product.id] = summarizeUnavailableOfferContext(product.id);
    } finally {
      result.value.dispose();
    }
  });

  return offerContexts;
}

function summarizeOfferContextQuery(
  productId: string,
  query: FetchedCompareOfferContextQuery
): CompareAvailableOfferContextSummary {
  const offerNodes = query.data.merchantProducts.edges.map(({ node }) => node);
  const bestCurrentPrice = lowestCurrentPrice(offerNodes);
  const latestPriceObservedAt = mostRecentObservedAt(offerNodes);

  return {
    status: "available",
    productId,
    activeOfferCount: offerNodes.length,
    bestCurrentPrice,
    hasLoadedCoupons: offerNodes.some(
      (offer) => (offer.activeCoupons?.edges.length ?? 0) > 0
    ),
    hasMoreActiveOffers: query.data.merchantProducts.pageInfo.hasNextPage,
    hasMoreCoupons: offerNodes.some(
      (offer) => offer.activeCoupons?.pageInfo.hasNextPage ?? false
    ),
    latestPriceObservedAt
  };
}

function summarizeUnavailableOfferContext(productId: string): CompareUnavailableOfferContextSummary {
  return {
    status: "unavailable",
    productId
  };
}

function lowestCurrentPrice(
  offerNodes: CompareOfferContextQuery["response"]["merchantProducts"]["edges"][number]["node"][]
): CompareBestCurrentPriceSummary | null {
  let bestPrice:
    | (CompareBestCurrentPriceSummary & {
        numericPrice: number;
      })
    | null = null;

  for (const offer of offerNodes) {
    const latestPrice = offer.latestPrice;
    const numericPrice = decimalStringToNumber(latestPrice?.price);

    if (!latestPrice || numericPrice === null) {
      continue;
    }

    if (bestPrice === null || numericPrice < bestPrice.numericPrice) {
      bestPrice = {
        currency: offer.currency,
        merchantName: offer.merchant?.name ?? null,
        numericPrice,
        price: latestPrice.price
      };
    }
  }

  if (!bestPrice) {
    return null;
  }

  return {
    currency: bestPrice.currency,
    merchantName: bestPrice.merchantName,
    price: bestPrice.price
  };
}

function mostRecentObservedAt(
  offerNodes: CompareOfferContextQuery["response"]["merchantProducts"]["edges"][number]["node"][]
) {
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

function decimalStringToNumber(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsedValue = Number.parseFloat(value);

  return Number.isNaN(parsedValue) ? null : parsedValue;
}

function disposeFetchedProductQueries(productQueries: FetchedCompareProductQuery[]) {
  for (const productQuery of productQueries) {
    productQuery.dispose();
  }
}

function isPresentProduct(
  product: ProductDetailRouteQuery["response"]["product"]
): product is NonNullable<ProductDetailRouteQuery["response"]["product"]> {
  return Boolean(product);
}

function isFulfilled<T>(result: PromiseSettledResult<T>): result is PromiseFulfilledResult<T> {
  return result.status === "fulfilled";
}

function isRejected<T>(result: PromiseSettledResult<T>): result is PromiseRejectedResult {
  return result.status === "rejected";
}
