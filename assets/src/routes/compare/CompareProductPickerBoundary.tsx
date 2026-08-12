import { Suspense, useEffect, useMemo, useState } from "react";
import { graphql, useLazyLoadQuery } from "react-relay";
import type { CompareProductPickerBoundaryQuery } from "$generated/CompareProductPickerBoundaryQuery.graphql";
import { ResettableErrorBoundary } from "$relay/ResettableErrorBoundary";
import { FeedbackState } from "$ui/components/feedback/FeedbackState";
import {
  appendUniqueComparePickerProducts,
  availableComparePickerProducts,
  buildComparePickerOptions,
  comparePickerEmptyMessage,
  comparePickerResetToken,
  isComparePickerEmpty,
  nextComparePickerPageCursor,
} from "./compare-picker-data";
import type { CompareSpecMode } from "./paths";
import {
  CompareProductPickerView,
  type CompareProductPickerOption,
} from "./CompareProductPickerView";

const COMPARE_PRODUCT_PICKER_PAGE_SIZE = 24;
const compareProductPickerQuery = graphql`
  query CompareProductPickerBoundaryQuery($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      edges {
        node {
          id
          name
          slug
          brand {
            id
            name
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

type ComparePickerProduct = NonNullable<
  CompareProductPickerBoundaryQuery["response"]["products"]
>["edges"][number]["node"];

export function CompareProductPickerBoundary({
  heading = "Choose products",
  specMode,
  selectedSlugs,
}: {
  heading?: string;
  specMode: CompareSpecMode;
  selectedSlugs: readonly string[];
}) {
  const resetToken = comparePickerResetToken(specMode, selectedSlugs);

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
  selectedSlugs,
}: {
  heading: string;
  specMode: CompareSpecMode;
  selectedSlugs: readonly string[];
}) {
  const [after, setAfter] = useState<string | null>(null);
  const [loadedProducts, setLoadedProducts] = useState<ComparePickerProduct[]>([]);

  const data = useLazyLoadQuery<CompareProductPickerBoundaryQuery>(
    compareProductPickerQuery,
    { first: COMPARE_PRODUCT_PICKER_PAGE_SIZE, after },
    { fetchPolicy: "store-or-network" },
  );
  const productConnection = data.products;
  const pageProducts = useMemo(
    () => productConnection?.edges.map(({ node }) => node) ?? [],
    [productConnection],
  );
  const productOptions = appendUniqueComparePickerProducts(loadedProducts, pageProducts);
  const availableProducts = availableComparePickerProducts(productOptions, selectedSlugs);
  const nextCursor = nextComparePickerPageCursor(productConnection?.pageInfo, after);
  const options = buildComparePickerOptions(
    availableProducts,
    selectedSlugs,
    specMode,
  ) satisfies CompareProductPickerOption[];

  useEffect(() => {
    setLoadedProducts((products) => appendUniqueComparePickerProducts(products, pageProducts));
  }, [pageProducts]);

  if (isComparePickerEmpty(availableProducts, nextCursor)) {
    return <p>{comparePickerEmptyMessage(selectedSlugs)}</p>;
  }

  return (
    <CompareProductPickerView
      heading={heading}
      onShowMore={nextCursor ? () => setAfter(nextCursor) : null}
      options={options}
    />
  );
}
