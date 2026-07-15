import { getOfferDiscoveryCardData } from "../../../src/routes/offers/offer-discovery-card-data";
import type {
  ActiveCouponsConnection,
  OfferNode,
  PriceHistoryConnection
} from "../../../src/routes/offers/offer-discovery-data";

test("preserves present empty labels while defaulting nullish product and merchant fields", () => {
  const emptyLabels = getOfferDiscoveryCardData(
    buildOffer({
      merchant: { id: "merchant-empty", name: "", domain: "" },
      product: { id: "product-empty", name: "", slug: "empty-product" }
    })
  );
  const missingLabels = getOfferDiscoveryCardData(
    buildOffer({ merchant: null, product: null })
  );

  expect(emptyLabels.productName).toBe("");
  expect(emptyLabels.summaryMerchantName).toBe("");
  expect(emptyLabels.merchantDomain).toBe("");
  expect(missingLabels.productName).toBe("Unknown product");
  expect(missingLabels.summaryMerchantName).toBe("Offer");
  expect(missingLabels.merchantDomain).toBeNull();
});

test.each([
  [true, "Active"],
  [false, "Inactive"]
])("uses canonical %s offer status copy", (isActive, statusLabel) => {
  expect(getOfferDiscoveryCardData(buildOffer({ isActive })).statusLabel).toBe(statusLabel);
});

test("formats valid latest prices and falls back only when the current formatter returns null", () => {
  expect(
    getOfferDiscoveryCardData(buildOffer({ latestPrice: buildLatestPrice("price-valid", "0") }))
      .latestPriceLabel
  ).toBe("0 USD");
  expect(getOfferDiscoveryCardData(buildOffer({ latestPrice: null })).latestPriceLabel).toBe(
    "No latest price."
  );
  expect(
    getOfferDiscoveryCardData(
      buildOffer({ latestPrice: buildLatestPrice("price-invalid", "") })
    ).latestPriceLabel
  ).toBe("No latest price.");
});

test("uses empty connections only for nullish values and keeps existing connection identity", () => {
  const coupons = buildCouponConnection([]);
  const priceHistory = buildPriceHistoryConnection([]);
  const existing = getOfferDiscoveryCardData(buildOffer({ activeCoupons: coupons, priceHistory }));
  const missing = getOfferDiscoveryCardData(
    buildOffer({ activeCoupons: null, priceHistory: null })
  );

  expect(existing.activeCoupons).toBe(coupons);
  expect(existing.priceHistory).toBe(priceHistory);
  expect(missing.activeCoupons).toEqual({ edges: [], pageInfo: { hasNextPage: false } });
  expect(missing.priceHistory).toEqual({ edges: [], pageInfo: { hasNextPage: false } });
});

test("keeps valid price-history rows in source order and leaves offer connections unchanged", () => {
  const priceHistory = buildPriceHistoryConnection([
    { node: { id: "valid-first", observedAt: "2026-05-30T10:00:00Z", price: "189.99" } },
    { node: { id: "invalid-price", observedAt: "2026-05-29T10:00:00Z", price: "" } },
    { node: { id: "invalid-date", observedAt: "not-a-date", price: "179.99" } },
    { node: { id: "valid-last", observedAt: "2026-05-28T10:00:00Z", price: "169.99" } }
  ]);
  const offer = buildOffer({ priceHistory });
  const originalEdges = [...priceHistory.edges];

  const data = getOfferDiscoveryCardData(offer);

  expect(data.priceHistoryRows).toEqual([
    {
      id: "valid-first",
      observedAt: "2026-05-30T10:00:00Z",
      observedDate: "2026-05-30",
      price: "189.99 USD"
    },
    {
      id: "valid-last",
      observedAt: "2026-05-28T10:00:00Z",
      observedDate: "2026-05-28",
      price: "169.99 USD"
    }
  ]);
  expect(offer.priceHistory).toBe(priceHistory);
  expect(priceHistory.edges).toEqual(originalEdges);
});

function buildOffer(overrides: Partial<OfferNode> = {}): OfferNode {
  return {
    id: "merchant-product-1",
    url: "https://merchant.example.com/detail-product",
    currency: "USD",
    lastSeenAt: "2026-06-02T12:00:00Z",
    isActive: true,
    merchant: { id: "merchant-1", name: "Acme Market", domain: "acme.example" },
    product: { id: "product-1", name: "Detail Product", slug: "detail-product" },
    latestPrice: buildLatestPrice("price-1", "199.99"),
    activeCoupons: buildCouponConnection([]),
    priceHistory: buildPriceHistoryConnection([]),
    ...overrides
  };
}

function buildLatestPrice(id: string, price: string): NonNullable<OfferNode["latestPrice"]> {
  return { id, price, observedAt: "2026-06-01T00:00:00Z" };
}

function buildCouponConnection(
  edges: ActiveCouponsConnection["edges"]
): ActiveCouponsConnection {
  return { edges, pageInfo: { hasNextPage: false } };
}

function buildPriceHistoryConnection(
  edges: PriceHistoryConnection["edges"]
): PriceHistoryConnection {
  return { edges, pageInfo: { hasNextPage: false } };
}
