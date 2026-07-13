import { create, props } from "@stylexjs/stylex";
import { StatusBadge } from "../../ui/components/status/StatusBadge";
import { tokens } from "../../ui/theme/tokens.stylex";
import { externalHttpUrlHref } from "../external-links";
import { graphQLDateTimeContext } from "../graphql-datetime";
import {
  discountLabel,
  emptyCouponConnection,
  emptyPriceHistoryConnection,
  offerMerchantName,
  priceLabel,
  priceHistoryRow,
  type ActiveCouponsConnection,
  type CouponNode,
  type OfferNode,
  type PriceHistoryConnection,
  type PriceHistoryRow
} from "./offer-discovery-data";
import { TrackedCommerceClickAction } from "./TrackedCommerceClickAction";

type CouponEdge = ActiveCouponsConnection["edges"][number];

const styles = create({
  offer: {
    display: "grid",
    gap: "1rem"
  },
  offerHeader: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem",
    justifyContent: "space-between"
  },
  offerTitle: {
    fontSize: "1.2rem",
    letterSpacing: "-0.02em",
    margin: 0
  },
  price: {
    color: tokens.text,
    fontSize: "1.35rem",
    fontWeight: 750,
    margin: 0
  },
  muted: {
    color: tokens.textSecondary,
    margin: 0
  },
  offerDecision: {
    alignItems: "start",
    display: "grid",
    gap: "1rem 2rem",
    gridTemplateColumns: {
      default: "minmax(0, 1fr) minmax(9rem, auto)",
      "@media (max-width: 42rem)": "minmax(0, 1fr)"
    }
  },
  merchantContext: {
    display: "grid",
    gap: "0.55rem"
  },
  priceContext: {
    display: "grid",
    gap: "0.55rem",
    justifyItems: {
      default: "end",
      "@media (max-width: 42rem)": "start"
    }
  },
  supportingDetail: {
    borderBlockStartColor: tokens.borderQuiet,
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "1px",
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: {
      default: "repeat(2, minmax(0, 1fr))",
      "@media (max-width: 42rem)": "minmax(0, 1fr)"
    },
    paddingBlockStart: "1rem"
  }
});

export function OfferDiscoveryCard({
  offer,
  highlightLabel
}: {
  offer: OfferNode;
  highlightLabel: string | null;
}) {
  const priceHistory = priceHistoryConnection(offer.priceHistory);
  const activeCoupons = couponConnection(offer.activeCoupons);
  const merchantName = offerMerchantName(offer.merchant);

  return (
    <article {...props(styles.offer)}>
      <OfferCardHeader
        isActive={offer.isActive}
        productName={offerProductName(offer.product)}
      />
      <OfferDecisionContext
        highlightLabel={highlightLabel}
        merchantName={merchantName}
        offer={offer}
      />
      <OfferSupportingDetail
        activeCoupons={activeCoupons}
        offer={offer}
        priceHistory={priceHistory}
      />
    </article>
  );
}

function OfferDecisionContext({
  highlightLabel,
  merchantName,
  offer
}: {
  highlightLabel: string | null;
  merchantName: string;
  offer: OfferNode;
}) {
  return (
    <div {...props(styles.offerDecision)}>
      <section aria-label="Merchant and availability" {...props(styles.merchantContext)}>
        <OfferMerchantAction
          isActive={offer.isActive}
          merchantName={merchantName}
          merchantProductId={offer.id}
          merchantUrl={offer.url}
        />
        <OfferMerchantDomain domain={offerMerchantDomain(offer.merchant)} />
        <OfferObservationContext offer={offer} />
      </section>
      <section aria-label="Current price" {...props(styles.priceContext)}>
        {highlightLabel ? <StatusBadge tone="accent">{highlightLabel}</StatusBadge> : null}
        <p {...props(styles.price)}>{offerLatestPriceLabel(offer)}</p>
      </section>
    </div>
  );
}

function OfferSupportingDetail({
  activeCoupons,
  offer,
  priceHistory
}: {
  activeCoupons: ReturnType<typeof couponConnection>;
  offer: OfferNode;
  priceHistory: ReturnType<typeof priceHistoryConnection>;
}) {
  const merchantName = offerSummaryMerchantName(offer.merchant);

  return (
    <div {...props(styles.supportingDetail)}>
      <PriceHistorySummary
        hasMore={priceHistory.pageInfo.hasNextPage}
        merchantName={merchantName}
        rows={offerPriceHistoryRows(priceHistory, offer.currency)}
      />
      <CouponSummary
        couponEdges={activeCoupons.edges}
        hasMore={activeCoupons.pageInfo.hasNextPage}
        merchantName={merchantName}
      />
    </div>
  );
}

function OfferCardHeader({
  isActive,
  productName
}: {
  isActive: boolean;
  productName: string;
}) {
  return (
    <header {...props(styles.offerHeader)}>
      <h2 {...props(styles.offerTitle)}>{productName}</h2>
      <StatusBadge tone={isActive ? "positive" : "neutral"}>
        {offerStatusLabel(isActive)}
      </StatusBadge>
    </header>
  );
}

function OfferMerchantAction({
  isActive,
  merchantProductId,
  merchantUrl,
  merchantName
}: {
  isActive: boolean;
  merchantProductId: string;
  merchantUrl: string;
  merchantName: string;
}) {
  if (isActive && merchantProductId) {
    return (
      <div>
        <TrackedCommerceClickAction
          label={merchantName}
          merchantProductId={merchantProductId}
        />
      </div>
    );
  }

  const directMerchantHref = externalHttpUrlHref(merchantUrl);

  if (!directMerchantHref) {
    return null;
  }

  return (
    <div>
      <a href={directMerchantHref}>{merchantName}</a>
    </div>
  );
}

function OfferMerchantDomain({ domain }: { domain: string | null }) {
  if (!domain) {
    return null;
  }

  return <p {...props(styles.muted)}>{domain}</p>;
}

function OfferObservationContext({ offer }: { offer: OfferNode }) {
  const offerCheckedAt = graphQLDateTimeContext(offer.lastSeenAt);
  const priceObservedAt = graphQLDateTimeContext(offer.latestPrice?.observedAt);

  if (!offerCheckedAt && !priceObservedAt) {
    return null;
  }

  return (
    <>
      {offerCheckedAt ? (
        <p>
          Offer checked <time dateTime={offerCheckedAt.dateTime}>{offerCheckedAt.label}</time>
        </p>
      ) : null}
      {priceObservedAt ? (
        <p>
          Price observed <time dateTime={priceObservedAt.dateTime}>{priceObservedAt.label}</time>
        </p>
      ) : null}
    </>
  );
}

function offerProductName(product: OfferNode["product"]) {
  return product?.name ?? "Unknown product";
}

function offerStatusLabel(isActive: boolean) {
  return isActive ? "Active" : "Inactive";
}

function offerSummaryMerchantName(merchant: OfferNode["merchant"]) {
  return merchant?.name ?? "Offer";
}

function offerMerchantDomain(merchant: OfferNode["merchant"]) {
  return merchant?.domain ?? null;
}

function offerLatestPriceLabel(offer: OfferNode) {
  return priceLabel(offer.latestPrice?.price, offer.currency) ?? "No latest price.";
}

function offerPriceHistoryRows(priceHistory: PriceHistoryConnection, currency: string) {
  return priceHistory.edges
    .map(({ node }) => priceHistoryRow(node, currency))
    .filter((row): row is PriceHistoryRow => row !== null);
}

function priceHistoryConnection(
  priceHistory: PriceHistoryConnection | null | undefined
): PriceHistoryConnection {
  return priceHistory ?? emptyPriceHistoryConnection();
}

function couponConnection(
  activeCoupons: ActiveCouponsConnection | null | undefined
): ActiveCouponsConnection {
  return activeCoupons ?? emptyCouponConnection();
}

function PriceHistorySummary({
  hasMore,
  merchantName,
  rows
}: {
  hasMore: boolean;
  merchantName: string;
  rows: PriceHistoryRow[];
}) {
  if (rows.length === 0) {
    return <p>No price history for this offer yet.</p>;
  }

  return (
    <>
      <ul aria-label={`${merchantName} price history`}>
        {rows.map((row) => (
          <li key={row.id}>
            <time dateTime={row.observedAt}>{row.observedDate}</time>
            <span>{row.price}</span>
          </li>
        ))}
      </ul>
      {hasMore ? <p>More price history available.</p> : null}
    </>
  );
}

function CouponSummary({
  couponEdges,
  hasMore,
  merchantName
}: {
  couponEdges: readonly CouponEdge[];
  hasMore: boolean;
  merchantName: string;
}) {
  if (couponEdges.length === 0) {
    return <p>No active coupons for this offer.</p>;
  }

  return (
    <>
      <ul aria-label={`${merchantName} active coupons`}>
        {couponEdges.map(({ cursor, node: coupon }) => (
          <CouponListItem coupon={coupon} key={cursor} />
        ))}
      </ul>
      {hasMore ? <p>More coupons available.</p> : null}
    </>
  );
}

function CouponListItem({ coupon }: { coupon: CouponNode }) {
  const couponDiscountLabel = discountLabel(coupon);
  const couponValidTo = graphQLDateTimeContext(coupon.validTo);

  return (
    <li>
      <strong>{coupon.code}</strong>
      {coupon.description ? <p>{coupon.description}</p> : null}
      {couponDiscountLabel ? <p>{couponDiscountLabel}</p> : null}
      {couponValidTo ? (
        <p>
          Valid through <time dateTime={couponValidTo.dateTime}>{couponValidTo.label}</time>
        </p>
      ) : null}
      {coupon.terms ? <p>{coupon.terms}</p> : null}
    </li>
  );
}
