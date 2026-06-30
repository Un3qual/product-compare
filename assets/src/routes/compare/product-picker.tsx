import { Suspense, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLazyLoadQuery } from "react-relay";
import compareProductPickerQuery, {
  type CompareProductPickerQuery
} from "../../__generated__/CompareProductPickerQuery.graphql";
import { ResettableErrorBoundary } from "../../relay/resettable-error-boundary";
import { MAX_COMPARE_PRODUCTS, type CompareSpecMode } from "./loader";
import { buildComparePathFromSlugs } from "./paths";

const COMPARE_PRODUCT_PICKER_PAGE_SIZE = 24;

type ComparePickerProduct =
  CompareProductPickerQuery["response"]["products"]["edges"][number]["node"];

export function CompareProductPickerBoundary({
  heading = "Choose products",
  specMode,
  selectedSlugs
}: {
  heading?: string;
  specMode: CompareSpecMode;
  selectedSlugs: readonly string[];
}) {
  const resetToken = `${specMode}:${selectedSlugs.join("|")}`;

  return (
    <ResettableErrorBoundary
      resetToken={resetToken}
      fallback={<p role="alert">Product picker unavailable.</p>}
    >
      <Suspense fallback={<p role="status">Loading products...</p>}>
        <CompareProductPicker
          heading={heading}
          key={resetToken}
          specMode={specMode}
          selectedSlugs={selectedSlugs}
        />
      </Suspense>
    </ResettableErrorBoundary>
  );
}

function CompareProductPicker({
  heading,
  specMode,
  selectedSlugs
}: {
  heading: string;
  specMode: CompareSpecMode;
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
  const nextCursor = nextProductPageCursor(data.products.pageInfo);

  useEffect(() => {
    setLoadedProducts((products) => appendUniqueProducts(products, pageProducts));
  }, [pageProducts]);

  if (isEmptyProductPicker(availableProducts, nextCursor)) {
    return <p>{emptyProductPickerMessage(selectedSlugs)}</p>;
  }

  return (
    <section>
      <h2>{heading}</h2>
      <CompareProductPickerOptions
        availableProducts={availableProducts}
        specMode={specMode}
        selectedSlugs={selectedSlugs}
      />
      <ShowMoreProductsButton nextCursor={nextCursor} onShowMore={setAfter} />
    </section>
  );
}

function nextProductPageCursor(
  pageInfo: CompareProductPickerQuery["response"]["products"]["pageInfo"] | null | undefined
) {
  return pageInfo?.hasNextPage ? pageInfo.endCursor : null;
}

function isEmptyProductPicker(
  availableProducts: readonly ComparePickerProduct[],
  nextCursor: string | null | undefined
) {
  return availableProducts.length === 0 && !nextCursor;
}

function emptyProductPickerMessage(selectedSlugs: readonly string[]) {
  return selectedSlugs.length === 0
    ? "No products are available to compare yet."
    : "No additional products are available to compare yet.";
}

function CompareProductPickerOptions({
  availableProducts,
  specMode,
  selectedSlugs
}: {
  availableProducts: readonly ComparePickerProduct[];
  specMode: CompareSpecMode;
  selectedSlugs: readonly string[];
}) {
  if (availableProducts.length === 0) {
    return <p>No additional products are available on this page.</p>;
  }

  return (
    <ul>
      {availableProducts.map((product) => (
        <li key={product.id}>
          <h3>{product.name}</h3>
          <p>{product.brand.name}</p>
          <Link to={buildComparePath(selectedSlugs, product.slug, specMode)}>
            Compare {product.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ShowMoreProductsButton({
  nextCursor,
  onShowMore
}: {
  nextCursor: string | null | undefined;
  onShowMore: (nextCursor: string) => void;
}) {
  if (!nextCursor) {
    return null;
  }

  return (
    <button
      onClick={() => {
        onShowMore(nextCursor);
      }}
      type="button"
    >
      Show more products
    </button>
  );
}

function buildComparePath(
  selectedSlugs: readonly string[],
  productSlug: string,
  specMode: CompareSpecMode
) {
  const nextSlugs = Array.from(new Set([...selectedSlugs, productSlug])).slice(
    0,
    MAX_COMPARE_PRODUCTS
  );

  return buildComparePathFromSlugs(nextSlugs, { specMode });
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
