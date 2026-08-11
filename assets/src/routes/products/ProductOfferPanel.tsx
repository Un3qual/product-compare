import { useId } from "react";
import { Link } from "react-router-dom";
import { graphql, useFragment } from "react-relay";
import type { ProductOfferPanel_connection$key } from "$generated/ProductOfferPanel_connection.graphql";
import { FeedbackState } from "$ui/components/feedback/FeedbackState";
import { ProductOfferList } from "./ProductOfferList";
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
    }
    pageInfo {
      endCursor
      hasNextPage
    }
  }
`;

export function ProductOfferPanel({
  connection,
  productSlug,
  offersAfter,
  selectedCompareSlugs,
}: {
  connection: ProductOfferPanel_connection$key | null | undefined;
  productSlug: string;
  offersAfter: string | null;
  selectedCompareSlugs: readonly string[];
}) {
  const data = useFragment(productOfferPanelFragment, connection);

  if (!data) {
    return <FeedbackState kind="error" title="Offers unavailable." />;
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
        <p>No active offers yet.</p>
        {pagination}
      </>
    );
  }

  return (
    <>
      <OfferSnapshot snapshot={snapshot} />
      <ProductOfferList offers={offers} />
      {pagination}
    </>
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
    <section aria-labelledby={titleId}>
      <h3 id={titleId}>Offer snapshot</h3>
      <dl>
        <div>
          <dt>Visible active offers</dt>
          <dd>{snapshot.visibleOfferCount}</dd>
        </div>
        <div>
          <dt>Lowest visible price</dt>
          <dd>{snapshot.lowestVisiblePriceText ?? "No visible prices"}</dd>
        </div>
        <div>
          <dt>Coupon availability</dt>
          <dd>{snapshot.couponAvailabilityText}</dd>
        </div>
        <div>
          <dt>Missing latest price</dt>
          <dd>{snapshot.missingLatestPriceText}</dd>
        </div>
      </dl>
    </section>
  );
}
