import { Suspense, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLazyLoadQuery } from "react-relay";
import compareProductPickerQuery, {
  type CompareProductPickerQuery
} from "../../__generated__/CompareProductPickerQuery.graphql";
import { ResettableErrorBoundary } from "../../relay/resettable-error-boundary";
import { MAX_COMPARE_PRODUCTS } from "./loader";
import { buildComparePathFromSlugs } from "./paths";

const COMPARE_PRODUCT_PICKER_PAGE_SIZE = 24;

type ComparePickerProduct =
  CompareProductPickerQuery["response"]["products"]["edges"][number]["node"];

export function CompareProductPickerBoundary({
  heading = "Choose products",
  selectedSlugs
}: {
  heading?: string;
  selectedSlugs: readonly string[];
}) {
  const resetToken = selectedSlugs.join("|");

  return (
    <ResettableErrorBoundary
      resetToken={resetToken}
      fallback={<p role="alert">Product picker unavailable.</p>}
    >
      <Suspense fallback={<p role="status">Loading products...</p>}>
        <CompareProductPicker
          heading={heading}
          key={resetToken}
          selectedSlugs={selectedSlugs}
        />
      </Suspense>
    </ResettableErrorBoundary>
  );
}

function CompareProductPicker({
  heading,
  selectedSlugs
}: {
  heading: string;
  selectedSlugs: readonly string[];
}) {
  const [after, setAfter] = useState<string | null>(null);
  const [loadedProducts, setLoadedProducts] = useState<ComparePickerProduct[]>([]);

  const data = useLazyLoadQuery<CompareProductPickerQuery>(
    compareProductPickerQuery,
    { first: COMPARE_PRODUCT_PICKER_PAGE_SIZE, after },
    { fetchPolicy: "store-or-network" }
  );
  const pageProducts = useMemo(
    () => data.products.edges.map(({ node }) => node),
    [data.products.edges]
  );
  const productOptions = appendUniqueProducts(loadedProducts, pageProducts);
  const selectedSlugSet = new Set(selectedSlugs);
  const availableProducts = productOptions.filter((product) => !selectedSlugSet.has(product.slug));
  const pageInfo = data.products.pageInfo ?? { hasNextPage: false, endCursor: null };
  const nextCursor = pageInfo.hasNextPage ? pageInfo.endCursor : null;

  useEffect(() => {
    setLoadedProducts((products) => appendUniqueProducts(products, pageProducts));
  }, [pageProducts]);

  if (availableProducts.length === 0 && !nextCursor) {
    const message =
      selectedSlugs.length === 0
        ? "No products are available to compare yet."
        : "No additional products are available to compare yet.";

    return <p>{message}</p>;
  }

  return (
    <section>
      <h2>{heading}</h2>
      {availableProducts.length > 0 ? (
        <ul>
          {availableProducts.map((product) => (
            <li key={product.id}>
              <h3>{product.name}</h3>
              <p>{product.brand.name}</p>
              <Link to={buildComparePath(selectedSlugs, product.slug)}>
                Compare {product.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>No additional products are available on this page.</p>
      )}
      {nextCursor ? (
        <button
          onClick={() => {
            setAfter(nextCursor);
          }}
          type="button"
        >
          Show more products
        </button>
      ) : null}
    </section>
  );
}

function buildComparePath(selectedSlugs: readonly string[], productSlug: string) {
  const nextSlugs = Array.from(new Set([...selectedSlugs, productSlug])).slice(
    0,
    MAX_COMPARE_PRODUCTS
  );

  return buildComparePathFromSlugs(nextSlugs);
}

function appendUniqueProducts(
  existingProducts: ComparePickerProduct[],
  newProducts: readonly ComparePickerProduct[]
) {
  if (newProducts.length === 0) {
    return existingProducts;
  }

  const seenProductIds = new Set(existingProducts.map((product) => product.id));
  const nextProducts = [...existingProducts];

  for (const product of newProducts) {
    if (seenProductIds.has(product.id)) {
      continue;
    }

    seenProductIds.add(product.id);
    nextProducts.push(product);
  }

  return nextProducts.length === existingProducts.length ? existingProducts : nextProducts;
}
