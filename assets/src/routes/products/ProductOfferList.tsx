import { TrackedCommerceClickAction } from "../offers/TrackedCommerceClickAction";
import type {
  ProductOfferCouponRow,
  ProductOfferListItem,
  ProductOfferPriceHistoryRow,
} from "./product-offer-panel-data";

export type {
  ProductOfferCouponRow,
  ProductOfferListItem,
  ProductOfferPriceHistoryRow,
} from "./product-offer-panel-data";

export function ProductOfferList({ offers }: { offers: ReadonlyArray<ProductOfferListItem> }) {
  return (
    <ul aria-label="Active offer list">
      {offers.map((offer) => (
        <li key={offer.id}>
          <TrackedCommerceClickAction label={offer.merchantName} merchantProductId={offer.id} />
          {offer.priceText ? <p>{offer.priceText}</p> : null}
          {offer.priceObservation ? (
            <p>
              Price observed{" "}
              <time dateTime={offer.priceObservation.dateTime}>{offer.priceObservation.label}</time>
            </p>
          ) : null}
          <OfferPriceHistory
            merchantName={offer.merchantName}
            historyRows={offer.priceHistory}
            hasMore={offer.priceHistoryHasMore}
          />
          <OfferCoupons
            merchantName={offer.merchantName}
            coupons={offer.coupons}
            hasMore={offer.couponsHasMore}
          />
        </li>
      ))}
    </ul>
  );
}

function OfferPriceHistory({
  merchantName,
  historyRows,
  hasMore,
}: {
  merchantName: string;
  historyRows: ReadonlyArray<ProductOfferPriceHistoryRow>;
  hasMore: boolean;
}) {
  if (historyRows.length === 0) {
    return <p>No price history for this offer yet.</p>;
  }

  return (
    <section>
      <h3>Price history</h3>
      <ul aria-label={`${merchantName} price history`}>
        {historyRows.map((row) => (
          <li key={row.id}>
            <time dateTime={row.observedAt}>{row.observedDate}</time>
            <span>{row.priceText}</span>
          </li>
        ))}
      </ul>
      {hasMore ? <p>More price history available.</p> : null}
    </section>
  );
}

function OfferCoupons({
  merchantName,
  coupons,
  hasMore,
}: {
  merchantName: string;
  coupons: ReadonlyArray<ProductOfferCouponRow>;
  hasMore: boolean;
}) {
  if (coupons.length === 0) {
    return <p>No active coupons for this offer.</p>;
  }

  return (
    <>
      <ul aria-label={`${merchantName} active coupons`}>
        {coupons.map((coupon) => (
          <li key={coupon.key}>
            <strong>{coupon.code}</strong>
            {coupon.description ? <p>{coupon.description}</p> : null}
            {coupon.discountText ? <p>{coupon.discountText}</p> : null}
            {coupon.validToText ? <p>{coupon.validToText}</p> : null}
            {coupon.terms ? <p>{coupon.terms}</p> : null}
          </li>
        ))}
      </ul>
      {hasMore ? <p>More coupons available.</p> : null}
    </>
  );
}
