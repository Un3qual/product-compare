export const OFFER_PRODUCT_ID = "product-kettle";

export function offerResponders() {
  return new Map([
    ["RootRouteQuery", { data: { viewer: null } }],
    [
      "OfferDiscoveryRouteQuery",
      {
        data: {
          selectedProduct: {
            __typename: "Product",
            brand: { id: "brand-brewmaster", name: "BrewMaster" },
            id: OFFER_PRODUCT_ID,
            name: "BrewMaster Precision Kettle",
            slug: "brewmaster-precision-kettle",
          },
          merchantProducts: offerConnection([
            offer({
              id: "offer-kitchen-supply",
              merchant: merchantFixture(
                "merchant-kitchen-supply",
                "Kitchen Supply",
                "kitchen.example",
              ),
              price: "129.99",
              coupons: [
                {
                  cursor: "coupon-1",
                  node: {
                    code: "BREW15",
                    currency: null,
                    description: "Save 15% on countertop appliances.",
                    discountType: "PERCENT",
                    discountValue: "15",
                    terms: "Online orders only; exclusions may apply.",
                    validTo: "2026-08-31T23:59:59Z",
                  },
                },
              ],
              history: [
                { id: "history-1", observedAt: "2026-08-09T12:00:00Z", price: "134.99" },
                { id: "history-2", observedAt: "2026-08-02T12:00:00Z", price: "139.99" },
              ],
            }),
            offer({
              id: "offer-coffee-tools",
              merchant: merchantFixture(
                "merchant-coffee-tools",
                "Coffee Tools",
                "coffee-tools.example",
              ),
              price: "136.50",
            }),
            offer({
              id: "offer-brew-market",
              merchant: merchantFixture(
                "merchant-brew-market",
                "Brew Market",
                "brew-market.example",
              ),
              price: null,
            }),
          ]),
        },
      },
    ],
  ]);
}

function offer({
  coupons = [],
  history = [],
  id,
  merchant,
  price,
}: {
  coupons?: Array<{
    cursor: string;
    node: {
      code: string;
      currency: string | null;
      description: string;
      discountType: string;
      discountValue: string;
      terms: string;
      validTo: string;
    };
  }>;
  history?: Array<{ id: string; observedAt: string; price: string }>;
  id: string;
  merchant: ReturnType<typeof merchantFixture>;
  price: string | null;
}) {
  return {
    activeCoupons: {
      edges: coupons,
      pageInfo: { hasNextPage: false },
    },
    currency: "USD",
    id,
    isActive: true,
    lastSeenAt: "2026-08-10T12:00:00Z",
    latestPrice: price ? { id: `${id}-price`, observedAt: "2026-08-10T10:30:00Z", price } : null,
    merchant,
    priceHistory: {
      edges: history.map((node) => ({ node })),
      pageInfo: { hasNextPage: history.length > 1 },
    },
    product: {
      id: OFFER_PRODUCT_ID,
      name: "BrewMaster Precision Kettle",
      slug: "brewmaster-precision-kettle",
    },
    url: `https://${merchant.domain}/products/brewmaster-precision-kettle`,
  };
}

function merchantFixture(id: string, name: string, domain: string) {
  return { domain, id, name };
}

function offerConnection(nodes: ReturnType<typeof offer>[]) {
  return {
    edges: nodes.map((node, index) => ({ cursor: `offer-cursor-${index + 1}`, node })),
    pageInfo: {
      endCursor: nodes.length > 0 ? `offer-cursor-${nodes.length}` : null,
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: nodes.length > 0 ? "offer-cursor-1" : null,
    },
  };
}
