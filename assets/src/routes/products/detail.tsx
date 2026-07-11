import { Suspense, useId } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link, useLoaderData, useLocation } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import productDetailRouteQuery, {
  type ProductDetailRouteQuery
} from "../../__generated__/ProductDetailRouteQuery.graphql";
import { useRoutePreloadedQuery } from "../../relay/route-preload";
import { ResettableErrorBoundary } from "../../relay/resettable-error-boundary";
import { FeedbackState } from "../../ui/components/feedback/feedback-state";
import { PageShell } from "../../ui/components/layout/page-shell";
import { tokens } from "../../ui/theme/tokens.stylex";
import { MAX_COMPARE_PRODUCTS } from "../compare/loader";
import {
  buildComparePathFromSlugs,
  buildCurrentRoutePathWithCompareSlugs,
  selectedCompareSlugsAfterAdding,
  selectedCompareSlugsFromSearch
} from "../compare/paths";
import { CompareSelectionTray } from "../compare/selection-tray";
import { decimalStringToNumber } from "../decimal-values";
import { externalHttpUrlHref } from "../external-links";
import {
  graphQLDateTimeContext,
  graphQLDateTimeLabel,
  type GraphQLDateTimeContext
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
import { TrackedCommerceClickAction } from "../offers/tracked-commerce-click";
import { productDetailLoader, type ProductDetailLoaderData } from "./loader";
import {
  ProductAttributeList,
  type ProductAttributeListItem
} from "./product-attribute-list";

const styles = create({
  description: {
    display: "grid",
    gap: "0.35rem"
  },
  descriptionText: {
    margin: 0
  },
  section: {
    display: "grid",
    gap: "1rem"
  },
  sectionTitle: {
    fontSize: "1.4rem",
    letterSpacing: "-0.025em",
    margin: 0
  },
  actions: {
    backgroundColor: tokens.surfaceMuted,
    borderColor: tokens.borderQuiet,
    borderRadius: "var(--radius-4)",
    borderStyle: "solid",
    borderWidth: "1px",
    padding: "1rem"
  }
});

export function ProductDetailRoute() {
  const loaderData = useLoaderData<typeof productDetailLoader>() as ProductDetailLoaderData;

  if (loaderData.status !== "ready") {
    return loaderData.status === "not_found" ? (
      <ProductNotFoundFallback />
    ) : (
      <ProductUnavailableFallback />
    );
  }

  return (
    <ResettableErrorBoundary
      resetToken={loaderData.productQuery}
      fallback={<ProductUnavailableFallback />}
    >
      <Suspense fallback={<p role="status">Loading product...</p>}>
        <ProductDetail productQuery={loaderData.productQuery} />
      </Suspense>
    </ResettableErrorBoundary>
  );
}

function ProductDetail({
  productQuery
}: {
  productQuery: Extract<ProductDetailLoaderData, { status: "ready" }>["productQuery"];
}) {
  const queryRef = useRoutePreloadedQuery<ProductDetailRouteQuery>(
    productDetailRouteQuery,
    productQuery
  );
  const data = usePreloadedQuery<ProductDetailRouteQuery>(productDetailRouteQuery, queryRef);
  const location = useLocation();
  const offersTitleId = useId();
  const selectedCompareSlugs = selectedCompareSlugsFromSearch(location.search, {
    maxProducts: MAX_COMPARE_PRODUCTS
  });

  if (!data.product) {
    return <ProductNotFoundFallback />;
  }

  const { product } = data;

  return (
    <PageShell
      description={
        <div {...props(styles.description)}>
          <p {...props(styles.descriptionText)}>
            {product.brand?.name ?? "Unknown brand"}
          </p>
          {product.description ? (
            <p {...props(styles.descriptionText)}>{product.description}</p>
          ) : null}
        </div>
      }
      eyebrow="Product detail"
      title={product.name}
    >
      {selectedCompareSlugs.length > 0 ? (
        <CompareSelectionTray
          items={[
            {
              label: product.name,
              slug: product.slug
            }
          ]}
          maxProducts={MAX_COMPARE_PRODUCTS}
          openComparePath={buildComparePathFromSlugs(selectedCompareSlugs)}
          removePathForIndex={(index) =>
            productDetailPathWithCompareSlugs(
              product.slug,
              location.search,
              selectedCompareSlugs.filter((_, selectedIndex) => selectedIndex !== index)
            )
          }
          selectedSlugs={selectedCompareSlugs}
        />
      ) : null}
      <ProductDecisionActions
        currentSearch={location.search}
        productId={product.id}
        productSlug={product.slug}
        selectedCompareSlugs={selectedCompareSlugs}
      />
      <ProductSpecifications attributes={product.currentAttributes} />
      <section
        aria-labelledby={offersTitleId}
        {...props(styles.section)}
      >
        <h2 id={offersTitleId} {...props(styles.sectionTitle)}>
          Active offers
        </h2>
        <ProductOffers
          connection={product.merchantProducts}
          productSlug={product.slug}
          offersAfter={new URLSearchParams(location.search).get("offersAfter")}
          selectedCompareSlugs={selectedCompareSlugs}
        />
      </section>
    </PageShell>
  );
}

function ProductDecisionActions({
  currentSearch,
  productId,
  productSlug,
  selectedCompareSlugs
}: {
  currentSearch: string;
  productId: string;
  productSlug: string;
  selectedCompareSlugs: readonly string[];
}) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} {...props(styles.actions)}>
      <h2 id={titleId}>Next steps</h2>
      <ul>
        <DetailCompareAction
          currentSearch={currentSearch}
          productSlug={productSlug}
          selectedCompareSlugs={selectedCompareSlugs}
        />
        <li>
          <Link to={`/offers?productId=${encodeURIComponent(productId)}`}>Review active offers</Link>
        </li>
        <li>
          <Link to={buildCurrentRoutePathWithCompareSlugs("/products", "", selectedCompareSlugs)}>
            Browse products
          </Link>
        </li>
      </ul>
    </section>
  );
}

function DetailCompareAction({
  currentSearch,
  productSlug,
  selectedCompareSlugs
}: {
  currentSearch: string;
  productSlug: string;
  selectedCompareSlugs: readonly string[];
}) {
  if (selectedCompareSlugs.includes(productSlug)) {
    return <li>This product is selected for comparison</li>;
  }

  if (selectedCompareSlugs.length >= MAX_COMPARE_PRODUCTS) {
    return <li>Compare selection full</li>;
  }

  const nextCompareSlugs = selectedCompareSlugsAfterAdding(
    selectedCompareSlugs,
    productSlug,
    MAX_COMPARE_PRODUCTS
  );

  return (
    <li>
      <Link to={productDetailPathWithCompareSlugs(productSlug, currentSearch, nextCompareSlugs)}>
        Add this product to compare
      </Link>
    </li>
  );
}

function ProductSpecifications({
  attributes
}: {
  attributes: ReadonlyArray<ProductAttributeListItem>;
}) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} {...props(styles.section)}>
      <h2 id={titleId} {...props(styles.sectionTitle)}>
        Specifications
      </h2>
      <ProductAttributeList
        attributes={attributes}
        emptyMessage="No product attributes available yet."
      />
    </section>
  );
}

function ProductUnavailableFallback() {
  return (
    <PageShell title="Product unavailable" width="reading">
      <FeedbackState kind="error" title="Product unavailable." />
    </PageShell>
  );
}

function ProductNotFoundFallback() {
  return (
    <PageShell title="Product not found" width="reading">
      <FeedbackState kind="empty" title="Product not found." />
    </PageShell>
  );
}

function OffersUnavailableFallback() {
  return (
    <FeedbackState kind="error" title="Offers unavailable." />
  );
}

type VisibleProductOffer = {
  currency: string | null;
  id: string;
  merchantName: string;
  url: string;
  priceText: string | null;
  numericPrice: number | null;
  priceObservation: GraphQLDateTimeContext | null;
  coupons: ReturnType<typeof buildCouponRows>;
  couponsHasMore: boolean;
  priceHistory: ReturnType<typeof buildPriceHistoryRows>;
  priceHistoryHasMore: boolean;
};

const PRODUCT_OFFER_SNAPSHOT_SELECTORS: OfferSnapshotSelectors<VisibleProductOffer> = {
  currency: (offer) => offer.currency,
  hasCoupons: (offer) => offer.coupons.length > 0 || offer.couponsHasMore,
  numericPrice: (offer) => (hasVisiblePrice(offer) ? offer.numericPrice : null)
};

type ProductOfferNode = NonNullable<
  NonNullable<ProductDetailRouteQuery["response"]["product"]>["merchantProducts"]
>["edges"][number]["node"];

function buildVisibleProductOffer(node: ProductOfferNode): VisibleProductOffer | null {
  const safeUrl = normalizeOfferUrl(node.url);

  if (!safeUrl) {
    return null;
  }

  return {
    id: node.id,
    currency: normalizedCurrency(node.currency),
    merchantName: productOfferMerchantName(node.merchant),
    url: safeUrl,
    priceText: formatPriceText(node.latestPrice?.price, node.currency),
    numericPrice: decimalStringToNumber(node.latestPrice?.price),
    priceObservation: buildPriceObservation(node.latestPrice?.observedAt),
    ...buildVisibleCouponSummary(node.activeCoupons),
    ...buildVisiblePriceHistorySummary(node.priceHistory, node.currency)
  };
}

function buildVisibleCouponSummary(activeCoupons: ProductOfferNode["activeCoupons"]) {
  return {
    coupons: buildCouponRows(activeCoupons?.edges ?? []),
    couponsHasMore: activeCoupons?.pageInfo.hasNextPage ?? false
  };
}

function buildVisiblePriceHistorySummary(
  priceHistory: ProductOfferNode["priceHistory"],
  currency: string
) {
  return {
    priceHistory: buildPriceHistoryRows(priceHistory?.edges ?? [], currency),
    priceHistoryHasMore: priceHistory?.pageInfo.hasNextPage ?? false
  };
}

function ProductOffers({
  connection,
  productSlug,
  offersAfter,
  selectedCompareSlugs
}: {
  connection: NonNullable<ProductDetailRouteQuery["response"]["product"]>["merchantProducts"];
  productSlug: string;
  offersAfter: string | null;
  selectedCompareSlugs: readonly string[];
}) {
  if (!connection) {
    return <OffersUnavailableFallback />;
  }

  const offers = connection.edges.flatMap(({ node }) => {
    const offer = buildVisibleProductOffer(node);

    return offer ? [offer] : [];
  });
  const paginationLinks =
    offersAfter || (connection.pageInfo.hasNextPage && connection.pageInfo.endCursor) ? (
      <nav aria-label="Active offer pages">
        {offersAfter ? (
          <Link to={productOffersPath(productSlug, null, selectedCompareSlugs)}>
            First offers
          </Link>
        ) : null}
        {connection.pageInfo.hasNextPage && connection.pageInfo.endCursor ? (
          <Link
            to={productOffersPath(
              productSlug,
              connection.pageInfo.endCursor,
              selectedCompareSlugs
            )}
          >
            Next offers
          </Link>
        ) : null}
      </nav>
    ) : null;

  if (offers.length === 0) {
    return (
      <>
        <p>No active offers yet.</p>
        {paginationLinks}
      </>
    );
  }

  return (
    <>
      <OfferSnapshot
        summary={buildOfferSnapshotSummary(offers, PRODUCT_OFFER_SNAPSHOT_SELECTORS)}
      />
      <ActiveOfferList offers={offers} />
      {paginationLinks}
    </>
  );
}

function ActiveOfferList({ offers }: { offers: VisibleProductOffer[] }) {
  return (
    <ul aria-label="Active offer list">
      {offers.map((offer) => (
        <li key={offer.id}>
          <TrackedCommerceClickAction
            label={offer.merchantName}
            merchantProductId={offer.id}
          />
          {offer.priceText ? <p>{offer.priceText}</p> : null}
          {offer.priceObservation ? (
            <p>
              Price observed{" "}
              <time dateTime={offer.priceObservation.dateTime}>
                {offer.priceObservation.label}
              </time>
            </p>
          ) : null}
          <OfferPriceHistory
            merchantName={offer.merchantName}
            historyRows={offer.priceHistory}
            hasMore={offer.priceHistoryHasMore}
          />
          <OfferCoupons
            merchantName={offer.merchantName}
            coupons={offer.coupons}
            hasMore={offer.couponsHasMore}
          />
        </li>
      ))}
    </ul>
  );
}

function productOfferMerchantName(merchant: ProductOfferNode["merchant"]) {
  return merchant?.name ?? "Visit offer";
}

function OfferSnapshot({
  summary
}: {
  summary: OfferSnapshotSummary<VisibleProductOffer>;
}) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId}>
      <h3 id={titleId}>Offer snapshot</h3>
      <dl>
        <div>
          <dt>Visible active offers</dt>
          <dd>{summary.visibleOfferCount}</dd>
        </div>
        <div>
          <dt>Lowest visible price</dt>
          <dd>{lowestVisiblePriceText(summary) ?? "No visible prices"}</dd>
        </div>
        <div>
          <dt>Coupon availability</dt>
          <dd>{formatCouponAvailabilityCount(summary.couponAvailabilityCount)}</dd>
        </div>
        <div>
          <dt>Missing latest price</dt>
          <dd>{formatOfferCount(summary.missingPriceCount)}</dd>
        </div>
      </dl>
    </section>
  );
}

function hasVisiblePrice(
  offer: VisibleProductOffer
): offer is VisibleProductOffer & { currency: string; numericPrice: number; priceText: string } {
  return offer.numericPrice !== null && offer.priceText !== null && offer.currency !== null;
}

function lowestVisiblePriceText(
  summary: OfferSnapshotSummary<VisibleProductOffer>
) {
  if (summary.priceState === "mixed") {
    return "Multiple currencies";
  }

  const lowestPricedOffer = summary.lowestPricedOffer;

  return lowestPricedOffer?.priceText
    ? `${lowestPricedOffer.priceText} at ${lowestPricedOffer.merchantName}`
    : null;
}

function productDetailPath(productSlug: string) {
  return `/products/${encodeURIComponent(productSlug)}`;
}

function productDetailPathWithCompareSlugs(
  productSlug: string,
  search: string,
  selectedCompareSlugs: readonly string[]
) {
  return buildCurrentRoutePathWithCompareSlugs(
    productDetailPath(productSlug),
    search,
    selectedCompareSlugs
  );
}

function productOffersPath(
  productSlug: string,
  offersAfter?: string | null,
  selectedCompareSlugs: readonly string[] = []
) {
  const params = new URLSearchParams();

  if (offersAfter) {
    params.set("offersAfter", offersAfter);
  }

  for (const slug of selectedCompareSlugs) {
    params.append("slug", slug);
  }

  const query = params.toString();

  return query.length > 0
    ? `${productDetailPath(productSlug)}?${query}`
    : productDetailPath(productSlug);
}

function OfferPriceHistory({
  merchantName,
  historyRows,
  hasMore
}: {
  merchantName: string;
  historyRows: ReadonlyArray<{
    id: string;
    observedAt: string;
    observedDate: string;
    priceText: string;
  }>;
  hasMore: boolean;
}) {
  if (historyRows.length === 0) {
    return <p>No price history for this offer yet.</p>;
  }

  return (
    <section>
      <h3>Price history</h3>
      <ul aria-label={`${merchantName} price history`}>
        {historyRows.map((row) => (
          <li key={row.id}>
            <time dateTime={row.observedAt}>{row.observedDate}</time>
            <span>{row.priceText}</span>
          </li>
        ))}
      </ul>
      {hasMore ? <p>More price history available.</p> : null}
    </section>
  );
}

function OfferCoupons({
  merchantName,
  coupons,
  hasMore
}: {
  merchantName: string;
  coupons: ReadonlyArray<{
    key: string;
    code: string;
    description: string | null | undefined;
    discountText: string | null;
    validToText: string | null;
    terms: string | null | undefined;
  }>;
  hasMore: boolean;
}) {
  if (coupons.length === 0) {
    return <p>No active coupons for this offer.</p>;
  }

  return (
    <>
      <ul aria-label={`${merchantName} active coupons`}>
        {coupons.map((coupon) => (
          <li key={coupon.key}>
            <strong>{coupon.code}</strong>
            {coupon.description ? <p>{coupon.description}</p> : null}
            {coupon.discountText ? <p>{coupon.discountText}</p> : null}
            {coupon.validToText ? <p>{coupon.validToText}</p> : null}
            {coupon.terms ? <p>{coupon.terms}</p> : null}
          </li>
        ))}
      </ul>
      {hasMore ? <p>More coupons available.</p> : null}
    </>
  );
}

function buildCouponRows(
  edges: ReadonlyArray<{
    readonly cursor: string;
    readonly node: {
      readonly code: string;
      readonly description: string | null | undefined;
      readonly discountType: string;
      readonly discountValue: unknown;
      readonly currency: string | null | undefined;
      readonly validTo: unknown;
      readonly terms: string | null | undefined;
    };
  }>
) {
  return edges.map(({ cursor, node }) => ({
    key: cursor,
    code: node.code,
    description: node.description,
    discountText: formatCouponDiscountText(node.discountType, node.discountValue, node.currency),
    validToText: formatCouponValidToText(node.validTo),
    terms: node.terms
  }));
}

function buildPriceHistoryRows(
  edges: ReadonlyArray<{
    readonly node: {
      readonly id: string;
      readonly price: unknown;
      readonly observedAt: unknown;
    };
  }>,
  currency: unknown
) {
  return edges.flatMap(({ node }) => {
    const observedDate = graphQLDateTimeLabel(node.observedAt);
    const priceText = formatPriceText(node.price, currency);

    if (!observedDate || !priceText || typeof node.observedAt !== "string") {
      return [];
    }

    return [
      {
        id: node.id,
        observedAt: node.observedAt,
        observedDate,
        priceText
      }
    ];
  });
}

function formatPriceText(price: unknown, currency: unknown) {
  if (typeof currency !== "string") {
    return null;
  }

  if (typeof price === "string" && decimalStringToNumber(price) !== null) {
    return `${price} ${currency}`;
  }

  if (typeof price === "number" && Number.isFinite(price)) {
    return `${price.toFixed(2)} ${currency}`;
  }

  return null;
}

function normalizedCurrency(currency: unknown) {
  if (typeof currency !== "string") {
    return null;
  }

  const trimmedCurrency = currency.trim();

  return trimmedCurrency === "" ? null : trimmedCurrency;
}

function buildPriceObservation(value: unknown): GraphQLDateTimeContext | null {
  return graphQLDateTimeContext(value);
}

function formatCouponDiscountText(discountType: string, discountValue: unknown, currency: unknown) {
  if (discountType === "FREE_SHIPPING") {
    return "Free shipping";
  }

  const valueText = formatFiniteNumberText(discountValue);

  if (!valueText) {
    return null;
  }

  if (discountType === "PERCENT") {
    return `${valueText}%`;
  }

  if (discountType === "AMOUNT" && typeof currency === "string" && currency !== "") {
    return `${valueText} ${currency}`;
  }

  return null;
}

function formatCouponValidToText(validTo: unknown) {
  const dateText = graphQLDateTimeLabel(validTo);

  return dateText ? `Valid through ${dateText}` : null;
}

function formatFiniteNumberText(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  if (trimmedValue === "") {
    return null;
  }

  return decimalStringToNumber(trimmedValue) !== null ? trimmedValue : null;
}

function normalizeOfferUrl(rawUrl: unknown): string | null {
  if (typeof rawUrl !== "string") {
    return null;
  }

  return externalHttpUrlHref(rawUrl);
}
