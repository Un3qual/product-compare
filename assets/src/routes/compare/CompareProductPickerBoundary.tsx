import { Suspense, useEffect, useMemo, useState } from "react";
import { useLazyLoadQuery } from "react-relay";
import compareProductPickerQuery, {
  type CompareProductPickerQuery
} from "../../__generated__/CompareProductPickerQuery.graphql";
import { ResettableErrorBoundary } from "../../relay/ResettableErrorBoundary";
import { FeedbackState } from "../../ui/components/feedback/FeedbackState";
import { MAX_COMPARE_PRODUCTS, type CompareSpecMode } from "./loader";
import { buildComparePathFromSlugs } from "./paths";
import {
  CompareProductPickerView,
  type CompareProductPickerOption
} from "./CompareProductPickerView";

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
      fallback={<FeedbackState kind="error" title="Product picker unavailable." />}
    >
      <Suspense fallback={<FeedbackState kind="loading" title="Loading products..." />}>
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
  const options = availableProducts.map((product) => ({
    brandName: product.brand.name,
    href: buildComparePath(selectedSlugs, product.slug, specMode),
    id: product.id,
    name: product.name
  })) satisfies CompareProductPickerOption[];

  useEffect(() => {
    setLoadedProducts((products) => appendUniqueProducts(products, pageProducts));
  }, [pageProducts]);

  if (isEmptyProductPicker(availableProducts, nextCursor)) {
    return <p>{emptyProductPickerMessage(selectedSlugs)}</p>;
  }

  return (
    <CompareProductPickerView
      heading={heading}
      onShowMore={nextCursor ? () => setAfter(nextCursor) : null}
      options={options}
    />
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
