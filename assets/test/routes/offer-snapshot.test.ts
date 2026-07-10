import {
  buildOfferSnapshotSummary,
  type OfferSnapshotSelectors
} from "../../src/routes/offer-snapshot";

type TestOffer = {
  currency: string | null;
  hasCoupons: boolean;
  id: string;
  price: number | null;
};

const selectors: OfferSnapshotSelectors<TestOffer> = {
  currency: (offer) => offer.currency,
  hasCoupons: (offer) => offer.hasCoupons,
  numericPrice: (offer) => offer.price
};

test("summarizes an empty offer page", () => {
  expect(buildOfferSnapshotSummary([], selectors)).toEqual({
    couponAvailabilityCount: 0,
    lowestPricedOffer: null,
    missingPriceCount: 0,
    priceState: "none",
    visibleOfferCount: 0
  });
});

test("summarizes comparable offers in one pass", () => {
  const expensive = { id: "expensive", currency: "USD", price: 20, hasCoupons: true };
  const budget = { id: "budget", currency: "USD", price: 10, hasCoupons: false };
  const missing = { id: "missing", currency: null, price: null, hasCoupons: true };

  expect(buildOfferSnapshotSummary([expensive, budget, missing], selectors)).toEqual({
    couponAvailabilityCount: 2,
    lowestPricedOffer: budget,
    missingPriceCount: 1,
    priceState: "comparable",
    visibleOfferCount: 3
  });
});

test("refuses comparison across visible currencies", () => {
  const usd = { id: "usd", currency: "USD", price: 20, hasCoupons: false };
  const eur = { id: "eur", currency: "EUR", price: 10, hasCoupons: false };

  expect(buildOfferSnapshotSummary([usd, eur], selectors)).toMatchObject({
    lowestPricedOffer: eur,
    priceState: "mixed"
  });
});
