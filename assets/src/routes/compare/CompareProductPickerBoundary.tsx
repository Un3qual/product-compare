import { Suspense, useEffect, useMemo, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import { useLazyLoadQuery } from "react-relay";
import compareProductPickerQuery, {
  type CompareProductPickerQuery
} from "../../__generated__/CompareProductPickerQuery.graphql";
import { ResettableErrorBoundary } from "../../relay/ResettableErrorBoundary";
import { DataList, DataListItem } from "../../ui/components/data/DataList";
import { FeedbackState } from "../../ui/components/feedback/FeedbackState";
import { Button } from "../../ui/primitives/Button";
import { tokens } from "../../ui/theme/tokens.stylex";
import { MAX_COMPARE_PRODUCTS, type CompareSpecMode } from "./loader";
import { buildComparePathFromSlugs } from "./paths";

const COMPARE_PRODUCT_PICKER_PAGE_SIZE = 24;

const styles = create({
  picker: {
    display: "grid",
    gap: "1rem"
  },
  title: {
    fontSize: "1.25rem",
    margin: 0
  },
  option: {
    display: "grid",
    gap: "0.35rem"
  },
  optionTitle: {
    margin: 0
  },
  metadata: {
    color: tokens.textSecondary,
    margin: 0
  }
});

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

  useEffect(() => {
    setLoadedProducts((products) => appendUniqueProducts(products, pageProducts));
  }, [pageProducts]);

  if (isEmptyProductPicker(availableProducts, nextCursor)) {
    return <p>{emptyProductPickerMessage(selectedSlugs)}</p>;
  }

  return (
    <section {...props(styles.picker)}>
      <h2 {...props(styles.title)}>{heading}</h2>
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
    <DataList label="Products available to compare">
      {availableProducts.map((product) => (
        <DataListItem
          actions={
            <Button asChild variant="soft">
              <Link to={buildComparePath(selectedSlugs, product.slug, specMode)}>
                Compare {product.name}
              </Link>
            </Button>
          }
          key={product.id}
        >
          <div {...props(styles.option)}>
            <h3 {...props(styles.optionTitle)}>{product.name}</h3>
            <p {...props(styles.metadata)}>{product.brand.name}</p>
          </div>
        </DataListItem>
      ))}
    </DataList>
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
    <Button
      onClick={() => {
        onShowMore(nextCursor);
      }}
      type="button"
    >
      Show more products
    </Button>
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
