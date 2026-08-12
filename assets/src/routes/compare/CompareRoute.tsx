import { Suspense, type ReactNode, useRef, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { useLoaderData, useNavigate, type LoaderFunctionArgs } from "react-router-dom";
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
import { ContextRail } from "$ui/components/layout/ContextRail";
import { WorkspaceLayout } from "$ui/components/layout/WorkspaceLayout";
import { Button } from "$ui/primitives/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "$ui/primitives/Tabs";
import { tokens } from "$ui/theme/tokens.stylex";
import { commitRouteMutation } from "../relay-mutations";
import { normalizeRouteLoaderThrownError } from "../loader-errors";
import { DEFAULT_ROUTE_ERROR_MESSAGE } from "../route-errors";
import { CompareShell } from "./CompareShell";
import {
  compareQueryViewData,
  compareSpecModeFromUrl,
  COMPARE_OFFER_CONTEXT_PAGE_SIZE,
  MAX_COMPARE_PRODUCTS,
  type CompareSpecMode,
  type CompareRouteLoaderData,
} from "./compare-route-data";
import { CompareProductList, CompareProductSummaryList } from "./CompareProductList";
import { CompareProductPickerBoundary } from "./CompareProductPickerBoundary";
import { buildCompareSpecModeNavigationData } from "./compare-spec-mode-data";
import {
  buildComparePathAfterRemovingSlugIndex,
  buildComparePathFromSlugs,
  selectedCompareSlugsFromSearch,
} from "./paths";
import { CompareSelectionTray } from "./CompareSelectionTray";
import { ShareComparisonControl } from "./ShareComparisonControl";
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
  tabList: {
    borderBlockEndColor: tokens.borderQuiet,
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
    display: "flex",
    gap: "0.25rem",
    overflowX: "auto",
  },
  tab: {
    borderBlockEndColor: "transparent",
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "2px",
    color: tokens.textSecondary,
    fontWeight: 650,
    paddingBlock: "0.65rem",
    paddingInline: "0.9rem",
    textDecoration: "none",
  },
  tabActive: {
    borderBlockEndColor: tokens.actionAccent,
    color: tokens.text,
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
  const loaderData = useLoaderData<typeof compareLoader>() as CompareRouteLoaderData;
  const selectionKey = JSON.stringify([loaderData.status, loaderData.slugs]);

  return <CompareSelectionRoute key={selectionKey} loaderData={loaderData} />;
}

function CompareSelectionRoute({ loaderData }: { loaderData: CompareRouteLoaderData }) {
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedbackState>({
    error: null,
    isInFlight: false,
    message: null,
  });
  const isSaveInFlightRef = useRef(false);
  const activeSaveRequestRef = useRef<{ id: number } | null>(null);
  const nextSaveRequestIdRef = useRef(0);
  const [commitCreateSavedComparisonSet] =
    useMutation<CompareRouteCreateSavedComparisonSetMutation>(createSavedComparisonSetMutation);

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
            error: DEFAULT_ROUTE_ERROR_MESSAGE,
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
          error: DEFAULT_ROUTE_ERROR_MESSAGE,
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
}: {
  loaderData: Extract<CompareRouteLoaderData, { status: "ready" }>;
  onSave: () => void;
  saveFeedback: SaveFeedbackState;
}) {
  const queryRef = useRoutePreloadedQuery<CompareRouteQuery>(compareRouteQuery, loaderData.query);
  const data = usePreloadedQuery<CompareRouteQuery>(compareRouteQuery, queryRef);
  const saveInFlight = saveFeedback.isInFlight;

  return (
    <CompareShell title="Compare products">
      <WorkspaceLayout
        context={
          <ContextRail
            description="Save this set, remove selected products, or add another product."
            label="Comparison controls"
          >
            <Button disabled={saveInFlight} onClick={onSave} type="button">
              {saveInFlight ? "Saving comparison..." : "Save comparison"}
            </Button>
            <ShareComparisonControl products={loaderData.products} />
            <p aria-label="Save comparison status" aria-live="polite" role="status">
              {saveFeedback.message ?? ""}
            </p>
            <CompareSelectionTray
              items={loaderData.products.map((product) => ({
                label: product.name,
                slug: product.slug,
              }))}
              maxProducts={MAX_COMPARE_PRODUCTS}
              openComparePath={buildComparePathFromSlugs(loaderData.slugs, {
                specMode: loaderData.specMode,
              })}
              removePathForIndex={(index) =>
                buildComparePathAfterRemovingSlugIndex(loaderData.slugs, index, {
                  specMode: loaderData.specMode,
                })
              }
              selectedSlugs={loaderData.slugs}
            />
            {loaderData.slugs.length < MAX_COMPARE_PRODUCTS ? (
              <CompareProductPickerBoundary
                heading="Add another product"
                specMode={loaderData.specMode}
                selectedSlugs={loaderData.slugs}
              />
            ) : null}
          </ContextRail>
        }
        label="Comparison workspace"
      >
        {saveFeedback.error ? <FeedbackState kind="error" title={saveFeedback.error} /> : null}
        <CompareSpecModeControls selectedSlugs={loaderData.slugs} specMode={loaderData.specMode}>
          <CompareProductDetailsBoundary
            fragmentProducts={data.comparisonProducts}
            loaderData={loaderData}
          />
        </CompareSpecModeControls>
      </WorkspaceLayout>
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
          <CompareProductSummaryList products={loaderData.products} />
        </>
      }
    >
      <Suspense fallback={<FeedbackState kind="loading" title="Loading comparison..." />}>
        <CompareProductList fragmentProducts={fragmentProducts} loaderData={loaderData} />
      </Suspense>
    </ResettableErrorBoundary>
  );
}

function CompareSpecModeControls({
  children,
  selectedSlugs,
  specMode,
}: {
  children: ReactNode;
  selectedSlugs: readonly string[];
  specMode: CompareSpecMode;
}) {
  const navigation = buildCompareSpecModeNavigationData({ selectedSlugs, specMode });
  const navigate = useNavigate();

  return (
    <Tabs value={specMode}>
      <TabsList aria-label="Specification views" variant="line" {...props(styles.tabList)}>
        {navigation.modes.map((item) => (
          <TabsTrigger
            key={item.mode}
            nativeButton={false}
            render={
              <a
                aria-current={item.isCurrent ? "page" : undefined}
                href={item.path}
                onClick={(event) => {
                  event.preventDefault();
                  navigate(item.path);
                }}
                {...props(styles.tab, item.isCurrent ? styles.tabActive : null)}
              />
            }
            value={item.mode}
          >
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {navigation.modes.map((item) => (
        <TabsContent keepMounted hidden={!item.isCurrent} key={item.mode} value={item.mode}>
          {item.isCurrent ? children : null}
        </TabsContent>
      ))}
    </Tabs>
  );
}

function isActiveSaveRequest(
  activeSaveRequest: { id: number } | null,
  saveRequest: { id: number },
) {
  return activeSaveRequest?.id === saveRequest.id;
}
