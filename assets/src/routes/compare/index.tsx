import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { useLoaderData } from "react-router-dom";
import { useMutation, usePreloadedQuery } from "react-relay";
import createSavedComparisonSetMutation, {
  type CreateSavedComparisonSetMutation
} from "../../__generated__/CreateSavedComparisonSetMutation.graphql";
import productDetailRouteQuery, {
  type ProductDetailRouteQuery
} from "../../__generated__/ProductDetailRouteQuery.graphql";
import { useRoutePreloadedQuery } from "../../relay/route-preload";
import { CompareShell } from "./compare-shell";
import { compareLoader, type CompareProductSummary, type CompareRouteLoaderData } from "./loader";

export function CompareRoute() {
  const loaderData = useLoaderData<typeof compareLoader>() as CompareRouteLoaderData;
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const isSaveInFlightRef = useRef(false);
  const [commitCreateSavedComparisonSet, isMutationInFlight] =
    useMutation<CreateSavedComparisonSetMutation>(createSavedComparisonSetMutation);
  const selectionKey = JSON.stringify([loaderData.status, loaderData.slugs]);

  useEffect(() => {
    isSaveInFlightRef.current = false;
    setSaveMessage(null);
    setSaveError(null);
  }, [selectionKey]);

  function handleSave() {
    if (loaderData.status !== "ready") {
      return;
    }

    if (isSaveInFlightRef.current) {
      return;
    }

    isSaveInFlightRef.current = true;
    setSaveMessage(null);
    setSaveError(null);

    commitCreateSavedComparisonSet({
      variables: {
        input: {
          name: buildSavedComparisonName(loaderData.products),
          productIds: loaderData.products.map((product) => product.id)
        }
      },
      onCompleted: (response) => {
        const payload = response.createSavedComparisonSet;

        if (payload?.savedComparisonSet?.id) {
          setSaveMessage("Comparison saved.");
          setSaveError(null);
        } else {
          setSaveError(payload?.errors?.[0]?.message ?? "Request failed. Please try again.");
        }

        isSaveInFlightRef.current = false;
      },
      onError: () => {
        setSaveError("Request failed. Please try again.");
        isSaveInFlightRef.current = false;
      }
    });
  }

  if (loaderData.status === "ready") {
    const saveInFlight = isMutationInFlight;

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
      </CompareShell>
    );
  }

  return (
    <CompareShell title="Compare products">
      {loaderData.status === "empty" ? <p>Choose up to 3 products to compare.</p> : null}
      {loaderData.status === "too_many" ? <p>You can compare up to 3 products.</p> : null}
      {loaderData.status === "not_found" ? (
        <p>One or more selected products were not found.</p>
      ) : null}
    </CompareShell>
  );
}

type ResettableErrorBoundaryState = {
  hasError: boolean;
  resetToken: unknown;
};

class ResettableErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; resetToken: unknown },
  ResettableErrorBoundaryState
> {
  constructor(props: { children: ReactNode; fallback: ReactNode; resetToken: unknown }) {
    super(props);
    this.state = {
      hasError: false,
      resetToken: props.resetToken
    };
  }

  static getDerivedStateFromProps(
    props: { resetToken: unknown },
    state: ResettableErrorBoundaryState
  ): Partial<ResettableErrorBoundaryState> | null {
    if (props.resetToken === state.resetToken) {
      return null;
    }

    return {
      hasError: false,
      resetToken: props.resetToken
    };
  }

  static getDerivedStateFromError(): Partial<ResettableErrorBoundaryState> {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
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
      </article>
    </li>
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
