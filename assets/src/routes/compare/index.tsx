import { Suspense, useEffect, useId, useRef, useState } from "react";
import { Link, useLoaderData } from "react-router-dom";
import { useMutation, usePreloadedQuery } from "react-relay";
import createSavedComparisonSetMutation, {
  type CreateSavedComparisonSetMutation
} from "../../__generated__/CreateSavedComparisonSetMutation.graphql";
import { ResettableErrorBoundary } from "../../relay/resettable-error-boundary";
import { commitRouteMutation } from "../relay-mutations";
import {
  DEFAULT_ROUTE_ERROR_MESSAGE,
  hasRouteGraphQLErrors,
  routeMutationErrorMessage
} from "../route-errors";
import { CompareShell } from "./compare-shell";
import {
  compareLoader,
  MAX_COMPARE_PRODUCTS,
  type CompareProductSummary,
  type CompareRouteLoaderData
} from "./loader";
import {
  CompareProductList,
  CompareProductSummaryList
} from "./product-list";
import { CompareProductPickerBoundary } from "./product-picker";
import { buildComparePathAfterRemovingSlugIndex } from "./paths";
interface SaveFeedbackState {
  error: string | null;
  inFlightSelectionKey: string | null;
  message: string | null;
  selectionKey: string | null;
}

export function CompareRoute() {
  const loaderData = useLoaderData<typeof compareLoader>() as CompareRouteLoaderData;
  const selectionKey = JSON.stringify([loaderData.status, loaderData.slugs]);
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedbackState>({
    error: null,
    inFlightSelectionKey: null,
    message: null,
    selectionKey: null
  });
  const isSaveInFlightRef = useRef(false);
  const activeSelectionKeyRef = useRef<string | null>(null);
  const activeSaveRequestRef = useRef<{ id: number; selectionKey: string } | null>(null);
  const nextSaveRequestIdRef = useRef(0);
  const [commitCreateSavedComparisonSet] =
    useMutation<CreateSavedComparisonSetMutation>(createSavedComparisonSetMutation);
  const activeSaveFeedback =
    saveFeedback.selectionKey === selectionKey
      ? saveFeedback
      : {
          error: null,
          inFlightSelectionKey: null,
          message: null
        };

  if (activeSelectionKeyRef.current !== selectionKey) {
    activeSelectionKeyRef.current = selectionKey;
    activeSaveRequestRef.current = null;
    isSaveInFlightRef.current = false;
  }

  useEffect(() => {
    setSaveFeedback((currentSaveFeedback) =>
      currentSaveFeedback.selectionKey === null ||
      currentSaveFeedback.selectionKey === selectionKey
        ? currentSaveFeedback
        : {
            error: null,
            inFlightSelectionKey: null,
            message: null,
            selectionKey: null
          }
    );
  }, [selectionKey]);

  function handleSave() {
    if (loaderData.status !== "ready") {
      return;
    }

    if (isSaveInFlightRef.current) {
      return;
    }

    isSaveInFlightRef.current = true;
    const saveRequest = {
      id: nextSaveRequestIdRef.current + 1,
      selectionKey
    };
    nextSaveRequestIdRef.current = saveRequest.id;
    activeSaveRequestRef.current = saveRequest;
    setSaveFeedback({
      error: null,
      inFlightSelectionKey: selectionKey,
      message: null,
      selectionKey
    });

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
            setSaveFeedback({
              error: null,
              inFlightSelectionKey: null,
              message: "Comparison saved.",
              selectionKey
            });
          } else {
            setSaveFeedback({
              error: routeMutationErrorMessage(payload?.errors, graphQLErrors),
              inFlightSelectionKey: null,
              message: null,
              selectionKey
            });
          }

          activeSaveRequestRef.current = null;
          isSaveInFlightRef.current = false;
        },
        onError: () => {
          if (!isActiveSaveRequest(activeSaveRequestRef.current, saveRequest)) {
            return;
          }

          setSaveFeedback({
            error: DEFAULT_ROUTE_ERROR_MESSAGE,
            inFlightSelectionKey: null,
            message: null,
            selectionKey
          });
          activeSaveRequestRef.current = null;
          isSaveInFlightRef.current = false;
        }
      },
      () => {
        if (!isActiveSaveRequest(activeSaveRequestRef.current, saveRequest)) {
          return;
        }

        setSaveFeedback({
          error: DEFAULT_ROUTE_ERROR_MESSAGE,
          inFlightSelectionKey: null,
          message: null,
          selectionKey
        });
        activeSaveRequestRef.current = null;
        isSaveInFlightRef.current = false;
      }
    );
  }

  if (loaderData.status === "ready") {
    const saveInFlight = activeSaveFeedback.inFlightSelectionKey === selectionKey;

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
          {activeSaveFeedback.message ?? ""}
        </p>
        {activeSaveFeedback.error ? <p role="alert">{activeSaveFeedback.error}</p> : null}
        <CompareSelectionTray
          products={loaderData.products}
          selectedSlugs={loaderData.slugs}
        />
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
          <CompareProductPickerBoundary
            heading="Add another product"
            selectedSlugs={loaderData.slugs}
          />
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

function CompareSelectionTray({
  products,
  selectedSlugs
}: {
  products: CompareProductSummary[];
  selectedSlugs: readonly string[];
}) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId}>
      <h2 id={titleId}>Selected products</h2>
      <p>
        {products.length} of {MAX_COMPARE_PRODUCTS} products selected.
      </p>
      <ul>
        {products.map((product, index) => (
          <li key={`${product.id}-${selectedSlugs[index] ?? index}`}>
            <span>{product.name}</span>{" "}
            <Link to={buildComparePathAfterRemovingSlugIndex(selectedSlugs, index)}>
              Remove {product.name} from selection
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
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
