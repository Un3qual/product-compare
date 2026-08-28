import { Suspense, useCallback, useEffect, useState } from "react";
import {
  Await,
  Link,
  useLoaderData,
  useRevalidator,
  type LoaderFunctionArgs,
} from "react-router-dom";
import { graphql, usePreloadedQuery, useRelayEnvironment } from "react-relay";
import type { ConversionIngestionRouteQuery } from "$generated/ConversionIngestionRouteQuery.graphql";
import type { ConversionSyncRunsQuery } from "$generated/ConversionSyncRunsQuery.graphql";
import {
  getRelayEnvironmentFromRouterContext,
  preloadRouteQuery,
  relayRouteQueryDescriptorIdentity,
  useRoutePreloadedQuery,
  type RelayRouteQueryDescriptor,
} from "$relay/route-preload";
import { recoverRouteLoaderError } from "$relay/loader-errors";
import { ResettableErrorBoundary } from "$relay/ResettableErrorBoundary";
import { FeedbackState } from "$ui/components/feedback/FeedbackState";
import { PageShell } from "$ui/components/layout/PageShell";
import { Button } from "$ui/primitives/Button";
import { ConversionIngestionSettings, RunNowControl } from "./ConversionIngestionSettings";
import {
  ConversionIngestionStatus,
  useConversionIngestionStatus,
} from "./ConversionIngestionStatus";
import { ConversionSyncRunLedger } from "./ConversionSyncRunLedger";
import { SYNC_RUN_PAGE_SIZE } from "./conversion-ingestion-data";

export { SYNC_RUN_PAGE_SIZE };

export const conversionIngestionRouteQuery = graphql`
  query ConversionIngestionRouteQuery {
    ...ConversionIngestionStatus_query
    cjCommissionIngestion {
      ...ConversionIngestionSettings_ingestion
    }
  }
`;

export const conversionSyncRunsQuery = graphql`
  query ConversionSyncRunsQuery($first: Int!, $after: String) {
    ...ConversionSyncRunLedger_connection @arguments(first: $first, after: $after)
  }
`;

export type ConversionIngestionLoaderData =
  | {
      status: "ready";
      overviewQuery: RelayRouteQueryDescriptor<ConversionIngestionRouteQuery["variables"]>;
      runsQuery: Promise<RelayRouteQueryDescriptor<ConversionSyncRunsQuery["variables"]>>;
      runsVariables: ConversionSyncRunsQuery["variables"];
    }
  | { status: "error" };

export async function conversionIngestionLoader({
  context,
  request,
}: LoaderFunctionArgs): Promise<ConversionIngestionLoaderData> {
  const environment = getRelayEnvironmentFromRouterContext(context);
  const after = new URL(request.url).searchParams.get("after");
  const runsVariables = { after, first: SYNC_RUN_PAGE_SIZE };
  const overviewPromise = preloadRouteQuery<ConversionIngestionRouteQuery>(
    environment,
    conversionIngestionRouteQuery,
    {},
    { signal: request.signal },
  );
  const runsQuery = preloadRouteQuery<ConversionSyncRunsQuery>(
    environment,
    conversionSyncRunsQuery,
    runsVariables,
    { signal: request.signal },
  );
  void runsQuery.catch(() => undefined);

  try {
    return { status: "ready", overviewQuery: await overviewPromise, runsQuery, runsVariables };
  } catch (reason) {
    return recoverRouteLoaderError<ConversionIngestionLoaderData>(
      reason,
      "Failed to preload conversion ingestion overview.",
      { status: "error" },
    );
  }
}

export function ConversionIngestionRoute() {
  const loaderData = useLoaderData<typeof conversionIngestionLoader>();

  if (loaderData.status === "error") {
    return (
      <PageShell
        description={<ConversionIngestionDescription />}
        eyebrow="Commerce operations"
        title="Conversion ingestion"
      >
        <FeedbackState kind="error" title="Conversion ingestion overview unavailable." />
      </PageShell>
    );
  }

  return (
    <ResettableErrorBoundary
      fallback={<ConversionIngestionUnavailableFallback />}
      resetToken={loaderData.overviewQuery}
    >
      <Suspense fallback={<FeedbackState kind="loading" title="Loading conversion ingestion..." />}>
        <ConversionIngestionPanel loaderData={loaderData} />
      </Suspense>
    </ResettableErrorBoundary>
  );
}

function ConversionIngestionPanel({
  loaderData,
}: {
  loaderData: Extract<ConversionIngestionLoaderData, { status: "ready" }>;
}) {
  const queryRef = useRoutePreloadedQuery<ConversionIngestionRouteQuery>(
    conversionIngestionRouteQuery,
    loaderData.overviewQuery,
  );
  const data = usePreloadedQuery<ConversionIngestionRouteQuery>(
    conversionIngestionRouteQuery,
    queryRef,
  );
  const { revalidate } = useRevalidator();
  const [statusData, refetchOverview] = useConversionIngestionStatus(data);
  const refreshOverview = useCallback(() => {
    refetchOverview({}, { fetchPolicy: "network-only" });
  }, [refetchOverview]);

  return (
    <PageShell
      actions={
        <RunNowControl ingestion={data.cjCommissionIngestion} onOverviewRefresh={refreshOverview} />
      }
      description={<ConversionIngestionDescription />}
      eyebrow="Commerce operations"
      title="Conversion ingestion"
    >
      <ConversionIngestionStatus
        ingestion={statusData.cjCommissionIngestion}
        onOverviewRefresh={refreshOverview}
        onTerminal={revalidate}
      />
      <ConversionIngestionSettings
        ingestion={data.cjCommissionIngestion}
        onOverviewRefresh={refreshOverview}
      />
      <DeferredRunLedger query={loaderData.runsQuery} variables={loaderData.runsVariables} />
    </PageShell>
  );
}

function DeferredRunLedger({
  query,
  variables,
}: {
  query: Extract<ConversionIngestionLoaderData, { status: "ready" }>["runsQuery"];
  variables: Extract<ConversionIngestionLoaderData, { status: "ready" }>["runsVariables"];
}) {
  const environment = useRelayEnvironment();
  const [isHydrated, setIsHydrated] = useState(false);
  const [runsQuery, setRunsQuery] = useState(query);

  useEffect(() => setIsHydrated(true), []);
  useEffect(() => setRunsQuery(query), [query]);

  const retryHistory = useCallback(() => {
    const nextQuery = preloadRouteQuery<ConversionSyncRunsQuery>(
      environment,
      conversionSyncRunsQuery,
      variables,
    );
    void nextQuery.catch(() => undefined);
    setRunsQuery(nextQuery);
  }, [environment, variables.after, variables.first]);

  if (!isHydrated) {
    return <FeedbackState kind="loading" title="Loading conversion sync runs..." />;
  }

  return (
    <Suspense fallback={<FeedbackState kind="loading" title="Loading conversion sync runs..." />}>
      <Await
        resolve={runsQuery}
        errorElement={
          <FeedbackState
            action={<Button onClick={retryHistory}>Retry conversion sync runs</Button>}
            kind="error"
            title="Conversion sync runs unavailable."
          />
        }
      >
        {(resolvedQuery) => <RunLedgerBoundary query={resolvedQuery} />}
      </Await>
    </Suspense>
  );
}

function RunLedgerBoundary({
  query,
}: {
  query: Awaited<Extract<ConversionIngestionLoaderData, { status: "ready" }>["runsQuery"]>;
}) {
  return (
    <ResettableErrorBoundary
      fallback={<FeedbackState kind="error" title="Conversion sync runs unavailable." />}
      resetToken={query}
    >
      <Suspense fallback={<FeedbackState kind="loading" title="Loading conversion sync runs..." />}>
        <RunLedgerPanel query={query} />
      </Suspense>
    </ResettableErrorBoundary>
  );
}

function RunLedgerPanel({
  query,
}: {
  query: Awaited<Extract<ConversionIngestionLoaderData, { status: "ready" }>["runsQuery"]>;
}) {
  const queryRef = useRoutePreloadedQuery<ConversionSyncRunsQuery>(conversionSyncRunsQuery, query);
  const data = usePreloadedQuery<ConversionSyncRunsQuery>(conversionSyncRunsQuery, queryRef);

  return (
    <ConversionSyncRunLedger fragmentRef={data} key={relayRouteQueryDescriptorIdentity(query)} />
  );
}

function ConversionIngestionUnavailableFallback() {
  return (
    <PageShell
      description={<ConversionIngestionDescription />}
      eyebrow="Commerce operations"
      title="Conversion ingestion"
    >
      <FeedbackState kind="error" title="Conversion ingestion overview unavailable." />
    </PageShell>
  );
}

function ConversionIngestionDescription() {
  return (
    <>
      <Link to="/commerce/revenue">Revenue reporting</Link> · Monitor CJ commission freshness, run
      bounded imports, and control the persisted schedule.
    </>
  );
}
