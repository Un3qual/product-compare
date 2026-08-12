import { create, props } from "@stylexjs/stylex";
import { graphql, useFragment } from "react-relay";
import type { OfferDiscoveryCard_offer$key } from "$generated/OfferDiscoveryCard_offer.graphql";
import { StatusBadge } from "$ui/components/status/StatusBadge";
import { Button } from "$ui/primitives/Button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "$ui/primitives/Collapsible";
import { tokens } from "$ui/theme/tokens.stylex";
import { externalHttpUrlHref } from "../external-links";
import { graphQLDateTimeContext } from "../graphql-datetime";
import {
  discountLabel,
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
    alignItems: "start",
    display: "grid",
    gap: "0.75rem 1rem",
    gridTemplateColumns: "minmax(0, 1fr) auto",
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
  offerTitle: {
    fontSize: "1.35rem",
    letterSpacing: "-0.02em",
    margin: 0,
  },
  productContext: {
    color: tokens.textSecondary,
    fontSize: "0.88rem",
    margin: 0,
  },
  price: {
    fontSize: "1.65rem",
    fontWeight: 750,
    letterSpacing: "-0.025em",
    lineHeight: 1.15,
    margin: 0,
  },
  priceAvailable: {
    color: tokens.pricePositive,
  },
  priceUnavailable: {
    color: tokens.textSecondary,
  },
  muted: {
    color: tokens.textSecondary,
    margin: 0,
  },
  offerDecision: {
    alignItems: "end",
    display: "grid",
    gap: "1rem 1.5rem",
    gridTemplateColumns: {
      default: "minmax(9rem, 0.65fr) minmax(12rem, 1fr) auto",
      "@media (max-width: 42rem)": "minmax(0, 1fr)",
    },
  },
  decisionSection: {
    display: "grid",
    gap: "0.35rem",
  },
  decisionLabel: {
    color: tokens.textSecondary,
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.07em",
    margin: 0,
    textTransform: "uppercase",
  },
  observationContext: {
    color: tokens.textSecondary,
    display: "flex",
    flexWrap: "wrap",
    fontSize: "0.84rem",
    gap: "0.25rem 0.9rem",
  },
  observation: {
    margin: 0,
  },
  offerAction: {
    justifySelf: {
      default: "end",
      "@media (max-width: 42rem)": "start",
    },
  },
  details: {
    borderBlockStartColor: tokens.borderQuiet,
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "1px",
    paddingBlockStart: "0.25rem",
  },
  detailsTrigger: {
    color: tokens.actionAccent,
    fontSize: "0.85rem",
    fontWeight: 700,
    minHeight: tokens.controlHeight,
  },
  supportingDetail: {
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: {
      default: "repeat(2, minmax(0, 1fr))",
      "@media (max-width: 42rem)": "minmax(0, 1fr)",
    },
    paddingBlock: "0.5rem 0.25rem",
  },
  detailSection: {
    display: "grid",
    gap: "0.65rem",
  },
  detailTitle: {
    fontSize: "0.82rem",
    letterSpacing: "0.04em",
    margin: 0,
    textTransform: "uppercase",
  },
  detailList: {
    display: "grid",
    gap: "0.65rem",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  detailListItem: {
    borderBlockStartColor: tokens.borderQuiet,
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "1px",
    display: "grid",
    gap: "0.25rem",
    paddingBlockStart: "0.65rem",
  },
  historyRow: {
    alignItems: "baseline",
    display: "flex",
    gap: "1rem",
    justifyContent: "space-between",
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
  const merchantName = cardData.summaryMerchantName;
  const visitLabel = data.merchant?.name ? `Visit ${data.merchant.name}` : "Visit offer";

  return (
    <article data-slot="offer-card" {...props(styles.offer)}>
      <OfferCardHeader
        merchantDomain={cardData.merchantDomain}
        merchantName={merchantName}
        productName={cardData.productName}
        status={cardData.status}
      />
      <OfferDecisionContext
        hasLatestPrice={Boolean(data.latestPrice)}
        highlightLabel={highlightLabel}
        latestPriceLabel={cardData.latestPriceLabel}
        offer={data}
        visitLabel={visitLabel}
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
  hasLatestPrice,
  highlightLabel,
  latestPriceLabel,
  offer,
  visitLabel,
}: {
  hasLatestPrice: boolean;
  highlightLabel: string | null;
  latestPriceLabel: string;
  offer: OfferNode;
  visitLabel: string;
}) {
  return (
    <div {...props(styles.offerDecision)}>
      <div data-slot="offer-card-price" {...props(styles.decisionSection)}>
        <h3 {...props(styles.decisionLabel)}>Current price</h3>
        <p
          data-slot="offer-card-price-value"
          {...props(
            styles.price,
            hasLatestPrice ? styles.priceAvailable : styles.priceUnavailable,
          )}
        >
          {latestPriceLabel}
        </p>
        {highlightLabel ? <StatusBadge tone="accent">{highlightLabel}</StatusBadge> : null}
      </div>
      <div data-slot="offer-card-freshness" {...props(styles.decisionSection)}>
        <h3 {...props(styles.decisionLabel)}>Freshness</h3>
        <OfferObservationContext offer={offer} />
      </div>
      <div data-slot="offer-card-action" {...props(styles.offerAction)}>
        <OfferMerchantAction
          isActive={offer.isActive}
          label={visitLabel}
          merchantProductId={offer.id}
          merchantUrl={offer.url}
        />
      </div>
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
    <Collapsible style={styles.details}>
      <CollapsibleTrigger
        aria-label={`Offer details for ${merchantName}`}
        style={styles.detailsTrigger}
      >
        Price history and coupons
      </CollapsibleTrigger>
      <CollapsibleContent style={styles.supportingDetail}>
        <section {...props(styles.detailSection)}>
          <h3 {...props(styles.detailTitle)}>Price history</h3>
          <PriceHistorySummary
            hasMore={priceHistoryHasMore}
            merchantName={merchantName}
            rows={priceHistoryRows}
          />
        </section>
        <section {...props(styles.detailSection)}>
          <h3 {...props(styles.detailTitle)}>Coupons</h3>
          <CouponSummary
            couponEdges={activeCoupons.edges}
            hasMore={activeCoupons.pageInfo.hasNextPage}
            merchantName={merchantName}
          />
        </section>
      </CollapsibleContent>
    </Collapsible>
  );
}

function OfferCardHeader({
  merchantDomain,
  merchantName,
  productName,
  status,
}: {
  merchantDomain: string | null;
  merchantName: string;
  productName: string;
  status: ReturnType<typeof getOfferDiscoveryCardData>["status"];
}) {
  return (
    <header {...props(styles.offerHeader)}>
      <div {...props(styles.offerIdentity)}>
        <p {...props(styles.offerEyebrow)}>Merchant offer</p>
        <h2 {...props(styles.offerTitle)}>{merchantName}</h2>
        <p {...props(styles.productContext)}>{`Offer for ${productName}`}</p>
        <OfferMerchantDomain domain={merchantDomain} />
      </div>
      <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
    </header>
  );
}

function OfferMerchantAction({
  isActive,
  merchantProductId,
  merchantUrl,
  label,
}: {
  isActive: boolean;
  merchantProductId: string;
  merchantUrl: string;
  label: string;
}) {
  if (isActive && merchantProductId) {
    return (
      <div>
        <TrackedCommerceClickAction label={label} merchantProductId={merchantProductId} />
      </div>
    );
  }

  const directMerchantHref = externalHttpUrlHref(merchantUrl);

  if (!directMerchantHref) {
    return null;
  }

  return (
    <div>
      <Button render={<a href={directMerchantHref} />} variant="secondary">
        {label}
      </Button>
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
    <div {...props(styles.observationContext)}>
      {offerCheckedAt ? (
        <p {...props(styles.observation)}>
          Offer checked <time dateTime={offerCheckedAt.dateTime}>{offerCheckedAt.label}</time>
        </p>
      ) : null}
      {priceObservedAt ? (
        <p {...props(styles.observation)}>
          Price observed <time dateTime={priceObservedAt.dateTime}>{priceObservedAt.label}</time>
        </p>
      ) : null}
    </div>
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
      <ul aria-label={`${merchantName} price history`} {...props(styles.detailList)}>
        {rows.map((row) => (
          <li key={row.id} {...props(styles.detailListItem, styles.historyRow)}>
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
      <ul aria-label={`${merchantName} active coupons`} {...props(styles.detailList)}>
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
    <li {...props(styles.detailListItem)}>
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
