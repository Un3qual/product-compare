import { Suspense, useEffect, useState } from "react";
import { Await, useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import attributionLedgerRouteQuery, {
  type AttributionLedgerRouteQuery,
} from "../../../__generated__/AttributionLedgerRouteQuery.graphql";
import revenueSummaryRouteQuery, {
  type RevenueSummaryRouteQuery,
} from "../../../__generated__/RevenueSummaryRouteQuery.graphql";
import {
  relayRouteQueryDescriptorIdentity,
  useRoutePreloadedQuery,
} from "../../../relay/route-preload";
import { ResettableErrorBoundary } from "../../../relay/ResettableErrorBoundary";
import { FeedbackState } from "../../../ui/components/feedback/FeedbackState";
import { PageShell } from "../../../ui/components/layout/PageShell";
import { revenueSummaryLoader, type RevenueSummaryLoaderData } from "./loader";
import { AttributionLedger } from "./AttributionLedger";
import { RevenueSummaryMetrics, RevenueSummaryView } from "./RevenueSummaryView";
import {
  buildRevenueSummaryControls,
  buildRevenueSummaryMetrics,
} from "./revenue-summary-view-data";

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
