import { Suspense } from "react";
import { Link, useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import productDetailRouteQuery, {
  type ProductDetailRouteQuery
} from "../../__generated__/ProductDetailRouteQuery.graphql";
import productOffersRouteQuery, {
  type ProductOffersRouteQuery
} from "../../__generated__/ProductOffersRouteQuery.graphql";
import { useRoutePreloadedQuery } from "../../relay/route-preload";
import { ResettableErrorBoundary } from "../../relay/resettable-error-boundary";
import { productDetailLoader, type ProductDetailLoaderData } from "./loader";
import { ProductAttributeList } from "./product-attribute-list";

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

  if (!data.product) {
    return <ProductNotFoundFallback />;
  }

  const { product } = data;

  return (
    <section>
      <h1>{product.name}</h1>
      <p>{product.brand?.name ?? "Unknown brand"}</p>
      {product.description ? <p>{product.description}</p> : null}
      <p>
        <Link to={`/compare?slug=${encodeURIComponent(product.slug)}`}>Compare this product</Link>
      </p>
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
              <ProductOffers query={offers.query} />
            </Suspense>
          </ResettableErrorBoundary>
        )}
      </section>
    </section>
  );
}

function ProductSpecifications({
  attributes
}: {
  attributes: ReadonlyArray<{
    code: string;
    displayName: string;
    valueText: string;
  }>;
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
  query
}: {
  query: Extract<
    Extract<ProductDetailLoaderData, { status: "ready" }>["offers"],
    { status: "ready" }
  >["query"];
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
        merchantName,
        url: safeUrl,
        priceText: formatPriceText(node.latestPrice?.price, node.currency),
        coupons: buildCouponRows(node.activeCoupons?.edges ?? []),
        priceHistory: buildPriceHistoryRows(node.priceHistory?.edges ?? [], node.currency),
        priceHistoryHasMore: node.priceHistory?.pageInfo.hasNextPage ?? false
      }
    ];
  });

  if (offers.length === 0) {
    return <p>No active offers yet.</p>;
  }

  return (
    <ul>
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
          <OfferCoupons coupons={offer.coupons} />
        </li>
      ))}
    </ul>
  );
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
  coupons
}: {
  coupons: ReadonlyArray<{
    code: string;
    description: string | null | undefined;
    discountText: string | null;
    validToText: string | null;
    terms: string | null | undefined;
  }>;
}) {
  if (coupons.length === 0) {
    return <p>No active coupons for this offer.</p>;
  }

  return (
    <ul aria-label="Active coupons">
      {coupons.map((coupon) => (
        <li key={coupon.code}>
          <strong>{coupon.code}</strong>
          {coupon.description ? <p>{coupon.description}</p> : null}
          {coupon.discountText ? <p>{coupon.discountText}</p> : null}
          {coupon.validToText ? <p>{coupon.validToText}</p> : null}
          {coupon.terms ? <p>{coupon.terms}</p> : null}
        </li>
      ))}
    </ul>
  );
}

function buildCouponRows(
  edges: ReadonlyArray<{
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
  return edges.map(({ node }) => ({
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

function formatObservedDate(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
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

  return Number.isFinite(Number(trimmedValue)) ? trimmedValue : null;
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
