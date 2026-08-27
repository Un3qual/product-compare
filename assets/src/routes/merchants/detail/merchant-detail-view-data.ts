import type { MerchantDetailRouteQuery } from "$generated/MerchantDetailRouteQuery.graphql";
import { nextPageCursor } from "$relay/pagination";

export function getMerchantDetailViewData(
  merchant: NonNullable<MerchantDetailRouteQuery["response"]["merchant"]>,
  currentAfter: string | null = null,
) {
  const { detailSummary } = merchant;

  return {
    summaryItems: [
      { label: "Active offers", value: detailSummary.activeOfferCount },
      { label: "Products", value: detailSummary.distinctProductCount },
      { label: "Offers with complete prices", value: detailSummary.eligibleOfferCount },
      { label: "Recently checked offers", value: detailSummary.freshOfferCount },
    ],
    observation: {
      lastObservedAt: detailSummary.lastObservedAt,
      leadCopy: detailSummary.lastObservedAt
        ? "Prices last checked"
        : "No offer prices have been checked yet.",
      freshnessCopy: `${detailSummary.agingOfferCount} need a refresh, ${detailSummary.staleOfferCount} are out of date, and ${detailSummary.unobservedOfferCount} have not been checked.`,
    },
    offerRows: merchant.merchantProducts.edges.map(({ node }) => ({
      id: node.id,
      product: node.product
        ? { name: node.product.name, path: merchantProductPath(node.product.slug) }
        : null,
      priceCopy: offerPriceCopy(node.currency, node.latestPrice),
    })),
    nextPagePath: merchantNextPagePath(merchant, currentAfter),
  };
}

function offerPriceCopy(
  currency: string,
  latestPrice: NonNullable<
    MerchantDetailRouteQuery["response"]["merchant"]
  >["merchantProducts"]["edges"][number]["node"]["latestPrice"],
) {
  if (!latestPrice) return "No current price available.";

  const shippingCopy =
    latestPrice.shipping == null ? " plus unknown shipping" : ` + ${latestPrice.shipping} shipping`;
  const stockCopy =
    latestPrice.inStock === false
      ? "Out of stock"
      : latestPrice.inStock === true
        ? "In stock"
        : "Stock unknown";

  return `${latestPrice.price} ${currency}${shippingCopy} · ${stockCopy}`;
}

function merchantProductPath(slug: string) {
  return `/products/${encodeURIComponent(slug)}`;
}

function merchantNextPagePath(
  merchant: NonNullable<MerchantDetailRouteQuery["response"]["merchant"]>,
  currentAfter: string | null,
) {
  const nextCursor = nextPageCursor(merchant.merchantProducts.pageInfo, currentAfter);

  return nextCursor
    ? `/merchants/${encodeURIComponent(merchant.slug)}?after=${encodeURIComponent(nextCursor)}`
    : null;
}
