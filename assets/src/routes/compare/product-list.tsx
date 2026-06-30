import { Link } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import productDetailRouteQuery, {
  type ProductDetailRouteQuery
} from "../../__generated__/ProductDetailRouteQuery.graphql";
import { useRoutePreloadedQuery } from "../../relay/route-preload";
import { ProductAttributeList } from "../products/product-attribute-list";
import type {
  CompareOfferContextSummary,
  CompareProductSummary,
  CompareRouteLoaderData,
  CompareSpecMode
} from "./loader";
import { buildComparePathAfterRemovingSlugIndex } from "./paths";

const MISSING_ATTRIBUTE_VALUE = "Not available";

export function CompareProductList({
  loaderData
}: {
  loaderData: Extract<CompareRouteLoaderData, { status: "ready" }>;
}) {
  return (
    <>
      <DecisionSummary
        offerContexts={loaderData.offerContexts}
        products={loaderData.products}
      />
      <CompareSpecificationMatrix
        products={loaderData.products}
        specMode={loaderData.specMode}
      />
      <ul>
        {loaderData.productQueries.map((productQuery, index) => (
          <CompareProductCard
            key={loaderData.slugs[index] ?? productQuery.__relayQuery.operationName}
            productQuery={productQuery}
            summary={loaderData.products[index]}
            selectedSlugs={loaderData.slugs}
            selectedIndex={index}
            specMode={loaderData.specMode}
          />
        ))}
      </ul>
    </>
  );
}

function DecisionSummary({
  offerContexts,
  products
}: {
  offerContexts: Extract<CompareRouteLoaderData, { status: "ready" }>["offerContexts"];
  products: CompareProductSummary[];
}) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section>
      <h2>Decision summary</h2>
      <table aria-label="Decision summary">
        <thead>
          <tr>
            <th scope="col">Decision</th>
            {products.map((product) => (
              <th key={product.id} scope="col">
                {product.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Best current price</th>
            {products.map((product) => (
              <td key={`${product.id}-best-price`}>
                {bestCurrentPriceLabel(offerContextForProduct(offerContexts, product.id))}
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row">Active offer count</th>
            {products.map((product) => (
              <td key={`${product.id}-offer-count`}>
                {activeOfferCountLabel(offerContextForProduct(offerContexts, product.id))}
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row">Coupon signal</th>
            {products.map((product) => (
              <td key={`${product.id}-coupon-signal`}>
                {couponSignalLabel(offerContextForProduct(offerContexts, product.id))}
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row">Price recency</th>
            {products.map((product) => (
              <td key={`${product.id}-price-recency`}>
                {priceRecencyLabel(offerContextForProduct(offerContexts, product.id))}
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row">Review offers link</th>
            {products.map((product) => (
              <td key={`${product.id}-review-offers`}>
                <Link to={`/offers?productId=${encodeURIComponent(product.id)}`}>
                  Review {product.name} offers
                </Link>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </section>
  );
}

function offerContextForProduct(
  offerContexts: Extract<CompareRouteLoaderData, { status: "ready" }>["offerContexts"] | undefined,
  productId: string
): CompareOfferContextSummary {
  return offerContexts?.[productId] ?? { status: "unavailable", productId };
}

function bestCurrentPriceLabel(context: CompareOfferContextSummary) {
  if (context.status === "unavailable") {
    return "Offer context unavailable";
  }

  if (!context.bestCurrentPrice) {
    return "No current price loaded";
  }

  return `${context.bestCurrentPrice.price} ${context.bestCurrentPrice.currency} at ${
    context.bestCurrentPrice.merchantName ?? "Unknown merchant"
  }`;
}

function activeOfferCountLabel(context: CompareOfferContextSummary) {
  if (context.status === "unavailable") {
    return "Unavailable";
  }

  return context.hasMoreActiveOffers
    ? `${context.activeOfferCount} loaded; More available`
    : `${context.activeOfferCount} loaded`;
}

function couponSignalLabel(context: CompareOfferContextSummary) {
  if (context.status === "unavailable") {
    return "Unavailable";
  }

  if (context.hasMoreCoupons) {
    return "More coupons available";
  }

  return context.hasLoadedCoupons ? "Coupons available" : "No coupons loaded";
}

function priceRecencyLabel(context: CompareOfferContextSummary) {
  if (context.status === "unavailable") {
    return "Unavailable";
  }

  return dateLabel(context.latestPriceObservedAt) ?? "No price observations loaded";
}

function dateLabel(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : value.slice(0, 10);
}

function CompareSpecificationMatrix({
  products,
  specMode
}: {
  products: CompareProductSummary[];
  specMode: CompareSpecMode;
}) {
  if (products.length < 2) {
    return null;
  }

  const rows = buildSpecificationRows(products, specMode);
  const title = specificationMatrixTitle(specMode);

  return (
    <section>
      <h2>{title}</h2>
      {rows.length === 0 ? (
        <p>{emptySpecificationMatrixMessage(specMode)}</p>
      ) : (
        <table aria-label={title}>
          <thead>
            <tr>
              <th scope="col">Specification</th>
              {products.map((product) => (
                <th key={product.id} scope="col">
                  {product.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.code}>
                <th scope="row">{row.displayName}</th>
                {row.values.map((value, index) => (
                  <td key={`${row.code}-${products[index]?.id ?? index}`}>{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

interface CompareSpecificationRow {
  code: string;
  displayName: string;
  sortOrder: number | null;
  missingValues: boolean[];
  values: string[];
  comparisonValues: string[];
}

function buildSpecificationRows(
  products: CompareProductSummary[],
  specMode: CompareSpecMode
) {
  const rows = buildAllSpecificationRows(products);

  if (specMode === "all") {
    return rows;
  }

  if (specMode === "differences") {
    return rows.filter(hasSpecificationDifference);
  }

  return rows.filter((row) => row.missingValues.every((isMissing) => !isMissing));
}

function buildAllSpecificationRows(products: CompareProductSummary[]): CompareSpecificationRow[] {
  const [firstProduct, ...remainingProducts] = products;

  if (!firstProduct || remainingProducts.length === 0) {
    return [];
  }

  const attributeMaps = products.map((product) =>
    buildFirstAttributeByCode(product.currentAttributes)
  );
  const seenCodes = new Set<string>();
  const firstProductRows = firstProduct.currentAttributes.flatMap((attribute) => {
    if (seenCodes.has(attribute.code)) {
      return [];
    }

    seenCodes.add(attribute.code);

    return [
      buildSpecificationRow({
        attributeMaps,
        code: attribute.code,
        displayName: attribute.displayName
      })
    ];
  });
  const additionalRows = remainingProducts.flatMap((product) =>
    product.currentAttributes.flatMap((attribute) => {
      if (seenCodes.has(attribute.code)) {
        return [];
      }

      seenCodes.add(attribute.code);

      return [
        buildSpecificationRow({
          attributeMaps,
          code: attribute.code,
          displayName: attribute.displayName
        })
      ];
    })
  );

  return [...firstProductRows, ...additionalRows].sort(compareSpecificationRows);
}

function buildSpecificationRow({
  attributeMaps,
  code,
  displayName
}: {
  attributeMaps: Array<
    Map<string, CompareProductSummary["currentAttributes"][number]>
  >;
  code: string;
  displayName: string;
}): CompareSpecificationRow {
  const attributes = attributeMaps.map((attributesByCode) => attributesByCode.get(code));

  return {
    code,
    displayName,
    sortOrder: firstPresentSortOrder(attributes),
    missingValues: attributes.map((attribute) => !attribute),
    values: attributes.map((attribute) => attribute?.valueText ?? MISSING_ATTRIBUTE_VALUE),
    comparisonValues: attributes.map(buildAttributeComparisonValue)
  };
}

function hasSpecificationDifference(row: CompareSpecificationRow) {
  if (row.missingValues.some(Boolean)) {
    return true;
  }

  return new Set(row.comparisonValues).size > 1;
}

function compareSpecificationRows(
  firstRow: CompareSpecificationRow,
  secondRow: CompareSpecificationRow
) {
  const sortOrderComparison = compareSpecificationSortOrders(
    firstRow.sortOrder,
    secondRow.sortOrder
  );

  if (sortOrderComparison !== 0) {
    return sortOrderComparison;
  }

  const nameComparison = firstRow.displayName.localeCompare(secondRow.displayName);

  return nameComparison === 0 ? firstRow.code.localeCompare(secondRow.code) : nameComparison;
}

function compareSpecificationSortOrders(
  firstSortOrder: number | null,
  secondSortOrder: number | null
) {
  if (typeof firstSortOrder === "number" && typeof secondSortOrder === "number") {
    return firstSortOrder - secondSortOrder;
  }

  if (typeof firstSortOrder === "number") {
    return -1;
  }

  if (typeof secondSortOrder === "number") {
    return 1;
  }

  return 0;
}

function firstPresentSortOrder(
  attributes: Array<CompareProductSummary["currentAttributes"][number] | undefined>
) {
  return attributes.find((attribute) => typeof attribute?.sortOrder === "number")?.sortOrder ?? null;
}

function buildAttributeComparisonValue(
  attribute: CompareProductSummary["currentAttributes"][number] | undefined
) {
  if (!attribute) {
    return "missing";
  }

  if (typeof attribute.numericValue === "string" && attribute.numericValue.trim() !== "") {
    return `numeric:${normalizeDecimalComparisonValue(attribute.numericValue)}`;
  }

  if (typeof attribute.booleanValue === "boolean") {
    return `boolean:${attribute.booleanValue}`;
  }

  return `text:${attribute.valueText}`;
}

function normalizeDecimalComparisonValue(value: string) {
  const trimmedValue = value.trim();

  if (!/^-?\d+(\.\d+)?$/.test(trimmedValue)) {
    return trimmedValue;
  }

  const sign = trimmedValue.startsWith("-") ? "-" : "";
  const unsignedValue = sign ? trimmedValue.slice(1) : trimmedValue;
  const [integerPart, rawFractionPart = ""] = unsignedValue.split(".");
  const normalizedIntegerPart = integerPart.replace(/^0+(?=\d)/, "") || "0";
  const normalizedFractionPart = rawFractionPart.replace(/0+$/, "");

  return normalizedFractionPart
    ? `${sign}${normalizedIntegerPart}.${normalizedFractionPart}`
    : `${sign}${normalizedIntegerPart}`;
}

function specificationMatrixTitle(specMode: CompareSpecMode) {
  switch (specMode) {
    case "all":
      return "All specifications";
    case "differences":
      return "Different specifications";
    case "shared":
      return "Shared specifications";
  }
}

function emptySpecificationMatrixMessage(specMode: CompareSpecMode) {
  switch (specMode) {
    case "all":
      return "No specifications are available for these products yet.";
    case "differences":
      return "No specification differences across these products yet.";
    case "shared":
      return "No shared specifications across these products yet.";
  }
}

function buildFirstAttributeByCode(
  attributes: CompareProductSummary["currentAttributes"]
) {
  const attributesByCode = new Map<string, CompareProductSummary["currentAttributes"][number]>();

  for (const attribute of attributes ?? []) {
    if (!attributesByCode.has(attribute.code)) {
      attributesByCode.set(attribute.code, attribute);
    }
  }

  return attributesByCode;
}

export function CompareProductSummaryList({ products }: { products: CompareProductSummary[] }) {
  return (
    <ul>
      {products.map((product) => (
        <li key={product.id}>
          <article>
            <h2>{product.name}</h2>
            <p>{product.brandName ?? "Unknown brand"}</p>
            <p>{product.slug}</p>
            {product.description ? <p>{product.description}</p> : null}
          </article>
        </li>
      ))}
    </ul>
  );
}

function CompareProductCard({
  productQuery,
  selectedSlugs,
  selectedIndex,
  specMode,
  summary
}: {
  productQuery: Extract<CompareRouteLoaderData, { status: "ready" }>["productQueries"][number];
  selectedSlugs: readonly string[];
  selectedIndex: number;
  specMode: CompareSpecMode;
  summary: CompareProductSummary | undefined;
}) {
  const queryRef = useRoutePreloadedQuery<ProductDetailRouteQuery>(
    productDetailRouteQuery,
    productQuery
  );
  const data = usePreloadedQuery<ProductDetailRouteQuery>(productDetailRouteQuery, queryRef);
  const product = data.product;
  const removePath = buildComparePathAfterRemovingSlugIndex(selectedSlugs, selectedIndex, {
    specMode
  });

  if (!product) {
    return null;
  }

  return (
    <li>
      <article>
        <h2>{product.name}</h2>
        <p>{compareProductBrandName(product, summary)}</p>
        <p>{product.slug}</p>
        <CompareProductDescription description={product.description} />
        <ProductAttributeList
          attributes={product.currentAttributes}
          emptyMessage="No product attributes available yet."
        />
        <Link to={removePath}>Remove {product.name}</Link>
      </article>
    </li>
  );
}

function compareProductBrandName(
  product: NonNullable<ProductDetailRouteQuery["response"]["product"]>,
  summary: CompareProductSummary | undefined
) {
  return product.brand?.name ?? summary?.brandName ?? "Unknown brand";
}

function CompareProductDescription({ description }: { description: string | null | undefined }) {
  return description ? <p>{description}</p> : null;
}
