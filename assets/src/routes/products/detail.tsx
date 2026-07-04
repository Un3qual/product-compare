import { Suspense, useId } from "react";
import { Link, useLoaderData, useLocation } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import productDetailRouteQuery, {
  type ProductDetailRouteQuery
} from "../../__generated__/ProductDetailRouteQuery.graphql";
import productOffersRouteQuery, {
  type ProductOffersRouteQuery
} from "../../__generated__/ProductOffersRouteQuery.graphql";
import { useRoutePreloadedQuery } from "../../relay/route-preload";
import { ResettableErrorBoundary } from "../../relay/resettable-error-boundary";
import { MAX_COMPARE_PRODUCTS } from "../compare/loader";
import {
  buildComparePathFromSlugs,
  buildCurrentRoutePathWithCompareSlugs,
  selectedCompareSlugsAfterAdding,
  selectedCompareSlugsFromSearch
} from "../compare/paths";
import { CompareSelectionTray } from "../compare/selection-tray";
import { canComparePriceCurrencies, decimalStringToNumber } from "../decimal-values";
import { productDetailLoader, type ProductDetailLoaderData } from "./loader";
import {
  ProductAttributeList,
  type ProductAttributeListItem
} from "./product-attribute-list";

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
        <ProductDetail productQuery={loaderData.productQuery} offers={loaderData.offers} />
      </Suspense>
    </ResettableErrorBoundary>
  );
}

function ProductDetail({
  productQuery,
  offers
}: {
  productQuery: Extract<ProductDetailLoaderData, { status: "ready" }>["productQuery"];
  offers: Extract<ProductDetailLoaderData, { status: "ready" }>["offers"];
}) {
  const queryRef = useRoutePreloadedQuery<ProductDetailRouteQuery>(
    productDetailRouteQuery,
    productQuery
  );
  const data = usePreloadedQuery<ProductDetailRouteQuery>(productDetailRouteQuery, queryRef);
  const location = useLocation();
  const selectedCompareSlugs = selectedCompareSlugsFromSearch(location.search, {
    maxProducts: MAX_COMPARE_PRODUCTS
  });

  if (!data.product) {
    return <ProductNotFoundFallback />;
  }

  const { product } = data;

  return (
    <section>
      <h1>{product.name}</h1>
      <p>{product.brand?.name ?? "Unknown brand"}</p>
      {product.description ? <p>{product.description}</p> : null}
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
      <section>
        <h2>Active offers</h2>
        {offers.status === "error" ? (
          <OffersUnavailableFallback />
        ) : (
          <ResettableErrorBoundary
            resetToken={offers.query}
            fallback={<OffersUnavailableFallback />}
          >
            <Suspense fallback={<p role="status">Loading offers...</p>}>
              <ProductOffers
                query={offers.query}
                productSlug={product.slug}
                offersAfter={offers.query.__relayQuery.variables.after ?? null}
                selectedCompareSlugs={selectedCompareSlugs}
              />
            </Suspense>
          </ResettableErrorBoundary>
        )}
      </section>
    </section>
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
    <section aria-labelledby={titleId}>
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
  return (
    <section>
      <h2>Specifications</h2>
      <ProductAttributeList
        attributes={attributes}
        emptyMessage="No product attributes available yet."
      />
    </section>
  );
}

function ProductUnavailableFallback() {
  return (
    <section role="alert">
      <p>Product unavailable.</p>
    </section>
  );
}

function ProductNotFoundFallback() {
  return (
    <section>
      <p>Product not found.</p>
    </section>
  );
}

function OffersUnavailableFallback() {
  return (
    <div role="alert">
      <p>Offers unavailable.</p>
    </div>
  );
}

function ProductOffers({
  query,
  productSlug,
  offersAfter,
  selectedCompareSlugs
}: {
  query: Extract<
    Extract<ProductDetailLoaderData, { status: "ready" }>["offers"],
    { status: "ready" }
  >["query"];
  productSlug: string;
  offersAfter: string | null;
  selectedCompareSlugs: readonly string[];
}) {
  const queryRef = useRoutePreloadedQuery<ProductOffersRouteQuery>(
    productOffersRouteQuery,
    query
  );
  const data = usePreloadedQuery<ProductOffersRouteQuery>(productOffersRouteQuery, queryRef);
  const offers = data.merchantProducts.edges.flatMap(({ node }) => {
    const safeUrl = normalizeOfferUrl(node.url);
    const merchantName = node.merchant?.name;

    if (!safeUrl || !merchantName) {
      return [];
    }

    return [
      {
        id: node.id,
        currency: normalizedCurrency(node.currency),
        merchantName,
        url: safeUrl,
        priceText: formatPriceText(node.latestPrice?.price, node.currency),
        numericPrice: decimalStringToNumber(node.latestPrice?.price),
        coupons: buildCouponRows(node.activeCoupons?.edges ?? []),
        couponsHasMore: node.activeCoupons?.pageInfo.hasNextPage ?? false,
        priceHistory: buildPriceHistoryRows(node.priceHistory?.edges ?? [], node.currency),
        priceHistoryHasMore: node.priceHistory?.pageInfo.hasNextPage ?? false
      }
    ];
  });
  const paginationLinks =
    offersAfter || (data.merchantProducts.pageInfo.hasNextPage && data.merchantProducts.pageInfo.endCursor) ? (
      <nav aria-label="Active offer pages">
        {offersAfter ? (
          <Link to={productOffersPath(productSlug, null, selectedCompareSlugs)}>
            First offers
          </Link>
        ) : null}
        {data.merchantProducts.pageInfo.hasNextPage &&
        data.merchantProducts.pageInfo.endCursor ? (
          <Link
            to={productOffersPath(
              productSlug,
              data.merchantProducts.pageInfo.endCursor,
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
      <OfferSnapshot summary={buildOfferSnapshotSummary(offers)} />
      <ul aria-label="Active offer list">
        {offers.map((offer) => (
          <li key={offer.id}>
            <a href={offer.url} target="_blank" rel="noopener noreferrer">
              {offer.merchantName}
            </a>
            {offer.priceText ? <p>{offer.priceText}</p> : null}
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
      {paginationLinks}
    </>
  );
}

type VisibleProductOffer = {
  currency: string | null;
  id: string;
  merchantName: string;
  url: string;
  priceText: string | null;
  numericPrice: number | null;
  coupons: ReturnType<typeof buildCouponRows>;
  couponsHasMore: boolean;
  priceHistory: ReturnType<typeof buildPriceHistoryRows>;
  priceHistoryHasMore: boolean;
};

type OfferSnapshotSummary = {
  visibleOfferCount: number;
  lowestVisiblePriceText: string | null;
  couponAvailabilityCount: number;
  missingPriceCount: number;
};

function OfferSnapshot({ summary }: { summary: OfferSnapshotSummary }) {
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
          <dd>{summary.lowestVisiblePriceText ?? "No visible prices"}</dd>
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

function buildOfferSnapshotSummary(
  offers: ReadonlyArray<VisibleProductOffer>
): OfferSnapshotSummary {
  const visiblePricedOffers = offers.filter(hasVisiblePrice);
  const lowestPricedOffer =
    visiblePricedOffers.length > 0 && canComparePrices(visiblePricedOffers)
      ? visiblePricedOffers.reduce((lowestOffer, offer) =>
          offer.numericPrice < lowestOffer.numericPrice ? offer : lowestOffer
        )
      : null;

  return {
    visibleOfferCount: offers.length,
    lowestVisiblePriceText: lowestVisiblePriceText(lowestPricedOffer, visiblePricedOffers),
    couponAvailabilityCount: offers.filter(
      (offer) => offer.coupons.length > 0 || offer.couponsHasMore
    ).length,
    missingPriceCount: offers.filter((offer) => !hasVisiblePrice(offer)).length
  };
}

function hasVisiblePrice(
  offer: VisibleProductOffer
): offer is VisibleProductOffer & { currency: string; numericPrice: number; priceText: string } {
  return offer.numericPrice !== null && offer.priceText !== null && offer.currency !== null;
}

function canComparePrices(offers: ReadonlyArray<VisibleProductOffer & { currency: string }>) {
  return canComparePriceCurrencies(offers.map((offer) => offer.currency));
}

function lowestVisiblePriceText(
  lowestPricedOffer:
    | (VisibleProductOffer & { currency: string; numericPrice: number; priceText: string })
    | null,
  visiblePricedOffers: ReadonlyArray<VisibleProductOffer & { currency: string }>
) {
  if (visiblePricedOffers.length > 0 && !canComparePrices(visiblePricedOffers)) {
    return "Multiple currencies";
  }

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
    const observedDate = formatObservedDate(node.observedAt);
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

  if (typeof price === "string" && price !== "") {
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

function formatObservedDate(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const sourceDate = /^(\d{4}-\d{2}-\d{2})(?:[T\s]|$)/.exec(value);

  return sourceDate?.[1] ?? parsed.toISOString().slice(0, 10);
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
  const dateText = formatObservedDate(validTo);

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

function formatCouponAvailabilityCount(count: number) {
  return `${formatOfferCount(count)} with coupons`;
}

function formatOfferCount(count: number) {
  return `${count} ${count === 1 ? "offer" : "offers"}`;
}

function normalizeOfferUrl(rawUrl: unknown): string | null {
  if (typeof rawUrl !== "string") {
    return null;
  }

  try {
    const parsed = new URL(rawUrl);

    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}
