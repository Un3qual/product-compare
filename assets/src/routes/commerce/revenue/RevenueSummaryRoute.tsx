import { Suspense, useEffect, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { Await, useLoaderData } from "react-router";
import { graphql, usePreloadedQuery } from "react-relay";
import type { Environment } from "relay-runtime";
import type { AttributionLedgerRouteQuery } from "$generated/AttributionLedgerRouteQuery.graphql";
import type { RevenueSummaryRouteQuery } from "$generated/RevenueSummaryRouteQuery.graphql";
import type { Route } from "./+types/RevenueSummaryRoute";
import { routeMetaDescriptors } from "$frontend/seo";
import { RouteErrorBoundary as SharedRouteErrorBoundary } from "$routes/compare/RouteErrorBoundary";
import {
  getRelayEnvironmentFromRouterContext,
  preloadRouteQuery,
  relayRouteQueryDescriptorIdentity,
  useRoutePreloadedQuery,
  type RelayRouteQueryDescriptor,
} from "$relay/route-preload";
import { ResettableErrorBoundary } from "$relay/ResettableErrorBoundary";
import { FeedbackState } from "$ui/components/feedback/FeedbackState";
import { PageShell } from "$ui/components/layout/PageShell";
import { recoverRouteLoaderError } from "$relay/loader-errors";
import { AttributionLedger, attributionLedgerRouteQuery } from "./attribution/AttributionLedger";
import { RevenueControls } from "./summary/RevenueControls";
import { RevenueMetrics } from "./summary/RevenueMetrics";

export {
  RevenueSummaryRoute as default,
  revenueSummaryLoader as clientLoader,
  revenueSummaryLoader as loader,
};

export function meta() {
  return routeMetaDescriptors({
    title: "Revenue preview | Product Compare",
    description: "Preview attributed commerce revenue and commission summaries.",
  });
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <SharedRouteErrorBoundary error={error} resourceName="revenue report" title="Revenue" />;
}
import {
  buildRevenueSummaryControls,
  buildRevenueDashboardMetrics,
  hasInvertedRevenueDateRange,
  revenueSummaryFiltersFromUrl,
  ATTRIBUTION_LEDGER_PAGE_SIZE,
  type RevenueSummaryFilters,
} from "./summary/revenue-summary-data";

const styles = create({
  dashboard: {
    display: "grid",
    gap: "1rem",
    gridTemplateAreas: {
      default: '"summary recent" "ledger ledger"',
      "@media (max-width: 64rem)": '"summary" "recent" "ledger"',
    },
    gridTemplateColumns: {
      default: "minmax(0, 2fr) minmax(18rem, 1fr)",
      "@media (max-width: 64rem)": "minmax(0, 1fr)",
    },
    minWidth: 0,
  },
  recentSlot: { gridArea: "recent", minWidth: 0 },
  ledgerSlot: { gridArea: "ledger", minWidth: 0 },
});

const revenueSummaryRouteQuery = graphql`
  query RevenueSummaryRouteQuery($input: RevenueSummaryInput) {
    revenueSummary(input: $input) {
      filters {
        currency
        from
        merchantId
        network
        productId
        to
      }
      metrics {
        averagePaidPrice
        clicks
        commissionRevenue
        conversions
        currency
        grossOrderValue
      }
    }
  }
`;

type AttributionLedgerQueryDescriptor =
  | Promise<RelayRouteQueryDescriptor<AttributionLedgerRouteQuery["variables"]> | null>
  | RelayRouteQueryDescriptor<AttributionLedgerRouteQuery["variables"]>
  | null;

export type RevenueSummaryLoaderData =
  | {
      status: "ready";
      filters: RevenueSummaryFilters;
      ledgerQuery: AttributionLedgerQueryDescriptor;
      query: RelayRouteQueryDescriptor<RevenueSummaryRouteQuery["variables"]>;
    }
  | { status: "needsCurrency"; filters: RevenueSummaryFilters }
  | { status: "invalidDateRange"; filters: RevenueSummaryFilters }
  | {
      status: "error";
      filters: RevenueSummaryFilters;
      ledgerQuery: AttributionLedgerQueryDescriptor;
    };

export async function revenueSummaryLoader({
  context,
  request,
}: Route.LoaderArgs): Promise<RevenueSummaryLoaderData> {
  const environment = getRelayEnvironmentFromRouterContext(context);
  const filters = revenueSummaryFiltersFromUrl(new URL(request.url));

  if (!filters.currency) {
    return { status: "needsCurrency", filters };
  }

  if (hasInvertedRevenueDateRange(filters)) {
    return { status: "invalidDateRange", filters };
  }

  const summaryQuery = preloadRouteQuery<RevenueSummaryRouteQuery>(
    environment,
    revenueSummaryRouteQuery,
    { input: filters },
    { signal: request.signal },
  );
  const ledgerQuery = preloadAttributionLedger(environment, filters, request.signal).catch(
    (reason: unknown) =>
      recoverRouteLoaderError(reason, "Failed to preload attribution ledger route query.", null),
  );

  try {
    return {
      status: "ready",
      filters,
      ledgerQuery,
      query: await summaryQuery,
    };
  } catch (reason) {
    return recoverRouteLoaderError<RevenueSummaryLoaderData>(
      reason,
      "Failed to preload revenue summary route query.",
      { status: "error", filters, ledgerQuery },
    );
  }
}

// The optional ledger query is streamed after the root Relay snapshot.
revenueSummaryLoader.hydrate = true as const;

function preloadAttributionLedger(
  environment: Environment,
  filters: RevenueSummaryFilters,
  signal: AbortSignal,
) {
  return preloadRouteQuery<AttributionLedgerRouteQuery>(
    environment,
    attributionLedgerRouteQuery,
    { input: filters, after: null, first: ATTRIBUTION_LEDGER_PAGE_SIZE },
    { signal },
  );
}

export function RevenueSummaryRoute() {
  const loaderData = useLoaderData<typeof revenueSummaryLoader>();
  const { activeFilters, datePresetLinks } = buildRevenueSummaryControls(
    loaderData.filters,
    useHydratedLocalDate(),
  );

  return (
    <PageShell
      actions={
        <RevenueControls
          activeFilters={activeFilters}
          datePresetLinks={datePresetLinks}
          filters={loaderData.filters}
        />
      }
      description="This preview summarizes recorded attribution data. A live conversion provider is not connected for this milestone."
      eyebrow="Commerce analytics"
      title="Revenue reporting preview"
    >
      <section aria-label="Revenue report" {...props(styles.dashboard)}>
        {loaderData.status === "needsCurrency" ? (
          <RevenueSummaryCurrencyRequiredFallback />
        ) : loaderData.status === "invalidDateRange" ? (
          <RevenueSummaryInvalidDateRangeFallback />
        ) : loaderData.status === "error" ? (
          <RevenueSummaryUnavailableFallback />
        ) : (
          <ResettableErrorBoundary
            fallback={<RevenueSummaryUnavailableFallback />}
            resetToken={loaderData.query}
          >
            <Suspense
              fallback={<FeedbackState kind="loading" title="Loading revenue summary..." />}
            >
              <RevenueSummaryPanel query={loaderData.query} />
            </Suspense>
          </ResettableErrorBoundary>
        )}
        {loaderData.status === "ready" || loaderData.status === "error" ? (
          <DeferredAttributionLedgerBoundary query={loaderData.ledgerQuery} />
        ) : null}
      </section>
    </PageShell>
  );
}

function RevenueSummaryPanel({
  query,
}: {
  query: Extract<RevenueSummaryLoaderData, { status: "ready" }>["query"];
}) {
  const queryRef = useRoutePreloadedQuery<RevenueSummaryRouteQuery>(
    revenueSummaryRouteQuery,
    query,
  );
  const data = usePreloadedQuery<RevenueSummaryRouteQuery>(revenueSummaryRouteQuery, queryRef);

  if (!data.revenueSummary) {
    return <RevenueSummaryUnavailableFallback />;
  }

  const currency =
    data.revenueSummary.metrics.currency ?? data.revenueSummary.filters.currency ?? "";

  return <RevenueMetrics metrics={buildRevenueDashboardMetrics(data.revenueSummary, currency)} />;
}

function DeferredAttributionLedgerBoundary({ query }: { query: AttributionLedgerQueryDescriptor }) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // SSR waits for all Suspense work, so subscribe to this optional query only after hydration.
  if (!isHydrated) {
    return <AttributionActivityLoadingFallback />;
  }

  return (
    <Suspense fallback={<AttributionActivityLoadingFallback />}>
      <Await resolve={query} errorElement={<AttributionLedgerUnavailableFallback />}>
        {(resolvedQuery) => <AttributionLedgerBoundary query={resolvedQuery} />}
      </Await>
    </Suspense>
  );
}

function AttributionLedgerBoundary({
  query,
}: {
  query: Awaited<AttributionLedgerQueryDescriptor>;
}) {
  if (!query) {
    return <AttributionLedgerUnavailableFallback />;
  }

  return (
    <ResettableErrorBoundary fallback={<AttributionLedgerUnavailableFallback />} resetToken={query}>
      <Suspense fallback={<AttributionActivityLoadingFallback />}>
        <AttributionLedgerPanel query={query} />
      </Suspense>
    </ResettableErrorBoundary>
  );
}

function AttributionLedgerPanel({
  query,
}: {
  query: NonNullable<Awaited<AttributionLedgerQueryDescriptor>>;
}) {
  const queryRef = useRoutePreloadedQuery<AttributionLedgerRouteQuery>(
    attributionLedgerRouteQuery,
    query,
  );
  const data = usePreloadedQuery<AttributionLedgerRouteQuery>(
    attributionLedgerRouteQuery,
    queryRef,
  );

  return <AttributionLedger fragmentRef={data} key={relayRouteQueryDescriptorIdentity(query)} />;
}

function RevenueSummaryUnavailableFallback() {
  return (
    <section role="alert">
      <p>Revenue summary unavailable.</p>
    </section>
  );
}

function AttributionLedgerUnavailableFallback() {
  return (
    <>
      <div {...props(styles.recentSlot)}>
        <FeedbackState kind="error" title="Recent conversion unavailable." />
      </div>
      <div {...props(styles.ledgerSlot)}>
        <FeedbackState kind="error" title="Attribution ledger unavailable." />
      </div>
    </>
  );
}

function AttributionActivityLoadingFallback() {
  return (
    <>
      <div {...props(styles.recentSlot)}>
        <FeedbackState kind="loading" title="Loading recent conversion..." />
      </div>
      <div {...props(styles.ledgerSlot)}>
        <FeedbackState kind="loading" title="Loading attribution ledger..." />
      </div>
    </>
  );
}

function RevenueSummaryCurrencyRequiredFallback() {
  return <p role="status">Enter a currency code to load revenue metrics.</p>;
}

function RevenueSummaryInvalidDateRangeFallback() {
  return <p role="status">Enter a start date on or before the end date to load revenue metrics.</p>;
}

function useHydratedLocalDate() {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  return currentDate;
}
