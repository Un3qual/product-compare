import { decimalStringToNumber } from "../decimal-values";
import { externalHttpUrlHref } from "../external-links";
import {
  graphQLDateTimeContext,
  graphQLDateTimeLabel,
  type GraphQLDateTimeContext
} from "../graphql-datetime";
import {
  formatCouponAvailabilityCount,
  formatOfferCount
} from "../offer-formatting";
import {
  buildOfferSnapshotSummary,
  type OfferSnapshotSelectors
} from "../offer-snapshot";

export type ProductOfferCouponRow = {
  code: string;
  description: string | null | undefined;
  discountText: string | null;
  key: string;
  terms: string | null | undefined;
  validToText: string | null;
};

export type ProductOfferPriceHistoryRow = {
  id: string;
  observedAt: string;
  observedDate: string;
  priceText: string;
};

export type ProductOfferListItem = {
  coupons: ReadonlyArray<ProductOfferCouponRow>;
  couponsHasMore: boolean;
  id: string;
  merchantName: string;
  priceHistory: ReadonlyArray<ProductOfferPriceHistoryRow>;
  priceHistoryHasMore: boolean;
  priceObservation: GraphQLDateTimeContext | null;
  priceText: string | null;
};

export type VisibleProductOffer = ProductOfferListItem & {
  currency: string | null;
  numericPrice: number | null;
};

export type ProductOfferPanelConnection = {
  readonly edges: ReadonlyArray<{ readonly node: ProductOfferPanelOffer }>;
  readonly pageInfo: ProductOfferPageInfo;
};

export type ProductOfferPanelOffer = {
  readonly activeCoupons?: ProductOfferCouponConnection | null;
  readonly currency: unknown;
  readonly id: string;
  readonly latestPrice?: ProductOfferPrice | null;
  readonly merchant?: { readonly name: string | null | undefined } | null;
  readonly priceHistory?: ProductOfferPriceHistoryConnection | null;
  readonly url: unknown;
};

export type ProductOfferCouponConnection = {
  readonly edges: ReadonlyArray<{
    readonly cursor: string;
    readonly node: {
      readonly code: string;
      readonly currency: unknown;
      readonly description: string | null | undefined;
      readonly discountType: unknown;
      readonly discountValue: unknown;
      readonly terms: string | null | undefined;
      readonly validTo: unknown;
    };
  }>;
  readonly pageInfo: { readonly hasNextPage: boolean };
};

export type ProductOfferPrice = {
  readonly observedAt: unknown;
  readonly price: unknown;
};

export type ProductOfferPriceHistoryConnection = {
  readonly edges: ReadonlyArray<{ readonly node: ProductOfferPrice & { readonly id: string } }>;
  readonly pageInfo: { readonly hasNextPage: boolean };
};

export type ProductOfferPageInfo = {
  readonly endCursor: string | null | undefined;
  readonly hasNextPage: boolean;
};

export type ProductOfferSnapshot = {
  couponAvailabilityText: string;
  lowestVisiblePriceText: string | null;
  missingLatestPriceText: string;
  visibleOfferCount: number;
};

export type ProductOfferPanelData = {
  offers: VisibleProductOffer[];
  snapshot: ProductOfferSnapshot;
};

export function buildProductOfferPanelData(
  connection: ProductOfferPanelConnection
): ProductOfferPanelData {
  const offers = connection.edges.flatMap(({ node }) => {
    const offer = buildVisibleProductOffer(node);
    return offer ? [offer] : [];
  });

  return { offers, snapshot: productOfferSnapshot(offers) };
}

export function productOfferPaginationPaths({
  connection,
  offersAfter,
  productSlug,
  selectedCompareSlugs = []
}: {
  connection: Pick<ProductOfferPanelConnection, "pageInfo">;
  offersAfter: string | null;
  productSlug: string;
  selectedCompareSlugs?: readonly string[];
}) {
  const nextCursor = connection.pageInfo.hasNextPage
    ? connection.pageInfo.endCursor
    : null;

  return {
    firstPath: offersAfter ? productOffersPath(productSlug, null, selectedCompareSlugs) : null,
    nextPath: nextCursor ? productOffersPath(productSlug, nextCursor, selectedCompareSlugs) : null
  };
}

function buildVisibleProductOffer(node: ProductOfferPanelOffer): VisibleProductOffer | null {
  if (typeof node.url !== "string" || !externalHttpUrlHref(node.url)) {
    return null;
  }

  const currency = normalizedCurrency(node.currency);

  return {
    id: node.id,
    currency,
    merchantName: node.merchant?.name ?? "Visit offer",
    ...buildLatestPriceSummary(node.latestPrice, node.currency),
    ...buildVisibleCouponSummary(node.activeCoupons),
    ...buildVisiblePriceHistorySummary(node.priceHistory, node.currency)
  };
}

function buildLatestPriceSummary(
  latestPrice: ProductOfferPrice | null | undefined,
  currency: unknown
) {
  return {
    priceText: formatPriceText(latestPrice?.price, currency),
    numericPrice: decimalStringToNumber(latestPrice?.price),
    priceObservation: graphQLDateTimeContext(latestPrice?.observedAt)
  };
}

function buildVisibleCouponSummary(
  activeCoupons: ProductOfferCouponConnection | null | undefined
) {
  return {
    coupons: buildCouponRows(activeCoupons?.edges ?? []),
    couponsHasMore: activeCoupons?.pageInfo.hasNextPage ?? false
  };
}

function buildVisiblePriceHistorySummary(
  priceHistory: ProductOfferPriceHistoryConnection | null | undefined,
  currency: unknown
) {
  return {
    priceHistory: buildPriceHistoryRows(priceHistory?.edges ?? [], currency),
    priceHistoryHasMore: priceHistory?.pageInfo.hasNextPage ?? false
  };
}

function productOfferSnapshot(offers: readonly VisibleProductOffer[]): ProductOfferSnapshot {
  const summary = buildOfferSnapshotSummary(offers, PRODUCT_OFFER_SNAPSHOT_SELECTORS);

  return {
    couponAvailabilityText: formatCouponAvailabilityCount(summary.couponAvailabilityCount),
    lowestVisiblePriceText: lowestVisiblePriceText(summary),
    missingLatestPriceText: formatOfferCount(summary.missingPriceCount),
    visibleOfferCount: summary.visibleOfferCount
  };
}

const PRODUCT_OFFER_SNAPSHOT_SELECTORS: OfferSnapshotSelectors<VisibleProductOffer> = {
  currency: (offer) => offer.currency,
  hasCoupons: (offer) => offer.coupons.length > 0 || offer.couponsHasMore,
  numericPrice: (offer) => (hasVisiblePrice(offer) ? offer.numericPrice : null)
};

function hasVisiblePrice(
  offer: VisibleProductOffer
): offer is VisibleProductOffer & { currency: string; numericPrice: number; priceText: string } {
  return offer.numericPrice !== null && offer.priceText !== null && offer.currency !== null;
}

function lowestVisiblePriceText(
  summary: ReturnType<typeof buildOfferSnapshotSummary<VisibleProductOffer>>
) {
  if (summary.priceState === "mixed") {
    return "Multiple currencies";
  }

  const lowestPricedOffer = summary.lowestPricedOffer;
  return lowestPricedOffer?.priceText
    ? `${lowestPricedOffer.priceText} at ${lowestPricedOffer.merchantName}`
    : null;
}

function productOffersPath(
  productSlug: string,
  offersAfter: string | null,
  selectedCompareSlugs: readonly string[]
) {
  const params = new URLSearchParams();

  if (offersAfter) {
    params.set("offersAfter", offersAfter);
  }

  for (const slug of selectedCompareSlugs) {
    params.append("slug", slug);
  }

  const query = params.toString();
  const basePath = `/products/${encodeURIComponent(productSlug)}`;
  return `${query.length > 0 ? `${basePath}?${query}` : basePath}#offers`;
}

function buildCouponRows(
  edges: ProductOfferCouponConnection["edges"]
): ProductOfferCouponRow[] {
  return edges.map(({ cursor, node }) => ({
    key: cursor,
    code: node.code,
    description: node.description,
    discountText: formatCouponDiscountText(node.discountType, node.discountValue, node.currency),
    validToText: formatCouponValidToText(node.validTo),
    terms: node.terms
  }));
}

function buildPriceHistoryRows(
  edges: ProductOfferPriceHistoryConnection["edges"],
  currency: unknown
): ProductOfferPriceHistoryRow[] {
  return edges.flatMap(({ node }) => {
    const observedDate = graphQLDateTimeLabel(node.observedAt);
    const priceText = formatPriceText(node.price, currency);

    if (!observedDate || !priceText || typeof node.observedAt !== "string") {
      return [];
    }

    return [{ id: node.id, observedAt: node.observedAt, observedDate, priceText }];
  });
}

function formatPriceText(price: unknown, currency: unknown) {
  if (typeof currency !== "string") {
    return null;
  }

  if (typeof price === "string" && decimalStringToNumber(price) !== null) {
    return `${price} ${currency}`;
  }

  if (typeof price === "number" && Number.isFinite(price)) {
    return `${price.toFixed(2)} ${currency}`;
  }

  return null;
}

function normalizedCurrency(currency: unknown) {
  if (typeof currency !== "string") {
    return null;
  }

  const trimmedCurrency = currency.trim();
  return trimmedCurrency === "" ? null : trimmedCurrency;
}

function formatCouponDiscountText(
  discountType: unknown,
  discountValue: unknown,
  currency: unknown
) {
  if (discountType === "FREE_SHIPPING") {
    return "Free shipping";
  }

  const valueText = formatFiniteNumberText(discountValue);

  if (!valueText) {
    return null;
  }

  if (discountType === "PERCENT") {
    return `${valueText}%`;
  }

  return discountType === "AMOUNT" && typeof currency === "string" && currency !== ""
    ? `${valueText} ${currency}`
    : null;
}

function formatCouponValidToText(validTo: unknown) {
  const dateText = graphQLDateTimeLabel(validTo);
  return dateText ? `Valid through ${dateText}` : null;
}

function formatFiniteNumberText(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue !== "" && decimalStringToNumber(trimmedValue) !== null ? trimmedValue : null;
}
