import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import {
  useLoaderData,
  useLocation,
  useOutletContext,
  type LoaderFunctionArgs,
} from "react-router-dom";
import { graphql, useMutation, usePreloadedQuery } from "react-relay";
import type { CompareRouteCreateSavedComparisonSetMutation } from "$generated/CompareRouteCreateSavedComparisonSetMutation.graphql";
import type {
  CompareRouteQuery,
  CompareRouteQuery$data,
} from "$generated/CompareRouteQuery.graphql";
import { ResettableErrorBoundary } from "$relay/ResettableErrorBoundary";
import {
  fetchRouteQuery,
  getRelayEnvironmentFromRouterContext,
  useRoutePreloadedQuery,
} from "$relay/route-preload";
import { FeedbackState } from "$ui/components/feedback/FeedbackState";
import { tokens } from "$ui/theme/tokens.stylex";
import { commitRouteMutation } from "$relay/mutations";
import { normalizeRouteLoaderThrownError } from "$relay/loader-errors";
import { DEFAULT_MUTATION_ERROR_MESSAGE } from "$relay/mutation-errors";
import type { RootViewer } from "../root/viewer";
import {
  PENDING_INTENT_TTL_MS,
  consumePendingIntent,
  readPendingIntent,
  safeRelativeReturnPath,
  useAuthenticatedIntent,
  type SaveComparisonIntent,
} from "../auth/continuity";
import { CompareShell } from "./CompareShell";
import {
  compareQueryViewData,
  compareSpecModeFromUrl,
  COMPARE_OFFER_CONTEXT_PAGE_SIZE,
  MAX_COMPARE_PRODUCTS,
  type CompareRouteLoaderData,
} from "./compare-route-data";
import { CompareProductList } from "./CompareProductList";
import { CompareProductPickerBoundary } from "./CompareProductPickerBoundary";
import { selectedCompareSlugsFromSearch } from "./paths";
import { ComparisonToolbar } from "./live/ComparisonToolbar";
import { ProductDecisionSummaries } from "./live/ProductDecisionSummaries";
import {
  buildSavedComparisonSetMutationInput,
  resolveSavedComparisonSetMutationOutcome,
} from "./saved-comparison-mutation-data";

export {
  recommendationProfileFromUrl,
  shouldRevalidateCompareLoader,
  type RecommendationProfile,
} from "./recommendation-route-data";

const compareRouteQuery = graphql`
  query CompareRouteQuery($slugs: [String!]!, $offerFirst: Int!) {
    comparisonProducts(slugs: $slugs) {
      id
      name
      slug
      description
      brand {
        id
        name
      }
      currentAttributes {
        attributeId
        code
        displayName
        dataType
        valueText
        sortOrder
        groupLabel
        isRequired
        numericValue
        booleanValue
        enumOptionId
        unitSymbol
      }
      merchantProducts(first: $offerFirst, activeOnly: true) {
        edges {
          node {
            id
            currency
            merchant {
              id
              name
              domain
            }
            latestPrice {
              id
              price
              observedAt
            }
            activeCoupons(first: 2) {
              edges {
                node {
                  code
                  discountType
                  discountValue
                  currency
                  validTo
                }
              }
              pageInfo {
                hasNextPage
              }
            }
            priceHistory(first: 3) {
              edges {
                node {
                  id
                  price
                  observedAt
                }
              }
              pageInfo {
                hasNextPage
              }
            }
          }
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
      ...CompareProductList_product
    }
  }
`;

const createSavedComparisonSetMutation = graphql`
  mutation CompareRouteCreateSavedComparisonSetMutation($input: CreateSavedComparisonSetInput!) {
    createSavedComparisonSet(input: $input) {
      savedComparisonSet {
        id
      }
      errors {
        code
        field
        message
      }
    }
  }
`;

const styles = create({
  workspace: {
    display: "grid",
    gap: tokens.workspaceGap,
    minWidth: 0,
  },
});

interface SaveFeedbackState {
  error: string | null;
  isInFlight: boolean;
  message: string | null;
}

export async function compareLoader({
  context,
  request,
}: LoaderFunctionArgs): Promise<CompareRouteLoaderData> {
  const slugs = selectedCompareSlugsFromSearch(new URL(request.url).search);
  const specMode = compareSpecModeFromUrl(request.url);

  if (slugs.length === 0) return { status: "empty", specMode, slugs: [] };
  if (slugs.length > MAX_COMPARE_PRODUCTS) return { status: "too_many", specMode, slugs };

  const environment = getRelayEnvironmentFromRouterContext(context);

  try {
    const fetchedQuery = await fetchRouteQuery<CompareRouteQuery>(
      environment,
      compareRouteQuery,
      { slugs, offerFirst: COMPARE_OFFER_CONTEXT_PAGE_SIZE },
      { signal: request.signal },
    );
    const viewData = compareQueryViewData(slugs, fetchedQuery.data);

    if (!viewData) {
      fetchedQuery.dispose();
      return { status: "not_found", specMode, slugs };
    }

    return {
      status: "ready",
      specMode,
      slugs,
      query: fetchedQuery.descriptor,
      ...viewData,
    };
  } catch (error) {
    throw normalizeRouteLoaderThrownError(error, "Comparison fetch failed");
  }
}

export function CompareRoute() {
  const loaderData = useLoaderData<typeof compareLoader>();
  const selectionKey = JSON.stringify([loaderData.status, loaderData.slugs]);

  return <CompareSelectionRoute key={selectionKey} loaderData={loaderData} />;
}

function CompareSelectionRoute({ loaderData }: { loaderData: CompareRouteLoaderData }) {
  const outletContext = useOutletContext<{ viewer: RootViewer | null } | null>();
  const viewer = outletContext?.viewer;
  const [pendingIntent] = useState(() => (viewer ? readPendingIntent() : null));
  const restoredComparison =
    loaderData.status === "ready" &&
    pendingIntent?.kind === "save_comparison" &&
    orderedValuesEqual(
      pendingIntent.productIds,
      loaderData.products.map(({ id }) => id),
    );
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedbackState>({
    error: null,
    isInFlight: false,
    message: restoredComparison
      ? "Your comparison draft was restored. Review it before saving the comparison."
      : null,
  });
  const isSaveInFlightRef = useRef(false);
  const activeSaveRequestRef = useRef<{ id: number } | null>(null);
  const nextSaveRequestIdRef = useRef(0);
  const [commitCreateSavedComparisonSet] =
    useMutation<CompareRouteCreateSavedComparisonSetMutation>(createSavedComparisonSetMutation);

  useEffect(() => {
    if (viewer && pendingIntent?.kind === "save_comparison") consumePendingIntent();
  }, [pendingIntent, viewer]);

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
    };
    nextSaveRequestIdRef.current = saveRequest.id;
    activeSaveRequestRef.current = saveRequest;
    setSaveFeedback({
      error: null,
      isInFlight: true,
      message: null,
    });

    commitRouteMutation(
      commitCreateSavedComparisonSet,
      {
        variables: {
          input: buildSavedComparisonSetMutationInput(loaderData.products),
        },
        onCompleted: (response, graphQLErrors) => {
          if (!isActiveSaveRequest(activeSaveRequestRef.current, saveRequest)) {
            return;
          }

          const outcome = resolveSavedComparisonSetMutationOutcome(
            response.createSavedComparisonSet,
            graphQLErrors,
          );

          setSaveFeedback({ ...outcome, isInFlight: false });

          activeSaveRequestRef.current = null;
          isSaveInFlightRef.current = false;
        },
        onError: () => {
          if (!isActiveSaveRequest(activeSaveRequestRef.current, saveRequest)) {
            return;
          }

          setSaveFeedback({
            error: DEFAULT_MUTATION_ERROR_MESSAGE,
            isInFlight: false,
            message: null,
          });
          activeSaveRequestRef.current = null;
          isSaveInFlightRef.current = false;
        },
      },
      () => {
        if (!isActiveSaveRequest(activeSaveRequestRef.current, saveRequest)) {
          return;
        }

        setSaveFeedback({
          error: DEFAULT_MUTATION_ERROR_MESSAGE,
          isInFlight: false,
          message: null,
        });
        activeSaveRequestRef.current = null;
        isSaveInFlightRef.current = false;
      },
    );
  }

  if (loaderData.status === "ready") {
    return (
      <ReadyCompareSelectionRoute
        loaderData={loaderData}
        onSave={handleSave}
        saveFeedback={saveFeedback}
        viewer={viewer}
      />
    );
  }

  return (
    <CompareShell title="Compare products">
      {loaderData.status === "empty" ? (
        <CompareProductPickerBoundary
          specMode={loaderData.specMode}
          selectedSlugs={loaderData.slugs}
        />
      ) : null}
      {loaderData.status === "too_many" ? (
        <FeedbackState
          kind="warning"
          title={`You can compare up to ${MAX_COMPARE_PRODUCTS} products.`}
        />
      ) : null}
      {loaderData.status === "not_found" ? (
        <FeedbackState kind="error" title="One or more selected products were not found." />
      ) : null}
    </CompareShell>
  );
}

function ReadyCompareSelectionRoute({
  loaderData,
  onSave,
  saveFeedback,
  viewer,
}: {
  loaderData: Extract<CompareRouteLoaderData, { status: "ready" }>;
  onSave: () => void;
  saveFeedback: SaveFeedbackState;
  viewer: RootViewer | null | undefined;
}) {
  const location = useLocation();
  const queryRef = useRoutePreloadedQuery<CompareRouteQuery>(compareRouteQuery, loaderData.query);
  const data = usePreloadedQuery<CompareRouteQuery>(compareRouteQuery, queryRef);
  const saveInFlight = saveFeedback.isInFlight;
  const returnTo =
    safeRelativeReturnPath(`${location.pathname}${location.search}${location.hash}`) ?? "/";
  const intent = useMemo<SaveComparisonIntent>(
    () => ({
      kind: "save_comparison",
      version: 1,
      expiresAt: Date.now() + PENDING_INTENT_TTL_MS,
      returnTo,
      productIds: loaderData.products.map(({ id }) => id),
    }),
    [loaderData.products, returnTo],
  );
  const authenticatedIntent = useAuthenticatedIntent({
    viewer,
    intent,
    onAuthenticated: onSave,
  });

  return (
    <CompareShell title="Compare products">
      <section aria-label="Comparison workspace" {...props(styles.workspace)}>
        <ComparisonToolbar
          authDialog={authenticatedIntent.dialog}
          maxProducts={MAX_COMPARE_PRODUCTS}
          onSave={authenticatedIntent.request}
          products={loaderData.products}
          saveInFlight={saveInFlight}
          saveMessage={saveFeedback.message}
          selectedSlugs={loaderData.slugs}
          specMode={loaderData.specMode}
        />
        {saveFeedback.error ? <FeedbackState kind="error" title={saveFeedback.error} /> : null}
        <CompareProductDetailsBoundary
          fragmentProducts={data.comparisonProducts}
          loaderData={loaderData}
        />
      </section>
    </CompareShell>
  );
}

function CompareProductDetailsBoundary({
  fragmentProducts,
  loaderData,
}: {
  fragmentProducts: CompareRouteQuery$data["comparisonProducts"];
  loaderData: Extract<CompareRouteLoaderData, { status: "ready" }>;
}) {
  return (
    <ResettableErrorBoundary
      resetToken={loaderData.query}
      fallback={
        <>
          <FeedbackState kind="error" title="Comparison details unavailable." />
          <ProductDecisionSummaries fragmentProducts={[]} loaderData={loaderData} />
        </>
      }
    >
      <Suspense fallback={<FeedbackState kind="loading" title="Loading comparison..." />}>
        <CompareProductList fragmentProducts={fragmentProducts} loaderData={loaderData} />
      </Suspense>
    </ResettableErrorBoundary>
  );
}

function isActiveSaveRequest(
  activeSaveRequest: { id: number } | null,
  saveRequest: { id: number },
) {
  return activeSaveRequest?.id === saveRequest.id;
}

function orderedValuesEqual(left: readonly string[], right: readonly string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
