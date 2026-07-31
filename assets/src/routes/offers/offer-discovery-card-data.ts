import {
  emptyCouponConnection,
  emptyPriceHistoryConnection,
  priceHistoryRow,
  priceLabel,
  type ActiveCouponsConnection,
  type OfferNode,
  type PriceHistoryConnection,
  type PriceHistoryRow,
} from "./offer-discovery-data";

export type OfferDiscoveryCardData = {
  activeCoupons: ActiveCouponsConnection;
  latestPriceLabel: string;
  merchantDomain: string | null;
  priceHistory: PriceHistoryConnection;
  priceHistoryRows: PriceHistoryRow[];
  productName: string;
  status: { label: "Active"; tone: "positive" } | { label: "Inactive"; tone: "neutral" };
  summaryMerchantName: string;
};

export function getOfferDiscoveryCardData(offer: OfferNode): OfferDiscoveryCardData {
  const priceHistory = offer.priceHistory ?? emptyPriceHistoryConnection();

  return {
    activeCoupons: offer.activeCoupons ?? emptyCouponConnection(),
    latestPriceLabel: offerLatestPriceLabel(offer),
    ...offerIdentity(offer),
    priceHistory,
    priceHistoryRows: offerPriceHistoryRows(priceHistory, offer.currency),
    status: offerStatus(offer.isActive),
  };
}

function offerLatestPriceLabel(offer: OfferNode) {
  return priceLabel(offer.latestPrice?.price, offer.currency) ?? "No latest price.";
}

function offerIdentity(offer: OfferNode) {
  return {
    merchantDomain: offer.merchant?.domain ?? null,
    productName: offer.product?.name ?? "Unknown product",
    summaryMerchantName: offer.merchant?.name ?? "Offer",
  };
}

function offerPriceHistoryRows(priceHistory: PriceHistoryConnection, currency: string) {
  return priceHistory.edges
    .map(({ node }) => priceHistoryRow(node, currency))
    .filter((row): row is PriceHistoryRow => row !== null);
}

function offerStatus(isActive: boolean): OfferDiscoveryCardData["status"] {
  return isActive ? { label: "Active", tone: "positive" } : { label: "Inactive", tone: "neutral" };
}
