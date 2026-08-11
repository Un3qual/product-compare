import { Suspense, useEffect, useState } from "react";
import { Await, useLoaderData, type LoaderFunctionArgs } from "react-router-dom";
import { graphql, usePreloadedQuery } from "react-relay";
import type { Environment } from "relay-runtime";
import type { AttributionLedgerRouteQuery } from "$generated/AttributionLedgerRouteQuery.graphql";
import type { RevenueSummaryRouteQuery } from "$generated/RevenueSummaryRouteQuery.graphql";
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
import { recoverRouteLoaderError } from "../../loader-errors";
import { AttributionLedger, attributionLedgerRouteQuery } from "./AttributionLedger";
import { RevenueSummaryMetrics, RevenueSummaryView } from "./RevenueSummaryView";
import {
  buildRevenueSummaryControls,
  buildRevenueSummaryMetrics,
  hasInvertedRevenueDateRange,
  revenueSummaryFiltersFromUrl,
  ATTRIBUTION_LEDGER_PAGE_SIZE,
  type RevenueSummaryFilters,
} from "./revenue-summary-view-data";

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

export type RevenueSummaryLoaderData =
  | {
      status: "ready";
      filters: RevenueSummaryFilters;
      ledgerQuery:
        | Promise<RelayRouteQueryDescriptor<AttributionLedgerRouteQuery["variables"]> | null>
        | RelayRouteQueryDescriptor<AttributionLedgerRouteQuery["variables"]>
        | null;
      query: RelayRouteQueryDescriptor<RevenueSummaryRouteQuery["variables"]>;
    }
  | { status: "needsCurrency"; filters: RevenueSummaryFilters }
  | { status: "invalidDateRange"; filters: RevenueSummaryFilters }
  | { status: "error"; filters: RevenueSummaryFilters };

export async function revenueSummaryLoader({
  context,
  request,
}: LoaderFunctionArgs): Promise<RevenueSummaryLoaderData> {
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
      { status: "error", filters },
    );
  }
}

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
  const loaderData = useLoaderData<typeof revenueSummaryLoader>() as RevenueSummaryLoaderData;
  const { activeFilters, datePresetLinks } = buildRevenueSummaryControls(
    loaderData.filters,
    useHydratedLocalDate(),
  );

  return (
    <PageShell
      description="This preview summarizes recorded attribution data. A live conversion provider is not connected for this milestone."
      eyebrow="Commerce analytics"
      title="Revenue reporting preview"
    >
      <RevenueSummaryView
        activeFilters={activeFilters}
        datePresetLinks={datePresetLinks}
        filters={loaderData.filters}
      >
        {loaderData.status === "error" ? (
          <RevenueSummaryUnavailableFallback />
        ) : loaderData.status === "needsCurrency" ? (
          <RevenueSummaryCurrencyRequiredFallback />
        ) : loaderData.status === "invalidDateRange" ? (
          <RevenueSummaryInvalidDateRangeFallback />
        ) : (
          <ResettableErrorBoundary
            fallback={<RevenueSummaryUnavailableFallback />}
            resetToken={loaderData.query}
          >
            <Suspense
              fallback={<FeedbackState kind="loading" title="Loading revenue summary..." />}
            >
              <RevenueSummaryPanel ledgerQuery={loaderData.ledgerQuery} query={loaderData.query} />
            </Suspense>
          </ResettableErrorBoundary>
        )}
      </RevenueSummaryView>
    </PageShell>
  );
}

function RevenueSummaryPanel({
  ledgerQuery,
  query,
}: {
  ledgerQuery: Extract<RevenueSummaryLoaderData, { status: "ready" }>["ledgerQuery"];
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

  return (
    <>
      <RevenueSummaryMetrics metrics={buildRevenueSummaryMetrics(data.revenueSummary, currency)} />
      <DeferredAttributionLedgerBoundary query={ledgerQuery} />
    </>
  );
}

function DeferredAttributionLedgerBoundary({
  query,
}: {
  query: Extract<RevenueSummaryLoaderData, { status: "ready" }>["ledgerQuery"];
}) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // SSR waits for all Suspense work, so subscribe to this optional query only after hydration.
  if (!isHydrated) {
    return <FeedbackState kind="loading" title="Loading attribution ledger..." />;
  }

  return (
    <Suspense fallback={<FeedbackState kind="loading" title="Loading attribution ledger..." />}>
      <Await resolve={query} errorElement={<AttributionLedgerUnavailableFallback />}>
        {(resolvedQuery) => <AttributionLedgerBoundary query={resolvedQuery} />}
      </Await>
    </Suspense>
  );
}

function AttributionLedgerBoundary({
  query,
}: {
  query: Awaited<Extract<RevenueSummaryLoaderData, { status: "ready" }>["ledgerQuery"]>;
}) {
  if (!query) {
    return <AttributionLedgerUnavailableFallback />;
  }

  return (
    <ResettableErrorBoundary fallback={<AttributionLedgerUnavailableFallback />} resetToken={query}>
      <Suspense fallback={<FeedbackState kind="loading" title="Loading attribution ledger..." />}>
        <AttributionLedgerPanel query={query} />
      </Suspense>
    </ResettableErrorBoundary>
  );
}

function AttributionLedgerPanel({
  query,
}: {
  query: NonNullable<
    Awaited<Extract<RevenueSummaryLoaderData, { status: "ready" }>["ledgerQuery"]>
  >;
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
    <section role="alert">
      <p>Attribution ledger unavailable.</p>
    </section>
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
