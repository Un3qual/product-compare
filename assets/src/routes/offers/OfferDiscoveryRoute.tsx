import { Suspense } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link, useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import offerDiscoveryRouteQuery, {
  type OfferDiscoveryRouteQuery
} from "../../__generated__/OfferDiscoveryRouteQuery.graphql";
import { useRoutePreloadedQuery } from "../../relay/route-preload";
import { ResettableErrorBoundary } from "../../relay/ResettableErrorBoundary";
import { DataList, DataListItem } from "../../ui/components/data/DataList";
import { FeedbackState } from "../../ui/components/feedback/FeedbackState";
import { PageShell } from "../../ui/components/layout/PageShell";
import { Pagination } from "../../ui/components/navigation/Pagination";
import { StatusBadge } from "../../ui/components/status/StatusBadge";
import { Button } from "../../ui/primitives/Button";
import { tokens } from "../../ui/theme/tokens.stylex";
import { canComparePriceCurrencies, decimalStringToNumber } from "../decimal-values";
import { externalHttpUrlHref } from "../external-links";
import {
  graphQLDateTimeContext,
  graphQLDateTimeLabel
} from "../graphql-datetime";
import {
  formatCouponAvailabilityCount,
  formatOfferCount
} from "../offer-formatting";
import {
  buildOfferSnapshotSummary,
  type OfferSnapshotSelectors,
  type OfferSnapshotSummary
} from "../offer-snapshot";
import {
  offerDiscoveryLoader,
  type OfferDiscoveryFilters,
  type OfferDiscoveryLoaderData,
  type OfferDiscoverySort
} from "./loader";
import {
  OfferDiscoveryFilterForm,
  OfferDiscoveryFilterSummary,
  type OfferDiscoveryProductContext
} from "./OfferDiscoveryFilterForm";
import { offerDiscoveryPath } from "./paths";
import { TrackedCommerceClickAction } from "./TrackedCommerceClickAction";

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
  latestPriceCurrency: string | null;
  latestPriceValue: number | null;
  offer: OfferNode;
  originalIndex: number;
};
type RenderableOfferSort = Exclude<OfferDiscoverySort, "default">;
type VisibleMerchant = {
  id: string;
  name: string;
};
const MERCHANT_NAME_COLLATOR = new Intl.Collator(undefined, {
  sensitivity: "base"
});
const OFFER_SNAPSHOT_SELECTORS: OfferSnapshotSelectors<RenderableOffer> = {
  currency: (offer) => offer.latestPriceCurrency,
  hasCoupons: hasVisibleCoupons,
  numericPrice: (offer) => offer.latestPriceValue
};

const styles = create({
  snapshot: {
    backgroundColor: tokens.surfaceMuted,
    borderRadius: "var(--radius-4)",
    display: "grid",
    gap: "1rem",
    padding: "1.25rem"
  },
  snapshotTitle: {
    fontSize: "1rem",
    margin: 0
  },
  metrics: {
    display: "grid",
    gap: "0.75rem",
    gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 1fr))",
    margin: 0
  },
  metric: {
    display: "grid",
    gap: "0.3rem"
  },
  metricLabel: {
    color: tokens.textSecondary,
    fontSize: "0.8rem"
  },
  metricValue: {
    fontSize: "1.05rem",
    fontWeight: 700,
    margin: 0
  },
  offer: {
    display: "grid",
    gap: "0.7rem"
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
  filterSection: {
    display: "grid",
    gap: "0.75rem"
  }
});

export function OfferDiscoveryRoute() {
  const loaderData = useLoaderData<typeof offerDiscoveryLoader>() as OfferDiscoveryLoaderData;

  return (
    <PageShell
      description="Review current merchant prices, availability, recent observations, and coupon context for a selected product."
      eyebrow="Offer discovery"
      title="Offers"
    >
      <OfferDiscoveryFilterForm filters={loaderData.filters} />

      {loaderData.status === "missingProduct" ? (
        <>
          <OfferDiscoveryFilterSummary filters={loaderData.filters} />
          <MissingProductState />
        </>
      ) : loaderData.status === "error" ? (
        <OfferDiscoveryQueryFallback filters={loaderData.filters} />
      ) : (
        <ResettableErrorBoundary
          fallback={<OfferDiscoveryQueryFallback filters={loaderData.filters} />}
          resetToken={loaderData.query}
        >
          <Suspense fallback={<OfferDiscoveryLoadingFallback filters={loaderData.filters} />}>
            <OfferDiscoveryPanel
              filters={loaderData.filters}
              query={loaderData.query}
            />
          </Suspense>
        </ResettableErrorBoundary>
      )}
    </PageShell>
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
  const selectedProduct = selectedProductContext(data.selectedProduct);

  return (
    <>
      <OfferDiscoveryFilterSummary
        filters={filters}
        selectedProduct={selectedProduct}
      />
      {data.merchantProducts ? (
        <OfferDiscoveryList connection={data.merchantProducts} filters={filters} />
      ) : (
        <OfferDiscoveryUnavailableFallback />
      )}
    </>
  );
}

function selectedProductContext(
  node: OfferDiscoveryRouteQuery["response"]["selectedProduct"]
): OfferDiscoveryProductContext | null {
  if (!node || node.__typename !== "Product") {
    return null;
  }

  return {
    brand: node.brand,
    id: node.id,
    name: node.name,
    slug: node.slug
  };
}

function OfferDiscoveryList({
  connection,
  filters
}: {
  connection: OfferConnection;
  filters: OfferDiscoveryFilters;
}) {
  const renderableOfferRows = renderableOffers(connection);
  const canComparePrices = priceSortUsesSingleCurrency(renderableOfferRows);
  const offers = sortedRenderableOffers(renderableOfferRows, filters.sort, canComparePrices);

  return (
    <>
      <StatusBadge tone={filters.activeOnly ? "positive" : "neutral"}>
        {filters.activeOnly ? "Active offers" : "All offers"}
      </StatusBadge>
      {offers.length === 0 ? (
        <FeedbackState kind="empty" title="No offers match these filters." />
      ) : (
        <>
          <VisibleOfferSnapshot
            summary={buildOfferSnapshotSummary(offers, OFFER_SNAPSHOT_SELECTORS)}
          />
          <OfferDataList
            canComparePrices={canComparePrices}
            offers={offers}
            sort={filters.sort}
          />
        </>
      )}
      <VisibleMerchantFilters filters={filters} offers={offers} />
      <OfferPagination connection={connection} filters={filters} />
    </>
  );
}

function OfferDataList({
  canComparePrices,
  offers,
  sort
}: {
  canComparePrices: boolean;
  offers: RenderableOffer[];
  sort: OfferDiscoverySort;
}) {
  return (
    <DataList label="Offers">
      {offers.map((renderableOffer, index) => (
        <DataListItem key={renderableOffer.offer.id}>
          <OfferListItem
            offer={renderableOffer.offer}
            highlightLabel={priceSortHighlightLabel(
              sort,
              index,
              renderableOffer,
              canComparePrices
            )}
          />
        </DataListItem>
      ))}
    </DataList>
  );
}

function VisibleOfferSnapshot({
  summary
}: {
  summary: OfferSnapshotSummary<RenderableOffer>;
}) {
  return (
    <section aria-label="Visible offer snapshot" {...props(styles.snapshot)}>
      <h2 {...props(styles.snapshotTitle)}>Visible offer snapshot</h2>
      <dl {...props(styles.metrics)}>
        <div {...props(styles.metric)}>
          <dt {...props(styles.metricLabel)}>Visible offers on this page</dt>
          <dd {...props(styles.metricValue)}>{summary.visibleOfferCount}</dd>
        </div>
        <div {...props(styles.metric)}>
          <dt {...props(styles.metricLabel)}>Lowest visible price</dt>
          <dd {...props(styles.metricValue)}>{visibleLowestPriceLabel(summary)}</dd>
        </div>
        <div {...props(styles.metric)}>
          <dt {...props(styles.metricLabel)}>Visible coupon availability</dt>
          <dd {...props(styles.metricValue)}>
            {formatCouponAvailabilityCount(summary.couponAvailabilityCount)}
          </dd>
        </div>
        <div {...props(styles.metric)}>
          <dt {...props(styles.metricLabel)}>Missing latest price</dt>
          <dd {...props(styles.metricValue)}>
            {formatOfferCount(summary.missingPriceCount)}
          </dd>
        </div>
      </dl>
    </section>
  );
}

function hasVisibleCoupons({ offer }: RenderableOffer) {
  const activeCoupons = couponConnection(offer.activeCoupons);

  return activeCoupons.edges.length > 0 || activeCoupons.pageInfo.hasNextPage;
}

function visibleLowestPriceLabel(summary: OfferSnapshotSummary<RenderableOffer>) {
  if (summary.priceState === "mixed") {
    return "Not comparable across currencies";
  }

  const lowestPricedOffer = summary.lowestPricedOffer;

  return lowestPricedOffer
    ? priceLabel(
        lowestPricedOffer.offer.latestPrice?.price,
        lowestPricedOffer.offer.currency
      )
    : "No visible prices";
}

function OfferListItem({
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
      <OfferListItemHeader
        isActive={offer.isActive}
        productName={offerProductName(offer.product)}
      />
      <OfferMerchantAction
        isActive={offer.isActive}
        merchantName={merchantName}
        merchantProductId={offer.id}
        merchantUrl={offer.url}
      />
      <OfferMerchantDomain domain={offerMerchantDomain(offer.merchant)} />
      <OfferObservationContext offer={offer} />

      {highlightLabel ? <StatusBadge tone="accent">{highlightLabel}</StatusBadge> : null}
      <p {...props(styles.price)}>{offerLatestPriceLabel(offer)}</p>

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

function VisibleMerchantFilters({
  filters,
  offers
}: {
  filters: OfferDiscoveryFilters;
  offers: ReadonlyArray<RenderableOffer>;
}) {
  const merchants = visibleMerchants(offers);
  const activeMerchant = activeVisibleMerchant(filters.merchantId, merchants);
  const filterableMerchants = merchants.filter((merchant) => merchant.id !== filters.merchantId);

  if (isEmptyMerchantFilterSection(activeMerchant, filterableMerchants)) {
    return null;
  }

  return (
    <section
      aria-label="Merchant filters on this page"
      {...props(styles.filterSection)}
    >
      <ActiveMerchantFilterSummary merchant={activeMerchant} />
      <VisibleMerchantFilterLinks filters={filters} merchants={filterableMerchants} />
    </section>
  );
}

function ActiveMerchantFilterSummary({ merchant }: { merchant: VisibleMerchant | null }) {
  return merchant ? <p>{`Filtered to ${merchant.name}`}</p> : null;
}

function VisibleMerchantFilterLinks({
  filters,
  merchants
}: {
  filters: OfferDiscoveryFilters;
  merchants: ReadonlyArray<VisibleMerchant>;
}) {
  if (merchants.length === 0) {
    return null;
  }

  return (
    <ul>
      {merchants.map((merchant) => (
        <li key={merchant.id}>
          <Link to={offerDiscoveryPath({ ...filters, merchantId: merchant.id }, null)}>
            {`Filter to ${merchant.name}`}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function activeVisibleMerchant(
  merchantId: string | null,
  merchants: ReadonlyArray<VisibleMerchant>
) {
  if (!merchantId) {
    return null;
  }

  return merchants.find((merchant) => merchant.id === merchantId) ?? null;
}

function isEmptyMerchantFilterSection(
  activeMerchant: VisibleMerchant | null,
  filterableMerchants: ReadonlyArray<VisibleMerchant>
) {
  return !activeMerchant && filterableMerchants.length === 0;
}

function visibleMerchants(offers: ReadonlyArray<RenderableOffer>): VisibleMerchant[] {
  const merchants = new Map<string, string>();

  for (const { offer } of offers) {
    if (offer.merchant?.id && offer.merchant.name) {
      merchants.set(offer.merchant.id, offer.merchant.name);
    }
  }

  return Array.from(merchants, ([id, name]) => ({ id, name }));
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

function OfferPagination({
  connection,
  filters
}: {
  connection: OfferConnection;
  filters: OfferDiscoveryFilters;
}) {
  return (
    <Pagination
      firstHref={
        connection.pageInfo.hasPreviousPage && filters.after
          ? offerDiscoveryPath(filters, null)
          : null
      }
      firstLabel="First offers"
      label="Offer pages"
      nextHref={
        connection.pageInfo.hasNextPage && connection.pageInfo.endCursor
          ? offerDiscoveryPath(filters, connection.pageInfo.endCursor)
          : null
      }
      nextLabel="Next offers"
    />
  );
}

function MissingProductState() {
  return (
    <FeedbackState
      action={
        <Button asChild variant="solid">
          <Link to="/products">Browse products</Link>
        </Button>
      }
      description="Choose a product to review its current merchant offers."
      kind="empty"
      title="Start from browse products to choose a product."
    />
  );
}

function OfferDiscoveryUnavailableFallback() {
  return (
    <FeedbackState kind="error" title="Offers unavailable." />
  );
}

function OfferDiscoveryQueryFallback({ filters }: { filters: OfferDiscoveryFilters }) {
  return (
    <>
      <OfferDiscoveryFilterSummary filters={filters} />
      <OfferDiscoveryUnavailableFallback />
    </>
  );
}

function OfferDiscoveryLoadingFallback({ filters }: { filters: OfferDiscoveryFilters }) {
  return (
    <>
      <OfferDiscoveryFilterSummary filters={filters} />
      <FeedbackState kind="loading" title="Loading offers..." />
    </>
  );
}

function renderableOffers(connection: OfferConnection) {
  const offers: RenderableOffer[] = [];

  connection.edges.forEach(({ node: offer }, originalIndex) => {
    const latestPriceValue = numericLatestPrice(offer);

    if (externalHttpUrlHref(offer.url)) {
      offers.push({
        latestPriceCurrency: latestPriceValue === null ? null : offer.currency,
        latestPriceValue,
        offer,
        originalIndex
      });
    }
  });

  return offers;
}

function sortedRenderableOffers(
  offers: RenderableOffer[],
  sort: OfferDiscoverySort,
  canComparePrices: boolean
) {
  if (sort === "default" || (isPriceSort(sort) && !canComparePrices)) {
    return offers;
  }

  return [...offers].sort((left, right) =>
    compareRenderableOffers(left, right, sort)
  );
}

function compareRenderableOffers(
  left: RenderableOffer,
  right: RenderableOffer,
  sort: RenderableOfferSort
) {
  if (sort === "price_asc" || sort === "price_desc") {
    return compareByPrice(left, right, sort);
  }

  if (sort === "merchant_name") {
    const merchantComparison = MERCHANT_NAME_COLLATOR.compare(
      offerMerchantName(left.offer.merchant),
      offerMerchantName(right.offer.merchant)
    );

    return merchantComparison || compareByOriginalIndex(left, right);
  }

  const exhaustiveCheck: never = sort;
  throw new Error(`Unsupported offer sort: ${exhaustiveCheck}`);
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
  offer: RenderableOffer,
  canComparePrices: boolean
) {
  if (!canComparePrices || index !== 0 || offer.latestPriceValue === null) {
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
  return decimalStringToNumber(offer.latestPrice?.price);
}

function isPriceSort(
  sort: OfferDiscoverySort
): sort is Extract<OfferDiscoverySort, "price_asc" | "price_desc"> {
  return sort === "price_asc" || sort === "price_desc";
}

function priceSortUsesSingleCurrency(offers: ReadonlyArray<RenderableOffer>) {
  return canComparePriceCurrencies(
    offers.flatMap((offer) =>
      offer.latestPriceValue === null ? [] : [offer.latestPriceCurrency]
    )
  );
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
  const observedDate = graphQLDateTimeLabel(pricePoint.observedAt);

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
