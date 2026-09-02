import { useId } from "react";
import { Link } from "react-router";
import { graphql, useFragment } from "react-relay";
import type { ProductOfferPanel_connection$key } from "$generated/ProductOfferPanel_connection.graphql";
import { FeedbackState } from "$ui/components/feedback/FeedbackState";
import { create, props } from "@stylexjs/stylex";
import { tokens } from "$ui/theme/tokens.stylex";
import { ProductOfferList } from "./ProductOfferList";
import { ProductPriceTrend } from "./ProductPriceTrend";
import type { ProductPriceTrendCurrency } from "./product-price-trend";
import { ResettableErrorBoundary } from "$relay/ResettableErrorBoundary";
import {
  buildProductOfferPanelData,
  productOfferPaginationPaths,
  type ProductOfferSnapshot,
} from "./product-offer-panel-data";

const productOfferPanelFragment = graphql`
  fragment ProductOfferPanel_connection on MerchantProductConnection {
    edges {
      node {
        id
        url
        currency
        merchant {
          id
          name
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
        priceHistory(first: 12) {
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
    }
    pageInfo {
      endCursor
      hasNextPage
    }
  }
`;

const styles = create({
  snapshot: {
    borderBlockColor: tokens.borderQuiet,
    borderBlockStyle: "solid",
    borderBlockWidth: "1px",
    display: "grid",
    gap: "0.75rem",
    marginBlockEnd: "1rem",
    paddingBlock: "1rem",
  },
  snapshotTitle: {
    color: tokens.textSecondary,
    fontFamily: tokens.fontMono,
    fontSize: "0.72rem",
    letterSpacing: "0.04em",
    margin: 0,
    textTransform: "uppercase",
  },
  snapshotPrimary: {
    display: "grid",
    gap: "0.2rem",
  },
  snapshotLabel: {
    color: tokens.textSecondary,
    fontSize: "0.82rem",
  },
  snapshotValue: {
    color: tokens.text,
    fontSize: {
      default: "1.35rem",
      "@media (max-width: 42rem)": "1.15rem",
    },
    fontWeight: 700,
    letterSpacing: "-0.02em",
    lineHeight: 1.25,
  },
  snapshotContext: {
    color: tokens.textSecondary,
    display: "flex",
    flexWrap: "wrap",
    fontSize: "0.86rem",
    gap: "0.25rem 0.65rem",
    lineHeight: 1.45,
    margin: 0,
  },
});

export function ProductOfferPanel({
  connection,
  offersAfter,
  priceTrendSeries,
  productSlug,
  referenceTime,
  selectedCompareSlugs,
}: {
  connection: ProductOfferPanel_connection$key | null;
  offersAfter: string | null;
  priceTrendSeries: readonly ProductPriceTrendCurrency[];
  productSlug: string;
  referenceTime: string;
  selectedCompareSlugs: readonly string[];
}) {
  const data = useFragment(productOfferPanelFragment, connection);

  if (!data) {
    return (
      <>
        <ProductTrendBoundary productSlug={productSlug} series={priceTrendSeries} />
        <FeedbackState kind="error" title="Offers unavailable." />
      </>
    );
  }

  const { offers, snapshot } = buildProductOfferPanelData(data);
  const pagination = (
    <ProductOfferPagination
      connection={data}
      offersAfter={offersAfter}
      productSlug={productSlug}
      selectedCompareSlugs={selectedCompareSlugs}
    />
  );

  if (offers.length === 0) {
    return (
      <>
        <ProductTrendBoundary productSlug={productSlug} series={priceTrendSeries} />
        <p>No active offers yet.</p>
        {pagination}
      </>
    );
  }

  return (
    <>
      <ProductTrendBoundary productSlug={productSlug} series={priceTrendSeries} />
      <OfferSnapshot snapshot={snapshot} />
      <ProductOfferList offers={offers} referenceTime={referenceTime} />
      {pagination}
    </>
  );
}

function ProductTrendBoundary({
  productSlug,
  series,
}: {
  productSlug: string;
  series: readonly ProductPriceTrendCurrency[];
}) {
  return (
    <ResettableErrorBoundary
      fallback={<FeedbackState kind="error" title="Price trend unavailable." />}
      resetToken={productSlug}
    >
      <ProductPriceTrend series={series} />
    </ResettableErrorBoundary>
  );
}

function ProductOfferPagination({
  connection,
  offersAfter,
  productSlug,
  selectedCompareSlugs,
}: {
  connection: Parameters<typeof productOfferPaginationPaths>[0]["connection"];
  offersAfter: string | null;
  productSlug: string;
  selectedCompareSlugs: readonly string[];
}) {
  const { firstPath, nextPath } = productOfferPaginationPaths({
    connection,
    offersAfter,
    productSlug,
    selectedCompareSlugs,
  });

  if (!firstPath && !nextPath) {
    return null;
  }

  return (
    <nav aria-label="Active offer pages">
      {firstPath ? <Link to={firstPath}>First offers</Link> : null}
      {nextPath ? <Link to={nextPath}>Next offers</Link> : null}
    </nav>
  );
}

function OfferSnapshot({ snapshot }: { snapshot: ProductOfferSnapshot }) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} {...props(styles.snapshot)}>
      <h3 id={titleId} {...props(styles.snapshotTitle)}>
        Offer snapshot
      </h3>
      <div {...props(styles.snapshotPrimary)}>
        <span {...props(styles.snapshotLabel)}>Best visible offer</span>
        <strong data-slot="offer-snapshot-primary" {...props(styles.snapshotValue)}>
          {snapshot.lowestVisiblePriceText ?? "No visible prices"}
        </strong>
      </div>
      <p {...props(styles.snapshotContext)}>{offerSnapshotContext(snapshot)}</p>
    </section>
  );
}

function offerSnapshotContext(snapshot: ProductOfferSnapshot) {
  if (snapshot.visibleOfferCount === 1) {
    const couponContext = snapshot.couponOfferCount === 1 ? "a coupon" : "no coupon";
    const priceContext = snapshot.missingPriceCount === 0 ? "a current price" : "no current price";

    return `1 active offer on this page with ${couponContext} and ${priceContext}.`;
  }

  const couponContext =
    snapshot.couponOfferCount === 0
      ? "No offers include coupons"
      : snapshot.couponOfferCount === 1
        ? "1 offer includes a coupon"
        : `${snapshot.couponOfferCount} offers include coupons`;
  const priceContext =
    snapshot.missingPriceCount === 0
      ? "every offer has a current price"
      : snapshot.missingPriceCount === snapshot.visibleOfferCount
        ? "current prices are unavailable for every offer"
        : `${snapshot.missingPriceCount} do not have a current price`;

  return `${snapshot.visibleOfferCount} active offers on this page. ${couponContext}, and ${priceContext}.`;
}
