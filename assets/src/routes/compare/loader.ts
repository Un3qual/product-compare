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
export const COMPARE_OFFER_CONTEXT_PAGE_SIZE = 20;
export const COMPARE_OFFER_CONTEXT_MAX_PAGES = 50;

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
type CompareOfferContextNode =
  CompareOfferContextQuery["response"]["merchantProducts"]["edges"][number]["node"];

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
  let offerContexts: CompareOfferContextsByProductId;

  try {
    offerContexts = await fetchOfferContextsByProductId(
      environment,
      presentProducts,
      request.signal
    );
  } catch (error) {
    disposeFetchedProductQueries(fetchedProductQueries);
    throw error;
  }

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
    products.map((product) => fetchOfferContextPages(environment, product.id, signal))
  );
  const abortedResult = offerContextResults.find(
    (result) => result.status === "rejected" && isRouteAbortRejection(result.reason, signal)
  );
  const offerContexts: CompareOfferContextsByProductId = {};

  if (abortedResult?.status === "rejected") {
    disposeFulfilledOfferContextQueries(offerContextResults);
    throw abortedResult.reason;
  }

  products.forEach((product, index) => {
    const result = offerContextResults[index];

    if (!result || result.status === "rejected") {
      offerContexts[product.id] = summarizeUnavailableOfferContext(product.id);
      return;
    }

    try {
      offerContexts[product.id] = summarizeOfferContextQueries(product.id, result.value);
    } catch {
      offerContexts[product.id] = summarizeUnavailableOfferContext(product.id);
    } finally {
      disposeFetchedOfferContextQueries(result.value);
    }
  });

  return offerContexts;
}

async function fetchOfferContextPages(
  environment: Environment,
  productId: string,
  signal: AbortSignal
): Promise<FetchedCompareOfferContextQuery[]> {
  const pages: FetchedCompareOfferContextQuery[] = [];
  const seenEndCursors = new Set<string>();
  let after: string | null = null;

  try {
    do {
      const page: FetchedCompareOfferContextQuery = await fetchRouteQuery<CompareOfferContextQuery>(
        environment,
        compareOfferContextQuery,
        {
          after,
          first: COMPARE_OFFER_CONTEXT_PAGE_SIZE,
          productId
        },
        { signal }
      );
      const pageInfo = page.data.merchantProducts.pageInfo;
      const endCursor: string | null = pageInfo.endCursor ?? null;
      const hasNextPage = pageInfo.hasNextPage;

      pages.push(page);

      if (!hasNextPage || !endCursor || seenEndCursors.has(endCursor)) {
        after = null;
        continue;
      }

      if (pages.length >= COMPARE_OFFER_CONTEXT_MAX_PAGES) {
        after = null;
        continue;
      }

      seenEndCursors.add(endCursor);
      after = endCursor;
    } while (after);
  } catch (error) {
    disposeFetchedOfferContextQueries(pages);
    throw error;
  }

  return pages;
}

function summarizeOfferContextQueries(
  productId: string,
  queries: FetchedCompareOfferContextQuery[]
): CompareAvailableOfferContextSummary {
  const offerNodes = queries.flatMap((query) =>
    query.data.merchantProducts.edges.map(({ node }) => node)
  );
  const bestCurrentPrice = lowestCurrentPrice(offerNodes);
  const latestPriceObservedAt = mostRecentObservedAt(offerNodes);
  const lastQuery = queries[queries.length - 1];
  const lastPageInfo = lastQuery?.data.merchantProducts.pageInfo;

  return {
    status: "available",
    productId,
    activeOfferCount: offerNodes.length,
    bestCurrentPrice,
    hasLoadedCoupons: offerNodes.some(
      (offer) => (offer.activeCoupons?.edges.length ?? 0) > 0
    ),
    hasMoreActiveOffers: lastPageInfo?.hasNextPage ?? false,
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

function disposeFetchedOfferContextQueries(queries: FetchedCompareOfferContextQuery[]) {
  for (const query of queries) {
    query.dispose();
  }
}

function disposeFulfilledOfferContextQueries(
  results: Array<PromiseSettledResult<FetchedCompareOfferContextQuery[]>>
) {
  for (const result of results) {
    if (result.status === "fulfilled") {
      disposeFetchedOfferContextQueries(result.value);
    }
  }
}

function isRouteAbortRejection(reason: unknown, signal: AbortSignal) {
  return signal.aborted || isAbortError(reason);
}

function isAbortError(reason: unknown) {
  return (
    typeof reason === "object" &&
    reason !== null &&
    "name" in reason &&
    (reason as { name?: unknown }).name === "AbortError"
  );
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

function mostRecentObservedAt(
  offerNodes: CompareOfferContextNode[]
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
