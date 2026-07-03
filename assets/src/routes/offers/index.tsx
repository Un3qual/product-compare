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
  type OfferDiscoveryLoaderData,
  type OfferDiscoverySort
} from "./loader";
import {
  OfferDiscoveryFilterForm,
  OfferDiscoveryFilterSummary
} from "./filters";
import { offerDiscoveryPath } from "./paths";

type OfferConnection = NonNullable<
  OfferDiscoveryRouteQuery["response"]["merchantProducts"]
>;
type OfferNode = OfferConnection["edges"][number]["node"];
type ActiveCouponsConnection = NonNullable<OfferNode["activeCoupons"]>;
type PriceHistoryConnection = NonNullable<OfferNode["priceHistory"]>;
type CouponEdge = ActiveCouponsConnection["edges"][number];
type CouponNode = ActiveCouponsConnection["edges"][number]["node"];
type PriceHistoryNode = PriceHistoryConnection["edges"][number]["node"];
type RenderableOffer = {
  href: string;
  latestPriceValue: number | null;
  offer: OfferNode;
  originalIndex: number;
};

const MERCHANT_NAME_COLLATOR = new Intl.Collator(undefined, {
  sensitivity: "base"
});

export function OfferDiscoveryRoute() {
  const loaderData = useLoaderData<typeof offerDiscoveryLoader>() as OfferDiscoveryLoaderData;

  return (
    <section>
      <header>
        <h1>Offers</h1>
      </header>

      <OfferDiscoveryFilterForm filters={loaderData.filters} />
      <OfferDiscoveryFilterSummary filters={loaderData.filters} />

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
  const offers = sortedRenderableOffers(
    renderableOffers(connection),
    filters.sort
  );

  return (
    <>
      <p>{filters.activeOnly ? "Active offers" : "All offers"}</p>
      {offers.length === 0 ? (
        <p>No offers match these filters.</p>
      ) : (
        <ul aria-label="Offers">
          {offers.map((renderableOffer, index) => (
            <OfferListItem
              key={renderableOffer.offer.id}
              offer={renderableOffer.offer}
              offerHref={renderableOffer.href}
              priceSortHighlightLabel={priceSortHighlightLabel(
                filters.sort,
                index,
                renderableOffer
              )}
            />
          ))}
        </ul>
      )}
      <OfferPagination connection={connection} filters={filters} />
    </>
  );
}

function OfferListItem({
  offer,
  offerHref,
  priceSortHighlightLabel
}: {
  offer: OfferNode;
  offerHref: string;
  priceSortHighlightLabel: string | null;
}) {
  const priceHistory = priceHistoryConnection(offer.priceHistory);
  const activeCoupons = couponConnection(offer.activeCoupons);
  const merchantName = offerMerchantName(offer.merchant);

  return (
    <li>
      <article>
        <OfferListItemHeader
          isActive={offer.isActive}
          productName={offerProductName(offer.product)}
        />
        <OfferMerchantLink href={offerHref} merchantName={merchantName} />
        <OfferMerchantDomain domain={offerMerchantDomain(offer.merchant)} />

        {priceSortHighlightLabel ? <p>{priceSortHighlightLabel}</p> : null}
        <p>{offerLatestPriceLabel(offer)}</p>

        <PriceHistorySummary
          hasMore={priceHistory.pageInfo.hasNextPage}
          merchantName={offerSummaryMerchantName(offer.merchant)}
          rows={offerPriceHistoryRows(priceHistory, offer.currency)}
        />
        <CouponSummary
          couponEdges={activeCoupons.edges}
          hasMore={activeCoupons.pageInfo.hasNextPage}
          merchantName={offerSummaryMerchantName(offer.merchant)}
        />
      </article>
    </li>
  );
}

function OfferListItemHeader({
  isActive,
  productName
}: {
  isActive: boolean;
  productName: string;
}) {
  return (
    <header>
      <h2>{productName}</h2>
      <p>{offerStatusLabel(isActive)}</p>
    </header>
  );
}

function OfferMerchantLink({
  href,
  merchantName
}: {
  href: string;
  merchantName: string;
}) {
  if (!href) {
    return null;
  }

  return (
    <p>
      <a href={href}>{merchantName}</a>
    </p>
  );
}

function OfferMerchantDomain({ domain }: { domain: string | null }) {
  if (!domain) {
    return null;
  }

  return <p>{domain}</p>;
}

function offerProductName(product: OfferNode["product"]) {
  return product?.name ?? "Unknown product";
}

function offerStatusLabel(isActive: boolean) {
  return isActive ? "Active" : "Inactive";
}

function offerMerchantName(merchant: OfferNode["merchant"]) {
  return merchant?.name ?? "Visit offer";
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
      <p>Choose a product to review its current merchant offers.</p>
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

function renderableOffers(connection: OfferConnection) {
  const offers: RenderableOffer[] = [];

  connection.edges.forEach(({ node: offer }, originalIndex) => {
    const href = safeHttpUrl(offer.url);

    if (href) {
      offers.push({
        href,
        latestPriceValue: numericLatestPrice(offer),
        offer,
        originalIndex
      });
    }
  });

  return offers;
}

function sortedRenderableOffers(
  offers: RenderableOffer[],
  sort: OfferDiscoverySort
) {
  if (sort === "default") {
    return offers;
  }

  return [...offers].sort((left, right) =>
    compareRenderableOffers(left, right, sort)
  );
}

function compareRenderableOffers(
  left: RenderableOffer,
  right: RenderableOffer,
  sort: OfferDiscoverySort
) {
  if (sort === "price_asc" || sort === "price_desc") {
    return compareByPrice(left, right, sort);
  }

  const merchantComparison = MERCHANT_NAME_COLLATOR.compare(
    offerMerchantName(left.offer.merchant),
    offerMerchantName(right.offer.merchant)
  );

  return merchantComparison || compareByOriginalIndex(left, right);
}

function compareByPrice(
  left: RenderableOffer,
  right: RenderableOffer,
  sort: Extract<OfferDiscoverySort, "price_asc" | "price_desc">
) {
  if (left.latestPriceValue === null && right.latestPriceValue === null) {
    return compareByOriginalIndex(left, right);
  }

  if (left.latestPriceValue === null) {
    return 1;
  }

  if (right.latestPriceValue === null) {
    return -1;
  }

  const priceComparison = left.latestPriceValue - right.latestPriceValue;

  return (
    (sort === "price_asc" ? priceComparison : -priceComparison) ||
    compareByOriginalIndex(left, right)
  );
}

function compareByOriginalIndex(left: RenderableOffer, right: RenderableOffer) {
  return left.originalIndex - right.originalIndex;
}

function priceSortHighlightLabel(
  sort: OfferDiscoverySort,
  index: number,
  offer: RenderableOffer
) {
  if (index !== 0 || offer.latestPriceValue === null) {
    return null;
  }

  if (sort === "price_asc") {
    return "Best price on this page";
  }

  if (sort === "price_desc") {
    return "Highest price on this page";
  }

  return null;
}

function numericLatestPrice(offer: OfferNode) {
  const price = offer.latestPrice?.price?.trim();

  if (!price) {
    return null;
  }

  const numericPrice = Number(price);

  return Number.isFinite(numericPrice) ? numericPrice : null;
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
