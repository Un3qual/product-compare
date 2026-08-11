import { create, props } from "@stylexjs/stylex";
import { graphql, useFragment } from "react-relay";
import type { OfferDiscoveryCard_offer$key } from "$generated/OfferDiscoveryCard_offer.graphql";
import { StatusBadge } from "$ui/components/status/StatusBadge";
import { tokens } from "$ui/theme/tokens.stylex";
import { externalHttpUrlHref } from "../external-links";
import { graphQLDateTimeContext } from "../graphql-datetime";
import {
  discountLabel,
  offerMerchantName,
  type ActiveCouponsConnection,
  type CouponNode,
  type OfferNode,
  type PriceHistoryRow,
} from "./offer-discovery-data";
import { getOfferDiscoveryCardData } from "./offer-discovery-card-data";
import { TrackedCommerceClickAction } from "./TrackedCommerceClickAction";

const offerDiscoveryCardFragment = graphql`
  fragment OfferDiscoveryCard_offer on MerchantProduct {
    id
    url
    currency
    lastSeenAt
    isActive
    merchant {
      id
      name
      domain
    }
    product {
      id
      name
      slug
    }
    latestPrice {
      id
      price
      observedAt
    }
    activeCoupons(first: 2) {
      edges {
        cursor
        node {
          code
          description
          discountType
          discountValue
          currency
          validTo
          terms
        }
      }
      pageInfo {
        hasNextPage
      }
    }
    priceHistory(first: 3) {
      edges {
        node {
          id
          price
          observedAt
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

type CouponEdge = ActiveCouponsConnection["edges"][number];

const styles = create({
  offer: {
    display: "grid",
    gap: "1rem",
  },
  offerHeader: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem",
    justifyContent: "space-between",
  },
  offerTitle: {
    fontSize: "1.2rem",
    letterSpacing: "-0.02em",
    margin: 0,
  },
  price: {
    color: tokens.text,
    fontSize: "1.35rem",
    fontWeight: 750,
    margin: 0,
  },
  muted: {
    color: tokens.textSecondary,
    margin: 0,
  },
  offerDecision: {
    alignItems: "start",
    display: "grid",
    gap: "1rem 2rem",
    gridTemplateColumns: {
      default: "minmax(0, 1fr) minmax(9rem, auto)",
      "@media (max-width: 42rem)": "minmax(0, 1fr)",
    },
  },
  merchantContext: {
    display: "grid",
    gap: "0.55rem",
  },
  priceContext: {
    display: "grid",
    gap: "0.55rem",
    justifyItems: {
      default: "end",
      "@media (max-width: 42rem)": "start",
    },
  },
  supportingDetail: {
    borderBlockStartColor: tokens.borderQuiet,
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "1px",
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: {
      default: "repeat(2, minmax(0, 1fr))",
      "@media (max-width: 42rem)": "minmax(0, 1fr)",
    },
    paddingBlockStart: "1rem",
  },
});

export function OfferDiscoveryCard({
  offer,
  highlightLabel,
}: {
  offer: OfferDiscoveryCard_offer$key;
  highlightLabel: string | null;
}) {
  const data = useFragment(offerDiscoveryCardFragment, offer);
  const cardData = getOfferDiscoveryCardData(data);
  const merchantName = offerMerchantName(data.merchant);

  return (
    <article {...props(styles.offer)}>
      <OfferCardHeader productName={cardData.productName} status={cardData.status} />
      <OfferDecisionContext
        highlightLabel={highlightLabel}
        latestPriceLabel={cardData.latestPriceLabel}
        merchantDomain={cardData.merchantDomain}
        merchantName={merchantName}
        offer={data}
      />
      <OfferSupportingDetail
        activeCoupons={cardData.activeCoupons}
        merchantName={cardData.summaryMerchantName}
        priceHistoryHasMore={cardData.priceHistory.pageInfo.hasNextPage}
        priceHistoryRows={cardData.priceHistoryRows}
      />
    </article>
  );
}

function OfferDecisionContext({
  highlightLabel,
  latestPriceLabel,
  merchantDomain,
  merchantName,
  offer,
}: {
  highlightLabel: string | null;
  latestPriceLabel: string;
  merchantDomain: string | null;
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
        <OfferMerchantDomain domain={merchantDomain} />
        <OfferObservationContext offer={offer} />
      </section>
      <section aria-label="Current price" {...props(styles.priceContext)}>
        {highlightLabel ? <StatusBadge tone="accent">{highlightLabel}</StatusBadge> : null}
        <p {...props(styles.price)}>{latestPriceLabel}</p>
      </section>
    </div>
  );
}

function OfferSupportingDetail({
  activeCoupons,
  merchantName,
  priceHistoryHasMore,
  priceHistoryRows,
}: {
  activeCoupons: ActiveCouponsConnection;
  merchantName: string;
  priceHistoryHasMore: boolean;
  priceHistoryRows: ReturnType<typeof getOfferDiscoveryCardData>["priceHistoryRows"];
}) {
  return (
    <div {...props(styles.supportingDetail)}>
      <PriceHistorySummary
        hasMore={priceHistoryHasMore}
        merchantName={merchantName}
        rows={priceHistoryRows}
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
  productName,
  status,
}: {
  productName: string;
  status: ReturnType<typeof getOfferDiscoveryCardData>["status"];
}) {
  return (
    <header {...props(styles.offerHeader)}>
      <h2 {...props(styles.offerTitle)}>{productName}</h2>
      <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
    </header>
  );
}

function OfferMerchantAction({
  isActive,
  merchantProductId,
  merchantUrl,
  merchantName,
}: {
  isActive: boolean;
  merchantProductId: string;
  merchantUrl: string;
  merchantName: string;
}) {
  if (isActive && merchantProductId) {
    return (
      <div>
        <TrackedCommerceClickAction label={merchantName} merchantProductId={merchantProductId} />
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

function PriceHistorySummary({
  hasMore,
  merchantName,
  rows,
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
  merchantName,
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
