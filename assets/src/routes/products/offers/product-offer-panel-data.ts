import type { ProductOfferPanel_connection$data } from "$generated/ProductOfferPanel_connection.graphql";
import { decimalStringToNumber } from "$relay/scalars";
import { externalHttpUrlHref } from "$frontend/navigation/external-links";
import {
  graphQLDateTimeContext,
  graphQLDateTimeLabel,
  type GraphQLDateTimeContext,
} from "$relay/scalars";
import {
  buildOfferSnapshotSummary,
  type OfferSnapshotSelectors,
} from "$routes/offers/offer-snapshot";
import { nextPageCursor } from "$relay/pagination";
import type { PriceHistoryChartDatum } from "$ui/components/data/PriceHistoryChart";
import { productDetailPath } from "../product-detail-route-data";

export type ProductOfferCouponRow = {
  code: string;
  description: string | null;
  discountText: string | null;
  key: string;
  terms: string | null;
  validToText: string | null;
};

export type ProductOfferListItem = {
  coupons: ReadonlyArray<ProductOfferCouponRow>;
  couponsHasMore: boolean;
  id: string;
  merchantName: string;
  priceHistory: ReadonlyArray<PriceHistoryChartDatum>;
  priceHistoryHasMore: boolean;
  priceObservation: GraphQLDateTimeContext | null;
  priceText: string | null;
};

export type VisibleProductOffer = ProductOfferListItem & {
  currency: string | null;
  numericPrice: number | null;
};

export type ProductOfferPanelConnection = Pick<
  ProductOfferPanel_connection$data,
  "edges" | "pageInfo"
>;
export type ProductOfferPanelOffer = ProductOfferPanelConnection["edges"][number]["node"];
export type ProductOfferCouponConnection = NonNullable<ProductOfferPanelOffer["activeCoupons"]>;
type ProductOfferCoupon = ProductOfferCouponConnection["edges"][number]["node"];
export type ProductOfferPrice = NonNullable<ProductOfferPanelOffer["latestPrice"]>;
export type ProductOfferPriceHistoryConnection = NonNullable<
  ProductOfferPanelOffer["priceHistory"]
>;

export type ProductOfferSnapshot = ReturnType<typeof productOfferSnapshot>;

export type ProductOfferPanelData = {
  offers: VisibleProductOffer[];
  snapshot: ProductOfferSnapshot;
};

export function buildProductOfferPanelData(
  connection: ProductOfferPanelConnection,
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
  selectedCompareSlugs = [],
}: {
  connection: Pick<ProductOfferPanelConnection, "pageInfo">;
  offersAfter: string | null;
  productSlug: string;
  selectedCompareSlugs?: readonly string[];
}) {
  const nextCursor = nextPageCursor(connection.pageInfo, offersAfter);

  return {
    firstPath: offersAfter ? productOffersPath(productSlug, null, selectedCompareSlugs) : null,
    nextPath: nextCursor ? productOffersPath(productSlug, nextCursor, selectedCompareSlugs) : null,
  };
}

function buildVisibleProductOffer(node: ProductOfferPanelOffer): VisibleProductOffer | null {
  if (!externalHttpUrlHref(node.url)) {
    return null;
  }

  return {
    id: node.id,
    currency: node.currency,
    merchantName: node.merchant?.name ?? "Visit offer",
    ...buildLatestPriceSummary(node.latestPrice, node.currency),
    ...buildVisibleCouponSummary(node.activeCoupons),
    ...buildVisiblePriceHistorySummary(node.priceHistory, node.currency),
  };
}

function buildLatestPriceSummary(
  latestPrice: ProductOfferPanelOffer["latestPrice"],
  currency: string,
) {
  return {
    priceText: formatPriceText(latestPrice?.price ?? null, currency),
    numericPrice: decimalStringToNumber(latestPrice?.price),
    priceObservation: graphQLDateTimeContext(latestPrice?.observedAt),
  };
}

function buildVisibleCouponSummary(activeCoupons: ProductOfferPanelOffer["activeCoupons"]) {
  return {
    coupons: buildCouponRows(activeCoupons?.edges ?? []),
    couponsHasMore: activeCoupons?.pageInfo.hasNextPage ?? false,
  };
}

function buildVisiblePriceHistorySummary(
  priceHistory: ProductOfferPanelOffer["priceHistory"],
  currency: string,
) {
  return {
    priceHistory: buildPriceHistoryRows(priceHistory?.edges ?? [], currency),
    priceHistoryHasMore: priceHistory?.pageInfo.hasNextPage ?? false,
  };
}

const PRODUCT_OFFER_SNAPSHOT_SELECTORS = {
  currency: (offer) => offer.currency,
  hasCoupons: (offer) => offer.coupons.length > 0 || offer.couponsHasMore,
  numericPrice: (offer) => (hasVisiblePrice(offer) ? offer.numericPrice : null),
} satisfies OfferSnapshotSelectors<VisibleProductOffer>;

function productOfferSnapshot(offers: readonly VisibleProductOffer[]) {
  const summary = buildOfferSnapshotSummary(offers, PRODUCT_OFFER_SNAPSHOT_SELECTORS);

  return {
    couponOfferCount: summary.couponAvailabilityCount,
    lowestVisiblePriceText: lowestVisiblePriceText(summary),
    missingPriceCount: summary.missingPriceCount,
    visibleOfferCount: summary.visibleOfferCount,
  };
}

function hasVisiblePrice(
  offer: VisibleProductOffer,
): offer is VisibleProductOffer & { currency: string; numericPrice: number; priceText: string } {
  return offer.numericPrice !== null && offer.priceText !== null && offer.currency !== null;
}

function lowestVisiblePriceText(
  summary: ReturnType<typeof buildOfferSnapshotSummary<VisibleProductOffer>>,
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
  selectedCompareSlugs: readonly string[],
) {
  const query = productOfferSearchParams(offersAfter, selectedCompareSlugs).toString();
  const querySuffix = query.length > 0 ? `?${query}` : "";

  return `${productDetailPath(productSlug)}${querySuffix}#offers`;
}

function productOfferSearchParams(
  offersAfter: string | null,
  selectedCompareSlugs: readonly string[],
) {
  const params = new URLSearchParams();

  if (offersAfter) {
    params.set("offersAfter", offersAfter);
  }

  for (const slug of selectedCompareSlugs) {
    params.append("slug", slug);
  }

  return params;
}

function buildCouponRows(edges: ProductOfferCouponConnection["edges"]): ProductOfferCouponRow[] {
  return edges.map(({ cursor, node }) => ({
    key: cursor,
    code: node.code,
    description: node.description,
    discountText: formatCouponDiscountText(node.discountType, node.discountValue, node.currency),
    validToText: formatCouponValidToText(node.validTo),
    terms: node.terms,
  }));
}

function buildPriceHistoryRows(
  edges: ProductOfferPriceHistoryConnection["edges"],
  currency: string,
): PriceHistoryChartDatum[] {
  return edges.flatMap(({ node }) => {
    const observedDate = graphQLDateTimeLabel(node.observedAt);
    const priceText = formatPriceText(node.price, currency);
    const priceValue = decimalStringToNumber(node.price);

    if (!observedDate || !priceText || priceValue === null) {
      return [];
    }

    return [{ id: node.id, observedAt: node.observedAt, observedDate, priceText, priceValue }];
  });
}

function formatPriceText(price: string | null, currency: string) {
  if (price && decimalStringToNumber(price) !== null) {
    return `${price} ${currency}`;
  }

  return null;
}

function formatCouponDiscountText(
  discountType: ProductOfferCoupon["discountType"],
  discountValue: ProductOfferCoupon["discountValue"],
  currency: ProductOfferCoupon["currency"],
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

  return discountType === "AMOUNT" && currency ? `${valueText} ${currency}` : null;
}

function formatCouponValidToText(validTo: ProductOfferCoupon["validTo"]) {
  const dateText = graphQLDateTimeLabel(validTo);
  return dateText ? `Valid through ${dateText}` : null;
}

function formatFiniteNumberText(value: string | null) {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue !== "" && decimalStringToNumber(trimmedValue) !== null ? trimmedValue : null;
}
