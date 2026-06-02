import { Suspense } from "react";
import { Link, useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import offerDiscoveryRouteQuery, {
  type OfferDiscoveryRouteQuery
} from "../../__generated__/OfferDiscoveryRouteQuery.graphql";
import { useRoutePreloadedQuery } from "../../relay/route-preload";
import { ResettableErrorBoundary } from "../../relay/resettable-error-boundary";
import {
  offerDiscoveryLoader,
  type OfferDiscoveryFilters,
  type OfferDiscoveryLoaderData
} from "./loader";

type OfferConnection = NonNullable<
  OfferDiscoveryRouteQuery["response"]["merchantProducts"]
>;
type OfferNode = OfferConnection["edges"][number]["node"];
type ActiveCouponsConnection = NonNullable<OfferNode["activeCoupons"]>;
type PriceHistoryConnection = NonNullable<OfferNode["priceHistory"]>;
type CouponEdge = ActiveCouponsConnection["edges"][number];
type CouponNode = ActiveCouponsConnection["edges"][number]["node"];
type PriceHistoryNode = PriceHistoryConnection["edges"][number]["node"];

export function OfferDiscoveryRoute() {
  const loaderData = useLoaderData<typeof offerDiscoveryLoader>() as OfferDiscoveryLoaderData;

  return (
    <section>
      <header>
        <h1>Offers</h1>
      </header>

      {loaderData.status === "missingProduct" ? (
        <MissingProductState />
      ) : loaderData.status === "error" ? (
        <OfferDiscoveryUnavailableFallback />
      ) : (
        <ResettableErrorBoundary
          fallback={<OfferDiscoveryUnavailableFallback />}
          resetToken={loaderData.query}
        >
          <Suspense fallback={<p role="status">Loading offers...</p>}>
            <OfferDiscoveryPanel
              filters={loaderData.filters}
              query={loaderData.query}
            />
          </Suspense>
        </ResettableErrorBoundary>
      )}
    </section>
  );
}

function OfferDiscoveryPanel({
  filters,
  query
}: {
  filters: OfferDiscoveryFilters;
  query: Extract<OfferDiscoveryLoaderData, { status: "ready" }>["query"];
}) {
  const queryRef = useRoutePreloadedQuery<OfferDiscoveryRouteQuery>(
    offerDiscoveryRouteQuery,
    query
  );
  const data = usePreloadedQuery<OfferDiscoveryRouteQuery>(
    offerDiscoveryRouteQuery,
    queryRef
  );

  if (!data.merchantProducts) {
    return <OfferDiscoveryUnavailableFallback />;
  }

  return <OfferDiscoveryList connection={data.merchantProducts} filters={filters} />;
}

function OfferDiscoveryList({
  connection,
  filters
}: {
  connection: OfferConnection;
  filters: OfferDiscoveryFilters;
}) {
  const offers = connection.edges.map(({ node }) => node).filter(isRenderableOffer);

  return (
    <>
      <p>{filters.activeOnly ? "Active offers" : "All offers"}</p>
      {offers.length === 0 ? (
        <p>No offers match these filters.</p>
      ) : (
        <ul aria-label="Offers">
          {offers.map((offer) => (
            <OfferListItem key={offer.id} offer={offer} />
          ))}
        </ul>
      )}
      <OfferPagination connection={connection} filters={filters} />
    </>
  );
}

function OfferListItem({ offer }: { offer: OfferNode }) {
  const latestPriceLabel = priceLabel(offer.latestPrice?.price, offer.currency);
  const priceHistory = offer.priceHistory ?? emptyPriceHistoryConnection();
  const activeCoupons = offer.activeCoupons ?? emptyCouponConnection();
  const offerHref = safeHttpUrl(offer.url);
  const historyRows = priceHistory.edges
    .map(({ node }) => priceHistoryRow(node, offer.currency))
    .filter((row): row is PriceHistoryRow => row !== null);

  return (
    <li>
      <article>
        <header>
          <h2>{offer.product?.name ?? "Unknown product"}</h2>
          <p>{offer.isActive ? "Active" : "Inactive"}</p>
        </header>

        {offerHref ? (
          <p>
            <a href={offerHref}>{offer.merchant?.name ?? "Visit offer"}</a>
          </p>
        ) : null}
        {offer.merchant?.domain ? <p>{offer.merchant.domain}</p> : null}

        <p>{latestPriceLabel ?? "No latest price."}</p>

        <PriceHistorySummary
          hasMore={priceHistory.pageInfo.hasNextPage}
          merchantName={offer.merchant?.name ?? "Offer"}
          rows={historyRows}
        />
        <CouponSummary
          couponEdges={activeCoupons.edges}
          hasMore={activeCoupons.pageInfo.hasNextPage}
          merchantName={offer.merchant?.name ?? "Offer"}
        />
      </article>
    </li>
  );
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
        {couponEdges.map(({ cursor, node: coupon }) => {
          const couponDiscountLabel = discountLabel(coupon);

          return (
            <li key={cursor}>
              <strong>{coupon.code}</strong>
              {coupon.description ? <p>{coupon.description}</p> : null}
              {couponDiscountLabel ? <p>{couponDiscountLabel}</p> : null}
              {coupon.terms ? <p>{coupon.terms}</p> : null}
            </li>
          );
        })}
      </ul>
      {hasMore ? <p>More coupons available.</p> : null}
    </>
  );
}

function OfferPagination({
  connection,
  filters
}: {
  connection: OfferConnection;
  filters: OfferDiscoveryFilters;
}) {
  return (
    <>
      {connection.pageInfo.hasPreviousPage && filters.after ? (
        <p>
          <Link to={offerDiscoveryPath(filters, null)}>First offers</Link>
        </p>
      ) : null}
      {connection.pageInfo.hasNextPage && connection.pageInfo.endCursor ? (
        <p>
          <Link to={offerDiscoveryPath(filters, connection.pageInfo.endCursor)}>
            Next offers
          </Link>
        </p>
      ) : null}
    </>
  );
}

function MissingProductState() {
  return (
    <section>
      <p>Start from browse products to choose a product.</p>
      <p>
        <Link to="/products">Browse products</Link>
      </p>
    </section>
  );
}

function OfferDiscoveryUnavailableFallback() {
  return (
    <section role="alert">
      <p>Offers unavailable.</p>
    </section>
  );
}

function offerDiscoveryPath(filters: OfferDiscoveryFilters, after: string | null) {
  const params = new URLSearchParams();

  if (filters.productId) {
    params.set("productId", filters.productId);
  }

  if (filters.merchantId) {
    params.set("merchantId", filters.merchantId);
  }

  params.set("activeOnly", String(filters.activeOnly));
  params.set("first", String(filters.first));

  if (after) {
    params.set("after", after);
  }

  return `/offers?${params.toString()}`;
}

function isRenderableOffer(offer: OfferNode) {
  return safeHttpUrl(offer.url) !== null;
}

function safeHttpUrl(url: string) {
  try {
    const parsedUrl = new URL(url);

    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function priceLabel(price: string | null | undefined, currency: string) {
  if (!price) {
    return null;
  }

  return `${price} ${currency}`;
}

type PriceHistoryRow = {
  id: string;
  observedAt: string;
  observedDate: string;
  price: string;
};

function priceHistoryRow(
  pricePoint: PriceHistoryNode,
  currency: string
): PriceHistoryRow | null {
  const price = priceLabel(pricePoint.price, currency);
  const observedDate = dateLabel(pricePoint.observedAt);

  if (!price || !observedDate) {
    return null;
  }

  return {
    id: pricePoint.id,
    observedAt: pricePoint.observedAt,
    observedDate,
    price
  };
}

function dateLabel(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return value.slice(0, 10);
}

function discountLabel(coupon: CouponNode) {
  if (coupon.discountType === "AMOUNT" && coupon.discountValue && coupon.currency) {
    return `${coupon.discountValue} ${coupon.currency}`;
  }

  if (coupon.discountType === "PERCENT" && coupon.discountValue) {
    return `${coupon.discountValue}%`;
  }

  if (coupon.discountType === "FREE_SHIPPING") {
    return "Free shipping";
  }

  return null;
}

function emptyCouponConnection(): ActiveCouponsConnection {
  return {
    edges: [],
    pageInfo: {
      hasNextPage: false
    }
  };
}

function emptyPriceHistoryConnection(): PriceHistoryConnection {
  return {
    edges: [],
    pageInfo: {
      hasNextPage: false
    }
  };
}
