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
        priceText: formatPriceText(node.latestPrice?.price, node.currency)
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
        </li>
      ))}
    </ul>
  );
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
