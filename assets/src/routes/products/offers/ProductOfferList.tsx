import { useId } from "react";
import { create, props } from "@stylexjs/stylex";
import { DataList, DataListItem } from "$ui/components/data/DataList";
import { PriceHistoryChart } from "$ui/components/data/PriceHistoryChart";
import { RelativeDateTime } from "$ui/components/data";
import { Badge } from "$ui/primitives/Badge";
import { tokens } from "$ui/theme/tokens.stylex";
import { TrackedCommerceClickAction } from "../../offers/commerce-click";
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

const styles = create({
  offer: {
    display: "grid",
    gap: "1.25rem",
  },
  offerHeader: {
    alignItems: "start",
    display: "grid",
    gap: "0.75rem 1rem",
    gridTemplateColumns: {
      default: "minmax(0, 1fr) auto",
      "@media (max-width: 40rem)": "minmax(0, 1fr)",
    },
  },
  offerIdentity: {
    display: "grid",
    gap: "0.2rem",
    minWidth: 0,
  },
  offerEyebrow: {
    color: tokens.textSecondary,
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    margin: 0,
    textTransform: "uppercase",
  },
  merchantName: {
    fontSize: "1.35rem",
    letterSpacing: "-0.02em",
    margin: 0,
  },
  decision: {
    alignItems: "end",
    borderBlockColor: tokens.borderQuiet,
    borderBlockStyle: "solid",
    borderBlockWidth: "1px",
    display: "grid",
    gap: "0.75rem 1.5rem",
    gridTemplateColumns: {
      default: "minmax(0, 1fr) auto",
      "@media (max-width: 40rem)": "minmax(0, 1fr)",
    },
    paddingBlock: "1rem",
  },
  decisionPrimary: {
    display: "grid",
    gap: "0.25rem",
  },
  decisionLabel: {
    color: tokens.textSecondary,
    fontSize: "0.75rem",
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  price: {
    color: tokens.text,
    fontSize: "1.65rem",
    fontWeight: 750,
    letterSpacing: "-0.025em",
    lineHeight: 1.15,
  },
  observation: {
    color: tokens.textSecondary,
    display: "flex",
    flexWrap: "wrap",
    fontSize: "0.84rem",
    gap: "0.3rem",
    margin: 0,
  },
  evidence: {
    display: "grid",
    gap: "1.25rem 2rem",
    gridTemplateColumns: {
      default: "repeat(2, minmax(0, 1fr))",
      "@media (max-width: 46rem)": "minmax(0, 1fr)",
    },
  },
  evidenceSection: {
    display: "grid",
    gap: "0.75rem",
    minWidth: 0,
  },
  couponSection: {
    borderInlineStartColor: {
      default: tokens.borderQuiet,
      "@media (max-width: 46rem)": "transparent",
    },
    borderInlineStartStyle: "solid",
    borderInlineStartWidth: "1px",
    borderBlockStartColor: {
      default: "transparent",
      "@media (max-width: 46rem)": tokens.borderQuiet,
    },
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "1px",
    paddingInlineStart: {
      default: "2rem",
      "@media (max-width: 46rem)": 0,
    },
    paddingBlockStart: {
      default: 0,
      "@media (max-width: 46rem)": "1.25rem",
    },
  },
  evidenceTitle: {
    fontSize: "0.82rem",
    fontWeight: 700,
    letterSpacing: "0.06em",
    margin: 0,
    textTransform: "uppercase",
  },
  detailList: {
    display: "grid",
    gap: 0,
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  coupon: {
    borderBlockEndColor: tokens.borderQuiet,
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
    display: "grid",
    gap: "0.45rem",
    paddingBlock: "0.65rem",
  },
  couponHeader: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem 0.75rem",
    justifyContent: "space-between",
  },
  couponDiscount: {
    fontSize: "1rem",
  },
  detailText: {
    lineHeight: 1.5,
    margin: 0,
  },
  supportingText: {
    color: tokens.textSecondary,
    fontSize: "0.84rem",
    lineHeight: 1.45,
    margin: 0,
  },
});

export function ProductOfferList({
  offers,
  referenceTime,
}: {
  offers: ReadonlyArray<ProductOfferListItem>;
  referenceTime?: string;
}) {
  return (
    <DataList label="Active offer list">
      {offers.map((offer) => (
        <DataListItem key={offer.id}>
          <ProductOfferRow offer={offer} referenceTime={referenceTime} />
        </DataListItem>
      ))}
    </DataList>
  );
}

function ProductOfferRow({
  offer,
  referenceTime,
}: {
  offer: ProductOfferListItem;
  referenceTime?: string;
}) {
  const headingId = useId();

  return (
    <article aria-labelledby={headingId} {...props(styles.offer)}>
      <header {...props(styles.offerHeader)}>
        <div {...props(styles.offerIdentity)}>
          <p {...props(styles.offerEyebrow)}>Merchant offer</p>
          <h3 id={headingId} {...props(styles.merchantName)}>
            {offer.merchantName}
          </h3>
        </div>
        <TrackedCommerceClickAction
          label={
            offer.merchantName === "Visit offer" ? "Visit offer" : `Visit ${offer.merchantName}`
          }
          merchantProductId={offer.id}
        />
      </header>
      <div data-slot="product-offer-decision" {...props(styles.decision)}>
        <div {...props(styles.decisionPrimary)}>
          <span {...props(styles.decisionLabel)}>Current price</span>
          <strong {...props(styles.price)}>{offer.priceText ?? "Price unavailable"}</strong>
        </div>
        {offer.priceObservation ? (
          <p {...props(styles.observation)}>
            {referenceTime ? (
              <RelativeDateTime
                prefix="Price observed"
                referenceTime={referenceTime}
                value={offer.priceObservation.dateTime}
              />
            ) : (
              <>
                <span>Price observed</span>{" "}
                <time dateTime={offer.priceObservation.dateTime}>
                  {offer.priceObservation.label}
                </time>
              </>
            )}
          </p>
        ) : null}
      </div>
      <div {...props(styles.evidence)}>
        <OfferPriceHistory
          hasMore={offer.priceHistoryHasMore}
          historyRows={offer.priceHistory}
          merchantName={offer.merchantName}
        />
        <OfferCoupons
          coupons={offer.coupons}
          hasMore={offer.couponsHasMore}
          merchantName={offer.merchantName}
        />
      </div>
    </article>
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
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} {...props(styles.evidenceSection)}>
      <h4 id={titleId} {...props(styles.evidenceTitle)}>
        Price history
      </h4>
      {historyRows.length === 0 ? (
        <p {...props(styles.supportingText)}>No price history for this offer yet.</p>
      ) : (
        <PriceHistoryChart label={`${merchantName} price history`} rows={historyRows} />
      )}
      {hasMore ? <p {...props(styles.supportingText)}>More price history available.</p> : null}
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
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} {...props(styles.evidenceSection, styles.couponSection)}>
      <h4 id={titleId} {...props(styles.evidenceTitle)}>
        Coupons
      </h4>
      {coupons.length === 0 ? (
        <p {...props(styles.supportingText)}>No active coupons for this offer.</p>
      ) : (
        <ul aria-label={`${merchantName} active coupons`} {...props(styles.detailList)}>
          {coupons.map((coupon) => (
            <li key={coupon.key} {...props(styles.coupon)}>
              <div {...props(styles.couponHeader)}>
                <Badge variant="secondary">{coupon.code}</Badge>
                {coupon.discountText ? (
                  <strong {...props(styles.couponDiscount)}>{coupon.discountText}</strong>
                ) : null}
              </div>
              {coupon.description ? (
                <p {...props(styles.detailText)}>{coupon.description}</p>
              ) : null}
              {coupon.validToText ? (
                <p {...props(styles.supportingText)}>{coupon.validToText}</p>
              ) : null}
              {coupon.terms ? <p {...props(styles.supportingText)}>{coupon.terms}</p> : null}
            </li>
          ))}
        </ul>
      )}
      {hasMore ? <p {...props(styles.supportingText)}>More coupons available.</p> : null}
    </section>
  );
}
