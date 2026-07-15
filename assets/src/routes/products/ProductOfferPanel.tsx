import { useId } from "react";
import { Link } from "react-router-dom";
import type { ProductDetailRouteQuery } from "../../__generated__/ProductDetailRouteQuery.graphql";
import { FeedbackState } from "../../ui/components/feedback/FeedbackState";
import { ProductOfferList } from "./ProductOfferList";
import {
  buildProductOfferPanelData,
  productOfferPaginationPaths,
  type ProductOfferSnapshot
} from "./product-offer-panel-data";

type ProductOfferConnection = NonNullable<
  NonNullable<ProductDetailRouteQuery["response"]["product"]>["merchantProducts"]
>;

export function ProductOfferPanel({
  connection,
  productSlug,
  offersAfter,
  selectedCompareSlugs
}: {
  connection: ProductOfferConnection | null | undefined;
  productSlug: string;
  offersAfter: string | null;
  selectedCompareSlugs: readonly string[];
}) {
  if (!connection) {
    return <FeedbackState kind="error" title="Offers unavailable." />;
  }

  const { offers, snapshot } = buildProductOfferPanelData(connection);
  const pagination = (
    <ProductOfferPagination
      connection={connection}
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
  selectedCompareSlugs
}: {
  connection: ProductOfferConnection;
  offersAfter: string | null;
  productSlug: string;
  selectedCompareSlugs: readonly string[];
}) {
  const { firstPath, nextPath } = productOfferPaginationPaths({
    connection,
    offersAfter,
    productSlug,
    selectedCompareSlugs
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
