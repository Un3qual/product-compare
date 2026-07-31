import { nextRelayPageCursor } from "../../relay-pagination";

export type MerchantDetailViewDataInput = {
  slug: string;
  detailSummary: {
    activeOfferCount: number;
    distinctProductCount: number;
    eligibleOfferCount: number;
    freshOfferCount: number;
    agingOfferCount: number;
    staleOfferCount: number;
    unobservedOfferCount: number;
    lastObservedAt?: string | null;
  };
  merchantProducts: {
    edges: ReadonlyArray<{
      node: {
        id: string;
        currency: string;
        product?: { name: string; slug: string } | null;
        latestPrice?: {
          price: string;
          shipping?: string | null;
          inStock?: boolean | null;
        } | null;
      };
    }>;
    pageInfo: {
      hasNextPage: boolean;
      endCursor?: string | null;
    };
  };
};

export function getMerchantDetailViewData(
  merchant: MerchantDetailViewDataInput,
  currentAfter: string | null = null,
) {
  const { detailSummary } = merchant;

  return {
    summaryItems: [
      { label: "Active offers", value: detailSummary.activeOfferCount },
      { label: "Products", value: detailSummary.distinctProductCount },
      { label: "Eligible landed prices", value: detailSummary.eligibleOfferCount },
      { label: "Fresh observations", value: detailSummary.freshOfferCount },
    ],
    observation: {
      lastObservedAt: detailSummary.lastObservedAt ?? null,
      leadCopy: detailSummary.lastObservedAt
        ? "Latest captured observation"
        : "No offer observations are available yet.",
      freshnessCopy: `${detailSummary.agingOfferCount} aging, ${detailSummary.staleOfferCount} stale, and ${detailSummary.unobservedOfferCount} unobserved active offers.`,
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
  latestPrice: MerchantDetailViewDataInput["merchantProducts"]["edges"][number]["node"]["latestPrice"],
) {
  if (!latestPrice) return "No price observation yet.";

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

function merchantNextPagePath(merchant: MerchantDetailViewDataInput, currentAfter: string | null) {
  const nextCursor = nextRelayPageCursor(merchant.merchantProducts.pageInfo, currentAfter);

  return nextCursor
    ? `/merchants/${encodeURIComponent(merchant.slug)}?after=${encodeURIComponent(nextCursor)}`
    : null;
}
