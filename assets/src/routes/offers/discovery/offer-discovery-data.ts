import type { OfferDiscoveryCard_offer$data } from "$generated/OfferDiscoveryCard_offer.graphql";
import type { OfferDiscoveryList_connection$data } from "$generated/OfferDiscoveryList_connection.graphql";
import { canComparePriceCurrencies, decimalStringToNumber } from "$relay/scalars";
import { externalHttpUrlHref } from "$frontend/navigation/external-links";
import { graphQLDateTimeLabel } from "$relay/scalars";
import type { OfferSnapshotSelectors, OfferSnapshotSummary } from "$routes/offers/offer-snapshot";
import { compareProductText } from "$frontend/formatting";
import type { OfferDiscoverySort } from "./offer-discovery-filter-data";

export type OfferConnection = OfferDiscoveryList_connection$data;
export type OfferNode = Omit<OfferDiscoveryCard_offer$data, " $fragmentType">;
type OfferListNode = OfferConnection["edges"][number]["node"];
export type ActiveCouponsConnection = NonNullable<OfferNode["activeCoupons"]>;
export type PriceHistoryConnection = NonNullable<OfferNode["priceHistory"]>;
export type CouponNode = ActiveCouponsConnection["edges"][number]["node"];
export type PriceHistoryNode = PriceHistoryConnection["edges"][number]["node"];
export type RenderableOffer = {
  latestPriceCurrency: string | null;
  latestPriceValue: number | null;
  offer: OfferListNode;
  originalIndex: number;
};
export type VisibleMerchant = {
  id: string;
  name: string;
};
export type PriceHistoryRow = {
  id: string;
  observedAt: string;
  observedDate: string;
  priceText: string;
  priceValue: number;
};

type RenderableOfferSort = Exclude<OfferDiscoverySort, "default">;

export const OFFER_SNAPSHOT_SELECTORS: OfferSnapshotSelectors<RenderableOffer> = {
  currency: (offer) => offer.latestPriceCurrency,
  hasCoupons: ({ offer }) => hasVisibleCoupons(offer),
  numericPrice: (offer) => offer.latestPriceValue,
};

export function visibleLowestPriceLabel(summary: OfferSnapshotSummary<RenderableOffer>) {
  if (summary.priceState === "mixed") {
    return "Not comparable across currencies";
  }

  const lowestPricedOffer = summary.lowestPricedOffer;

  return lowestPricedOffer
    ? priceLabel(
        lowestPricedOffer.offer.latestPrice?.price ?? null,
        lowestPricedOffer.offer.currency,
      )
    : "No visible prices";
}

export function activeVisibleMerchant(
  merchantId: string | null,
  merchants: ReadonlyArray<VisibleMerchant>,
) {
  if (!merchantId) {
    return null;
  }

  return merchants.find((merchant) => merchant.id === merchantId) ?? null;
}

export function visibleMerchants(offers: ReadonlyArray<RenderableOffer>): VisibleMerchant[] {
  const merchants = new Map<string, string>();

  for (const { offer } of offers) {
    if (offer.merchant?.id && offer.merchant.name) {
      merchants.set(offer.merchant.id, offer.merchant.name);
    }
  }

  return Array.from(merchants, ([id, name]) => ({ id, name }));
}

export function renderableOffers(connection: OfferConnection) {
  const offers: RenderableOffer[] = [];

  connection.edges.forEach(({ node: offer }, originalIndex) => {
    const latestPriceValue = numericLatestPrice(offer);

    if (externalHttpUrlHref(offer.url)) {
      offers.push({
        latestPriceCurrency: latestPriceValue === null ? null : offer.currency,
        latestPriceValue,
        offer,
        originalIndex,
      });
    }
  });

  return offers;
}

export function sortedRenderableOffers(
  offers: RenderableOffer[],
  sort: OfferDiscoverySort,
  canComparePrices: boolean,
) {
  if (sort === "default" || (isPriceSort(sort) && !canComparePrices)) {
    return offers;
  }

  return [...offers].sort((left, right) => compareRenderableOffers(left, right, sort));
}

function compareRenderableOffers(
  left: RenderableOffer,
  right: RenderableOffer,
  sort: RenderableOfferSort,
) {
  if (sort === "price_asc" || sort === "price_desc") {
    return compareByPrice(left, right, sort);
  }

  if (sort === "merchant_name") {
    const merchantComparison = compareProductText(
      offerMerchantName(left.offer.merchant),
      offerMerchantName(right.offer.merchant),
    );

    return merchantComparison || compareByOriginalIndex(left, right);
  }

  const exhaustiveCheck: never = sort;
  throw new Error(`Unsupported offer sort: ${exhaustiveCheck}`);
}

function compareByPrice(
  left: RenderableOffer,
  right: RenderableOffer,
  sort: Extract<OfferDiscoverySort, "price_asc" | "price_desc">,
) {
  if (left.latestPriceValue === null && right.latestPriceValue === null) {
    return compareByOriginalIndex(left, right);
  }

  if (left.latestPriceValue === null) {
    return 1;
  }

  if (right.latestPriceValue === null) {
    return -1;
  }

  const priceComparison = left.latestPriceValue - right.latestPriceValue;

  return (
    (sort === "price_asc" ? priceComparison : -priceComparison) ||
    compareByOriginalIndex(left, right)
  );
}

function compareByOriginalIndex(left: RenderableOffer, right: RenderableOffer) {
  return left.originalIndex - right.originalIndex;
}

export function priceSortHighlightLabel(
  sort: OfferDiscoverySort,
  index: number,
  offer: RenderableOffer,
  canComparePrices: boolean,
) {
  if (!canComparePrices || index !== 0 || offer.latestPriceValue === null) {
    return null;
  }

  if (sort === "price_asc") {
    return "Best price on this page";
  }

  if (sort === "price_desc") {
    return "Highest price on this page";
  }

  return null;
}

function numericLatestPrice(offer: OfferListNode) {
  return decimalStringToNumber(offer.latestPrice?.price);
}

function isPriceSort(
  sort: OfferDiscoverySort,
): sort is Extract<OfferDiscoverySort, "price_asc" | "price_desc"> {
  return sort === "price_asc" || sort === "price_desc";
}

export function priceSortUsesSingleCurrency(offers: ReadonlyArray<RenderableOffer>) {
  return canComparePriceCurrencies(
    offers.flatMap((offer) => (offer.latestPriceValue === null ? [] : [offer.latestPriceCurrency])),
  );
}

export function offerMerchantName(merchant: OfferListNode["merchant"]) {
  return merchant?.name ?? "Visit offer";
}

export function priceLabel(price: string | null, currency: string) {
  if (!price) {
    return null;
  }

  return `${price} ${currency}`;
}

function hasVisibleCoupons(offer: OfferListNode) {
  const activeCoupons = offer.activeCoupons;

  return Boolean(
    activeCoupons && (activeCoupons.edges.length > 0 || activeCoupons.pageInfo.hasNextPage),
  );
}

export function priceHistoryRow(
  pricePoint: PriceHistoryNode,
  currency: string,
): PriceHistoryRow | null {
  const priceText = priceLabel(pricePoint.price, currency);
  const priceValue = decimalStringToNumber(pricePoint.price);
  const observedDate = graphQLDateTimeLabel(pricePoint.observedAt);

  if (!priceText || priceValue === null || !observedDate) {
    return null;
  }

  return {
    id: pricePoint.id,
    observedAt: pricePoint.observedAt,
    observedDate,
    priceText,
    priceValue,
  };
}

export function discountLabel(coupon: CouponNode) {
  if (coupon.discountType === "AMOUNT" && coupon.discountValue && coupon.currency) {
    return `${coupon.discountValue} ${coupon.currency}`;
  }

  if (coupon.discountType === "PERCENT" && coupon.discountValue) {
    return `${coupon.discountValue}%`;
  }

  if (coupon.discountType === "FREE_SHIPPING") {
    return "Free shipping";
  }

  return null;
}

export function emptyCouponConnection(): ActiveCouponsConnection {
  return {
    edges: [],
    pageInfo: {
      hasNextPage: false,
    },
  };
}

export function emptyPriceHistoryConnection(): PriceHistoryConnection {
  return {
    edges: [],
    pageInfo: {
      hasNextPage: false,
    },
  };
}
