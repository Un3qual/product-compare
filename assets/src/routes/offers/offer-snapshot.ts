export type OfferSnapshotSelectors<T> = {
  currency: (offer: T) => string | null;
  hasCoupons: (offer: T) => boolean;
  numericPrice: (offer: T) => number | null;
};

export type OfferSnapshotPriceState = "none" | "comparable" | "mixed";

export type OfferSnapshotSummary<T> = {
  couponAvailabilityCount: number;
  lowestPricedOffer: T | null;
  missingPriceCount: number;
  priceState: OfferSnapshotPriceState;
  visibleOfferCount: number;
};

export function buildOfferSnapshotSummary<T>(
  offers: readonly T[],
  selectors: OfferSnapshotSelectors<T>,
): OfferSnapshotSummary<T> {
  let couponAvailabilityCount = 0;
  let lowestPrice: number | null = null;
  let lowestPricedOffer: T | null = null;
  let missingPriceCount = 0;
  const currencies = new Set<string | null>();

  for (const offer of offers) {
    if (selectors.hasCoupons(offer)) {
      couponAvailabilityCount += 1;
    }

    const numericPrice = selectors.numericPrice(offer);

    if (numericPrice === null) {
      missingPriceCount += 1;
      continue;
    }

    currencies.add(selectors.currency(offer));

    if (lowestPrice === null || numericPrice < lowestPrice) {
      lowestPrice = numericPrice;
      lowestPricedOffer = offer;
    }
  }

  return {
    couponAvailabilityCount,
    lowestPricedOffer,
    missingPriceCount,
    priceState: lowestPricedOffer === null ? "none" : currencies.size > 1 ? "mixed" : "comparable",
    visibleOfferCount: offers.length,
  };
}
