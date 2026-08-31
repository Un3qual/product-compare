import { Suspense, useState } from "react";
import { graphql, useLazyLoadQuery, usePaginationFragment } from "react-relay";
import type { CompareProductPickerBoundaryQuery } from "$generated/CompareProductPickerBoundaryQuery.graphql";
import type { CompareProductPickerBoundary_products$key } from "$generated/CompareProductPickerBoundary_products.graphql";
import type { CompareProductPickerPaginationQuery } from "$generated/CompareProductPickerPaginationQuery.graphql";
import { ResettableErrorBoundary } from "$relay/ResettableErrorBoundary";
import { FeedbackState } from "$ui/components/feedback/FeedbackState";
import { Button } from "$ui/primitives/Button";
import {
  availableComparePickerProducts,
  buildComparePickerOptions,
  comparePickerEmptyMessage,
  comparePickerResetToken,
  isComparePickerEmpty,
} from "./compare-picker";
import type { CompareSpecMode } from "../paths";
import { CompareProductPickerView } from "./CompareProductPickerView";

const COMPARE_PRODUCT_PICKER_PAGE_SIZE = 24;

export const compareProductPickerFragment = graphql`
  fragment CompareProductPickerBoundary_products on RootQueryType
  @argumentDefinitions(first: { type: "Int!" }, after: { type: "String" })
  @refetchable(queryName: "CompareProductPickerPaginationQuery") {
    products(first: $first, after: $after)
      @connection(key: "CompareProductPickerBoundary_products") {
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
    }
  }
`;

const compareProductPickerQuery = graphql`
  query CompareProductPickerBoundaryQuery($first: Int!, $after: String) {
    ...CompareProductPickerBoundary_products @arguments(first: $first, after: $after)
  }
`;

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
  const queryData = useLazyLoadQuery<CompareProductPickerBoundaryQuery>(
    compareProductPickerQuery,
    { first: COMPARE_PRODUCT_PICKER_PAGE_SIZE, after: null },
    { fetchPolicy: "store-or-network" },
  );
  const { data, hasNext, isLoadingNext, loadNext } = usePaginationFragment<
    CompareProductPickerPaginationQuery,
    CompareProductPickerBoundary_products$key
  >(compareProductPickerFragment, queryData);
  const [paginationFailed, setPaginationFailed] = useState(false);
  const productOptions = data.products?.edges.map(({ node }) => node) ?? [];
  const availableProducts = availableComparePickerProducts(productOptions, selectedSlugs);
  const options = buildComparePickerOptions(availableProducts, selectedSlugs, specMode);
  const loadMore = () => {
    setPaginationFailed(false);
    loadNext(COMPARE_PRODUCT_PICKER_PAGE_SIZE, {
      onComplete: (error) => setPaginationFailed(error !== null),
    });
  };

  if (isComparePickerEmpty(availableProducts, hasNext)) {
    return <p>{comparePickerEmptyMessage(selectedSlugs)}</p>;
  }

  return (
    <>
      <CompareProductPickerView
        heading={heading}
        isLoadingMore={isLoadingNext}
        onShowMore={hasNext && !paginationFailed ? loadMore : null}
        options={options}
      />
      {paginationFailed ? (
        <div role="alert">
          <p>More products unavailable.</p>
          <Button disabled={isLoadingNext} onClick={loadMore} type="button">
            Retry products
          </Button>
        </div>
      ) : null}
    </>
  );
}
