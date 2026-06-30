import { Link } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import productDetailRouteQuery, {
  type ProductDetailRouteQuery
} from "../../__generated__/ProductDetailRouteQuery.graphql";
import { useRoutePreloadedQuery } from "../../relay/route-preload";
import { ProductAttributeList } from "../products/product-attribute-list";
import type { CompareProductSummary, CompareRouteLoaderData } from "./loader";

export function CompareProductList({
  loaderData
}: {
  loaderData: Extract<CompareRouteLoaderData, { status: "ready" }>;
}) {
  return (
    <>
      <SharedAttributeMatrix products={loaderData.products} />
      <ul>
        {loaderData.productQueries.map((productQuery, index) => (
          <CompareProductCard
            key={loaderData.slugs[index] ?? productQuery.__relayQuery.operationName}
            productQuery={productQuery}
            summary={loaderData.products[index]}
            selectedSlugs={loaderData.slugs}
            selectedIndex={index}
          />
        ))}
      </ul>
    </>
  );
}

function SharedAttributeMatrix({ products }: { products: CompareProductSummary[] }) {
  if (products.length < 2) {
    return null;
  }

  const rows = buildSharedAttributeRows(products);

  return (
    <section>
      <h2>Shared specifications</h2>
      {rows.length === 0 ? (
        <p>No shared specifications across these products yet.</p>
      ) : (
        <table aria-label="Shared specifications">
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

function buildSharedAttributeRows(products: CompareProductSummary[]) {
  const [firstProduct, ...remainingProducts] = products;

  if (!firstProduct || remainingProducts.length === 0) {
    return [];
  }

  const attributeMaps = products.map((product) =>
    buildFirstAttributeByCode(product.currentAttributes)
  );
  const seenCodes = new Set<string>();

  return firstProduct.currentAttributes.flatMap((attribute) => {
    if (seenCodes.has(attribute.code)) {
      return [];
    }

    seenCodes.add(attribute.code);
    const sharedAttributes = attributeMaps.map((attributesByCode) =>
      attributesByCode.get(attribute.code)
    );

    if (sharedAttributes.some((sharedAttribute) => !sharedAttribute)) {
      return [];
    }

    return [
      {
        code: attribute.code,
        displayName: attribute.displayName,
        values: sharedAttributes.map((sharedAttribute) => sharedAttribute?.valueText ?? "")
      }
    ];
  });
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
  summary
}: {
  productQuery: Extract<CompareRouteLoaderData, { status: "ready" }>["productQueries"][number];
  selectedSlugs: readonly string[];
  selectedIndex: number;
  summary: CompareProductSummary | undefined;
}) {
  const queryRef = useRoutePreloadedQuery<ProductDetailRouteQuery>(
    productDetailRouteQuery,
    productQuery
  );
  const data = usePreloadedQuery<ProductDetailRouteQuery>(productDetailRouteQuery, queryRef);
  const product = data.product;
  const removePath = buildComparePathAfterRemovingSlugIndex(selectedSlugs, selectedIndex);

  if (!product) {
    return null;
  }

  return (
    <li>
      <article>
        <h2>{product.name}</h2>
        <p>{product.brand?.name ?? summary?.brandName ?? "Unknown brand"}</p>
        <p>{product.slug}</p>
        {product.description ? <p>{product.description}</p> : null}
        <ProductAttributeList
          attributes={product.currentAttributes}
          emptyMessage="No product attributes available yet."
        />
        <Link to={removePath}>Remove {product.name}</Link>
      </article>
    </li>
  );
}

export function buildComparePathAfterRemovingSlugIndex(
  selectedSlugs: readonly string[],
  removeIndex: number
) {
  const nextSelectedSlugs = selectedSlugs.filter((_, index) => index !== removeIndex);

  return buildComparePathFromSlugs(nextSelectedSlugs);
}

function buildComparePathFromSlugs(selectedSlugs: readonly string[]) {
  const params = new URLSearchParams();

  for (const slug of selectedSlugs) {
    params.append("slug", slug);
  }

  const nextQueryString = params.toString();

  return nextQueryString.length > 0 ? `/compare?${nextQueryString}` : "/compare";
}
