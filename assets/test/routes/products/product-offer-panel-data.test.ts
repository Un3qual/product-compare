import { describe, expect, test } from "vitest";
import {
  buildProductOfferPanelData,
  productOfferPaginationPaths
} from "../../../src/routes/products/product-offer-panel-data";

describe("product offer panel data", () => {
  test("excludes unsafe destinations and uses the merchant fallback for visible offers", () => {
    const data = buildProductOfferPanelData({
      edges: [
        {
          node: {
            id: "unsafe-offer",
            // Inert security fixture passed to the offer URL validator and excluded.
            // skipcq: JS-0087
            url: "javascript:alert(1)",
            currency: "USD",
            merchant: { name: "Unsafe Store" },
            latestPrice: null,
            activeCoupons: null,
            priceHistory: null
          }
        },
        {
          node: {
            id: "fallback-offer",
            url: "https://merchant.example.com/product",
            currency: "USD",
            merchant: null,
            latestPrice: null,
            activeCoupons: null,
            priceHistory: null
          }
        }
      ],
      pageInfo: { endCursor: null, hasNextPage: false }
    });

    expect(data.offers).toHaveLength(1);
    expect(data.offers[0]).toMatchObject({
      id: "fallback-offer",
      merchantName: "Visit offer"
    });
  });

  test("validates prices and currencies before deriving visible price data", () => {
    const data = buildProductOfferPanelData({
      edges: [
        {
          node: {
            id: "numeric-price",
            url: "https://merchant.example.com/numeric",
            currency: "USD",
            merchant: { name: "Numeric Store" },
            latestPrice: { observedAt: "2026-07-01T12:00:00Z", price: 19.5 },
            activeCoupons: null,
            priceHistory: null
          }
        },
        {
          node: {
            id: "invalid-price",
            url: "https://merchant.example.com/invalid",
            currency: "USD",
            merchant: { name: "Invalid Store" },
            latestPrice: { observedAt: "not-a-date", price: "not-a-price" },
            activeCoupons: null,
            priceHistory: null
          }
        },
        {
          node: {
            id: "invalid-currency",
            url: "https://merchant.example.com/currency",
            currency: null,
            merchant: { name: "Currency Store" },
            latestPrice: { observedAt: "2026-07-01T12:00:00Z", price: "20.00" },
            activeCoupons: null,
            priceHistory: null
          }
        }
      ],
      pageInfo: { endCursor: null, hasNextPage: false }
    });

    expect(data.offers).toMatchObject([
      {
        id: "numeric-price",
        currency: "USD",
        numericPrice: 19.5,
        priceText: "19.50 USD",
        priceObservation: { dateTime: "2026-07-01T12:00:00Z", label: "2026-07-01" }
      },
      {
        id: "invalid-price",
        currency: "USD",
        numericPrice: null,
        priceText: null,
        priceObservation: null
      },
      {
        id: "invalid-currency",
        currency: null,
        numericPrice: 20,
        priceText: null
      }
    ]);
    expect(data.snapshot).toEqual({
      couponAvailabilityText: "0 offers with coupons",
      lowestVisiblePriceText: "19.50 USD at Numeric Store",
      missingLatestPriceText: "2 offers",
      visibleOfferCount: 3
    });
  });

  test("builds coupon and price history rows only from valid display values", () => {
    const data = buildProductOfferPanelData({
      edges: [
        {
          node: {
            id: "offer-1",
            url: "https://merchant.example.com/product",
            currency: "USD",
            merchant: { name: "Acme" },
            latestPrice: null,
            activeCoupons: {
              edges: [
                {
                  cursor: "shipping",
                  node: {
                    code: "SHIPFREE",
                    description: null,
                    discountType: "FREE_SHIPPING",
                    discountValue: null,
                    currency: null,
                    validTo: "2026-08-01T00:00:00Z",
                    terms: null
                  }
                },
                {
                  cursor: "percent",
                  node: {
                    code: "SAVE15",
                    description: "Save fifteen percent.",
                    discountType: "PERCENT",
                    discountValue: " 15 ",
                    currency: null,
                    validTo: "invalid-date",
                    terms: "Online only."
                  }
                },
                {
                  cursor: "amount",
                  node: {
                    code: "SAVE10",
                    description: null,
                    discountType: "AMOUNT",
                    discountValue: 10,
                    currency: "USD",
                    validTo: null,
                    terms: null
                  }
                },
                {
                  cursor: "invalid",
                  node: {
                    code: "UNKNOWN",
                    description: null,
                    discountType: "UNSUPPORTED",
                    discountValue: "10",
                    currency: "USD",
                    validTo: null,
                    terms: null
                  }
                }
              ],
              pageInfo: { hasNextPage: true }
            },
            priceHistory: {
              edges: [
                {
                  node: {
                    id: "price-valid",
                    price: "24.00",
                    observedAt: "2026-06-01T00:00:00Z"
                  }
                },
                {
                  node: {
                    id: "price-invalid-date",
                    price: "20.00",
                    observedAt: "invalid-date"
                  }
                },
                {
                  node: {
                    id: "price-invalid-value",
                    price: "not-a-price",
                    observedAt: "2026-05-01T00:00:00Z"
                  }
                }
              ],
              pageInfo: { hasNextPage: true }
            }
          }
        }
      ],
      pageInfo: { endCursor: null, hasNextPage: false }
    });

    expect(data.offers[0]).toMatchObject({
      coupons: [
        {
          code: "SHIPFREE",
          discountText: "Free shipping",
          validToText: "Valid through 2026-08-01"
        },
        { code: "SAVE15", discountText: "15%", validToText: null },
        { code: "SAVE10", discountText: "10 USD", validToText: null },
        { code: "UNKNOWN", discountText: null, validToText: null }
      ],
      couponsHasMore: true,
      priceHistory: [
        {
          id: "price-valid",
          observedAt: "2026-06-01T00:00:00Z",
          observedDate: "2026-06-01",
          priceText: "24.00 USD"
        }
      ],
      priceHistoryHasMore: true
    });
  });

  test("reports mixed-currency snapshots and preserves compare-slug order in first and next paths", () => {
    const data = buildProductOfferPanelData({
      edges: [
        {
          node: {
            id: "usd-offer",
            url: "https://merchant.example.com/usd",
            currency: "USD",
            merchant: { name: "US Store" },
            latestPrice: { observedAt: "2026-07-01T00:00:00Z", price: "10.00" },
            activeCoupons: null,
            priceHistory: null
          }
        },
        {
          node: {
            id: "cad-offer",
            url: "https://merchant.example.com/cad",
            currency: "CAD",
            merchant: { name: "Canada Store" },
            latestPrice: { observedAt: "2026-07-01T00:00:00Z", price: "9.00" },
            activeCoupons: null,
            priceHistory: null
          }
        }
      ],
      pageInfo: { endCursor: "next cursor&value", hasNextPage: true }
    });

    expect(data.snapshot.lowestVisiblePriceText).toBe("Multiple currencies");
    expect(
      productOfferPaginationPaths({
        connection: {
          pageInfo: { endCursor: "next cursor&value", hasNextPage: true }
        },
        offersAfter: "current/page+value",
        productSlug: "detail/product?value",
        selectedCompareSlugs: ["first product", "second&product"]
      })
    ).toEqual({
      firstPath:
        "/products/detail%2Fproduct%3Fvalue?slug=first+product&slug=second%26product#offers",
      nextPath:
        "/products/detail%2Fproduct%3Fvalue?offersAfter=next+cursor%26value&slug=first+product&slug=second%26product#offers"
    });
  });
});
