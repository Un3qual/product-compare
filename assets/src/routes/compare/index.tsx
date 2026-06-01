import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLoaderData } from "react-router-dom";
import { useLazyLoadQuery, useMutation, usePreloadedQuery } from "react-relay";
import compareProductPickerQuery, {
  type CompareProductPickerQuery
} from "../../__generated__/CompareProductPickerQuery.graphql";
import createSavedComparisonSetMutation, {
  type CreateSavedComparisonSetMutation
} from "../../__generated__/CreateSavedComparisonSetMutation.graphql";
import productDetailRouteQuery, {
  type ProductDetailRouteQuery
} from "../../__generated__/ProductDetailRouteQuery.graphql";
import { useRoutePreloadedQuery } from "../../relay/route-preload";
import { ResettableErrorBoundary } from "../../relay/resettable-error-boundary";
import { commitRouteMutation } from "../relay-mutations";
import {
  DEFAULT_ROUTE_ERROR_MESSAGE,
  hasRouteGraphQLErrors,
  routeMutationErrorMessage
} from "../route-errors";
import { ProductAttributeList } from "../products/product-attribute-list";
import { CompareShell } from "./compare-shell";
import {
  compareLoader,
  MAX_COMPARE_PRODUCTS,
  type CompareProductSummary,
  type CompareRouteLoaderData
} from "./loader";

const COMPARE_PRODUCT_PICKER_PAGE_SIZE = 24;

type ComparePickerProduct =
  CompareProductPickerQuery["response"]["products"]["edges"][number]["node"];

export function CompareRoute() {
  const loaderData = useLoaderData<typeof compareLoader>() as CompareRouteLoaderData;
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveInFlightSelectionKey, setSaveInFlightSelectionKey] = useState<string | null>(null);
  const isSaveInFlightRef = useRef(false);
  const activeSelectionKeyRef = useRef<string | null>(null);
  const activeSaveRequestRef = useRef<{ id: number; selectionKey: string } | null>(null);
  const nextSaveRequestIdRef = useRef(0);
  const [commitCreateSavedComparisonSet] =
    useMutation<CreateSavedComparisonSetMutation>(createSavedComparisonSetMutation);
  const selectionKey = JSON.stringify([loaderData.status, loaderData.slugs]);

  if (activeSelectionKeyRef.current !== selectionKey) {
    activeSelectionKeyRef.current = selectionKey;
    activeSaveRequestRef.current = null;
    isSaveInFlightRef.current = false;
  }

  useEffect(() => {
    setSaveMessage(null);
    setSaveError(null);
    setSaveInFlightSelectionKey(null);
  }, [selectionKey]);

  function handleSave() {
    if (loaderData.status !== "ready") {
      return;
    }

    if (isSaveInFlightRef.current) {
      return;
    }

    isSaveInFlightRef.current = true;
    setSaveInFlightSelectionKey(selectionKey);
    const saveRequest = {
      id: nextSaveRequestIdRef.current + 1,
      selectionKey
    };
    nextSaveRequestIdRef.current = saveRequest.id;
    activeSaveRequestRef.current = saveRequest;
    setSaveMessage(null);
    setSaveError(null);

    commitRouteMutation(
      commitCreateSavedComparisonSet,
      {
        variables: {
          input: {
            name: buildSavedComparisonName(loaderData.products),
            productIds: loaderData.products.map((product) => product.id)
          }
        },
        onCompleted: (response, graphQLErrors) => {
          if (!isActiveSaveRequest(activeSaveRequestRef.current, saveRequest)) {
            return;
          }

          const payload = response.createSavedComparisonSet;

          if (
            payload?.savedComparisonSet?.id &&
            !hasRouteGraphQLErrors(graphQLErrors)
          ) {
            setSaveMessage("Comparison saved.");
            setSaveError(null);
          } else {
            setSaveError(routeMutationErrorMessage(payload?.errors, graphQLErrors));
          }

          activeSaveRequestRef.current = null;
          isSaveInFlightRef.current = false;
          setSaveInFlightSelectionKey(null);
        },
        onError: () => {
          if (!isActiveSaveRequest(activeSaveRequestRef.current, saveRequest)) {
            return;
          }

          setSaveError(DEFAULT_ROUTE_ERROR_MESSAGE);
          activeSaveRequestRef.current = null;
          isSaveInFlightRef.current = false;
          setSaveInFlightSelectionKey(null);
        }
      },
      () => {
        if (!isActiveSaveRequest(activeSaveRequestRef.current, saveRequest)) {
          return;
        }

        setSaveError(DEFAULT_ROUTE_ERROR_MESSAGE);
        activeSaveRequestRef.current = null;
        isSaveInFlightRef.current = false;
        setSaveInFlightSelectionKey(null);
      }
    );
  }

  if (loaderData.status === "ready") {
    const saveInFlight = saveInFlightSelectionKey === selectionKey;

    return (
      <CompareShell
        actions={
          <button disabled={saveInFlight} onClick={handleSave} type="button">
            {saveInFlight ? "Saving comparison..." : "Save comparison"}
          </button>
        }
        title="Compare products"
      >
        <p aria-live="polite" role="status">
          {saveMessage ?? ""}
        </p>
        {saveError ? <p role="alert">{saveError}</p> : null}
        <ResettableErrorBoundary
          resetToken={loaderData.productQueries}
          fallback={
            <>
              <p role="alert">Comparison details unavailable.</p>
              <CompareProductSummaryList products={loaderData.products} />
            </>
          }
        >
          <Suspense fallback={<p role="status">Loading comparison...</p>}>
            <CompareProductList loaderData={loaderData} />
          </Suspense>
        </ResettableErrorBoundary>
        {loaderData.slugs.length < MAX_COMPARE_PRODUCTS ? (
          <CompareProductPickerBoundary selectedSlugs={loaderData.slugs} />
        ) : null}
      </CompareShell>
    );
  }

  return (
    <CompareShell title="Compare products">
      {loaderData.status === "empty" ? (
        <CompareProductPickerBoundary selectedSlugs={loaderData.slugs} />
      ) : null}
      {loaderData.status === "too_many" ? (
        <p>You can compare up to {MAX_COMPARE_PRODUCTS} products.</p>
      ) : null}
      {loaderData.status === "not_found" ? (
        <p>One or more selected products were not found.</p>
      ) : null}
    </CompareShell>
  );
}

function CompareProductPickerBoundary({ selectedSlugs }: { selectedSlugs: readonly string[] }) {
  const resetToken = selectedSlugs.join("|");

  return (
    <ResettableErrorBoundary
      resetToken={resetToken}
      fallback={<p role="alert">Product picker unavailable.</p>}
    >
      <Suspense fallback={<p role="status">Loading products...</p>}>
        <CompareProductPicker key={resetToken} selectedSlugs={selectedSlugs} />
      </Suspense>
    </ResettableErrorBoundary>
  );
}

function CompareProductPicker({ selectedSlugs }: { selectedSlugs: readonly string[] }) {
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
      <h2>Choose products</h2>
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

function CompareProductList({
  loaderData
}: {
  loaderData: Extract<CompareRouteLoaderData, { status: "ready" }>;
}) {
  return (
    <ul>
      {loaderData.productQueries.map((productQuery, index) => (
        <CompareProductCard
          key={loaderData.slugs[index] ?? productQuery.__relayQuery.operationName}
          productQuery={productQuery}
          summary={loaderData.products[index]}
        />
      ))}
    </ul>
  );
}

function CompareProductSummaryList({ products }: { products: CompareProductSummary[] }) {
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
  summary
}: {
  productQuery: Extract<CompareRouteLoaderData, { status: "ready" }>["productQueries"][number];
  summary: CompareProductSummary | undefined;
}) {
  const queryRef = useRoutePreloadedQuery<ProductDetailRouteQuery>(
    productDetailRouteQuery,
    productQuery
  );
  const data = usePreloadedQuery<ProductDetailRouteQuery>(productDetailRouteQuery, queryRef);
  const product = data.product;

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
      </article>
    </li>
  );
}

function buildComparePath(selectedSlugs: readonly string[], productSlug: string) {
  const params = new URLSearchParams();
  const nextSlugs = Array.from(new Set([...selectedSlugs, productSlug])).slice(
    0,
    MAX_COMPARE_PRODUCTS
  );

  for (const slug of nextSlugs) {
    params.append("slug", slug);
  }

  return `/compare?${params.toString()}`;
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

function isActiveSaveRequest(
  activeSaveRequest: { id: number; selectionKey: string } | null,
  saveRequest: { id: number; selectionKey: string }
) {
  return (
    activeSaveRequest?.id === saveRequest.id &&
    activeSaveRequest.selectionKey === saveRequest.selectionKey
  );
}

function buildSavedComparisonName(
  products: Array<{
    name: string;
  }>
) {
  const productNames = products
    .map((product) => product.name.trim())
    .filter((name) => name !== "");

  if (productNames.length === 0) {
    return "Saved comparison";
  }

  if (productNames.length === 1) {
    return `${productNames[0]} comparison`;
  }

  return productNames.join(" vs ");
}
