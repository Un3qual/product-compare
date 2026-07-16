import {
  emptyCouponConnection,
  emptyPriceHistoryConnection,
  priceHistoryRow,
  priceLabel,
  type ActiveCouponsConnection,
  type OfferNode,
  type PriceHistoryConnection,
  type PriceHistoryRow
} from "./offer-discovery-data";

export type OfferDiscoveryCardData = {
  activeCoupons: ActiveCouponsConnection;
  latestPriceLabel: string;
  merchantDomain: string | null;
  priceHistory: PriceHistoryConnection;
  priceHistoryRows: PriceHistoryRow[];
  productName: string;
  status:
    | { label: "Active"; tone: "positive" }
    | { label: "Inactive"; tone: "neutral" };
  summaryMerchantName: string;
};

export function getOfferDiscoveryCardData(offer: OfferNode): OfferDiscoveryCardData {
  const priceHistory = offer.priceHistory ?? emptyPriceHistoryConnection();

  return {
    activeCoupons: offer.activeCoupons ?? emptyCouponConnection(),
    latestPriceLabel: priceLabel(offer.latestPrice?.price, offer.currency) ?? "No latest price.",
    merchantDomain: offer.merchant?.domain ?? null,
    priceHistory,
    priceHistoryRows: priceHistory.edges
      .map(({ node }) => priceHistoryRow(node, offer.currency))
      .filter((row): row is PriceHistoryRow => row !== null),
    productName: offer.product?.name ?? "Unknown product",
    status: offer.isActive
      ? { label: "Active", tone: "positive" }
      : { label: "Inactive", tone: "neutral" },
    summaryMerchantName: offer.merchant?.name ?? "Offer"
  };
}
