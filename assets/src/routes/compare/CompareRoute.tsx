import { Suspense, type ReactNode, useRef, useState } from "react";
import { Content as TabsContent, List as TabsList, Root as TabsRoot, Trigger as TabsTrigger } from "@radix-ui/react-tabs";
import { create, props } from "@stylexjs/stylex";
import { Link, useLoaderData } from "react-router-dom";
import { graphql, useMutation } from "react-relay";
import type { CompareRouteCreateSavedComparisonSetMutation } from "../../__generated__/CompareRouteCreateSavedComparisonSetMutation.graphql";
import type { CompareRouteQuery } from "../../__generated__/CompareRouteQuery.graphql";
import { ResettableErrorBoundary } from "../../relay/ResettableErrorBoundary";
import { useRoutePreloadedQuery } from "../../relay/route-preload";
import { FeedbackState } from "../../ui/components/feedback/FeedbackState";
import { ContextRail } from "../../ui/components/layout/ContextRail";
import { WorkspaceLayout } from "../../ui/components/layout/WorkspaceLayout";
import { Button } from "../../ui/primitives/Button";
import { tokens } from "../../ui/theme/tokens.stylex";
import { commitRouteMutation } from "../relay-mutations";
import { DEFAULT_ROUTE_ERROR_MESSAGE } from "../route-errors";
import { CompareShell } from "./CompareShell";
import {
  compareLoader,
  MAX_COMPARE_PRODUCTS,
  type CompareSpecMode,
  type CompareRouteLoaderData
} from "./loader";
import {
  CompareProductList,
  CompareProductSummaryList
} from "./CompareProductList";
import { CompareProductPickerBoundary } from "./CompareProductPickerBoundary";
import { buildCompareSpecModeNavigationData } from "./compare-spec-mode-data";
import {
  buildComparePathAfterRemovingSlugIndex,
  buildComparePathFromSlugs
} from "./paths";
import { CompareSelectionTray } from "./CompareSelectionTray";
import { ShareComparisonControl } from "./ShareComparisonControl";
import { compareRouteQuery } from "./queries/CompareRouteQuery";
import {
  buildSavedComparisonSetMutationInput,
  resolveSavedComparisonSetMutationOutcome
} from "./saved-comparison-mutation-data";

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
    overflowX: "auto"
  },
  tab: {
    borderBlockEndColor: "transparent",
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "2px",
    color: tokens.textSecondary,
    fontWeight: 650,
    paddingBlock: "0.65rem",
    paddingInline: "0.9rem",
    textDecoration: "none"
  },
  tabActive: {
    borderBlockEndColor: tokens.actionAccent,
    color: tokens.text
  }
});

interface SaveFeedbackState {
  error: string | null;
  isInFlight: boolean;
  message: string | null;
}

export function CompareRoute() {
  const loaderData = useLoaderData<typeof compareLoader>() as CompareRouteLoaderData;
  const selectionKey = JSON.stringify([loaderData.status, loaderData.slugs]);

  return <CompareSelectionRoute key={selectionKey} loaderData={loaderData} />;
}

function CompareSelectionRoute({
  loaderData
}: {
  loaderData: CompareRouteLoaderData;
}) {
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedbackState>({
    error: null,
    isInFlight: false,
    message: null
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
      id: nextSaveRequestIdRef.current + 1
    };
    nextSaveRequestIdRef.current = saveRequest.id;
    activeSaveRequestRef.current = saveRequest;
    setSaveFeedback({
      error: null,
      isInFlight: true,
      message: null
    });

    commitRouteMutation(
      commitCreateSavedComparisonSet,
      {
        variables: {
          input: buildSavedComparisonSetMutationInput(loaderData.products)
        },
        onCompleted: (response, graphQLErrors) => {
          if (!isActiveSaveRequest(activeSaveRequestRef.current, saveRequest)) {
            return;
          }

          const outcome = resolveSavedComparisonSetMutationOutcome(
            response.createSavedComparisonSet,
            graphQLErrors
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
            message: null
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
          isInFlight: false,
          message: null
        });
        activeSaveRequestRef.current = null;
        isSaveInFlightRef.current = false;
      }
    );
  }

  if (loaderData.status === "ready") {
    const saveInFlight = saveFeedback.isInFlight;

    return (
      <CompareShell title="Compare products">
        {loaderData.query ? <CompareRouteQueryRetainer query={loaderData.query} /> : null}
        <WorkspaceLayout
          context={
            <ContextRail
              description="Save this set, remove selected products, or add another product."
              label="Comparison controls"
            >
              <Button disabled={saveInFlight} onClick={handleSave} type="button">
                {saveInFlight ? "Saving comparison..." : "Save comparison"}
              </Button>
              <ShareComparisonControl products={loaderData.products} />
              <p aria-label="Save comparison status" aria-live="polite" role="status">
                {saveFeedback.message ?? ""}
              </p>
              <CompareSelectionTray
                items={loaderData.products.map((product) => ({
                  label: product.name,
                  slug: product.slug
                }))}
                maxProducts={MAX_COMPARE_PRODUCTS}
                openComparePath={buildComparePathFromSlugs(loaderData.slugs, {
                  specMode: loaderData.specMode
                })}
                removePathForIndex={(index) =>
                  buildComparePathAfterRemovingSlugIndex(loaderData.slugs, index, {
                    specMode: loaderData.specMode
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
          {saveFeedback.error ? (
            <FeedbackState kind="error" title={saveFeedback.error} />
          ) : null}
          <CompareSpecModeControls
            selectedSlugs={loaderData.slugs}
            specMode={loaderData.specMode}
          >
            <CompareProductDetailsBoundary loaderData={loaderData} />
          </CompareSpecModeControls>
        </WorkspaceLayout>
      </CompareShell>
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

function CompareRouteQueryRetainer({
  query
}: {
  query: Extract<CompareRouteLoaderData, { status: "ready" }>["query"];
}) {
  useRoutePreloadedQuery<CompareRouteQuery>(compareRouteQuery, query);

  return null;
}

function CompareProductDetailsBoundary({
  loaderData
}: {
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
        <CompareProductList loaderData={loaderData} />
      </Suspense>
    </ResettableErrorBoundary>
  );
}

function CompareSpecModeControls({
  children,
  selectedSlugs,
  specMode
}: {
  children: ReactNode;
  selectedSlugs: readonly string[];
  specMode: CompareSpecMode;
}) {
  const navigation = buildCompareSpecModeNavigationData({ selectedSlugs, specMode });

  return (
    <TabsRoot value={specMode}>
      <TabsList aria-label="Specification views" {...props(styles.tabList)}>
        {navigation.modes.map((item) => (
          <TabsTrigger asChild key={item.mode} value={item.mode}>
            <Link
              aria-current={item.isCurrent ? "page" : undefined}
              to={item.path}
              {...props(
                styles.tab,
                item.isCurrent ? styles.tabActive : null
              )}
            >
              {item.label}
            </Link>
          </TabsTrigger>
        ))}
      </TabsList>
      {navigation.modes.map((item) => (
        <TabsContent
          forceMount
          hidden={!item.isCurrent}
          key={item.mode}
          value={item.mode}
        >
          {item.isCurrent ? children : null}
        </TabsContent>
      ))}
    </TabsRoot>
  );
}

function isActiveSaveRequest(
  activeSaveRequest: { id: number } | null,
  saveRequest: { id: number }
) {
  return activeSaveRequest?.id === saveRequest.id;
}
