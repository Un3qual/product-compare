import { Suspense } from "react";
import { create, props } from "@stylexjs/stylex";
import { Await, useLoaderData, type LoaderFunctionArgs } from "react-router-dom";
import { graphql, usePreloadedQuery } from "react-relay";
import type { Environment } from "relay-runtime";
import type { CJProgramsRouteQuery } from "$generated/CJProgramsRouteQuery.graphql";
import type { UnmatchedFeedsQuery } from "$generated/UnmatchedFeedsQuery.graphql";
import {
  getRelayEnvironmentFromRouterContext,
  preloadRouteQuery,
  useRoutePreloadedQuery,
  type RelayRouteQueryDescriptor,
} from "$relay/route-preload";
import { ResettableErrorBoundary } from "$relay/ResettableErrorBoundary";
import { FeedbackState } from "$ui/components/feedback/FeedbackState";
import { ContextRail } from "$ui/components/layout/ContextRail";
import { PageShell } from "$ui/components/layout/PageShell";
import { WorkspaceLayout } from "$ui/components/layout/WorkspaceLayout";
import { Button } from "$ui/primitives/Button";
import { Label } from "$ui/primitives/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "$ui/primitives/Select";
import { tokens } from "$ui/theme/tokens.stylex";
import { recoverRouteLoaderError } from "$relay/loader-errors";
import { UnmatchedFeeds, unmatchedFeedsQuery } from "./feeds/UnmatchedFeeds";
import { ProgramLifecycleTable } from "./programs/ProgramLifecycleTable";
import { CJ_PROGRAM_SORTS, CJ_PROGRAM_STAGES } from "./cj-program-data";
import {
  cjProgramsPaginationFromUrl,
  cjProgramSortToUrlParam,
  cjProgramStageToUrlParam,
  type CJProgramsPagination,
  buildCJProgramPageData,
} from "./pagination";

const cjProgramsRouteQuery = graphql`
  query CJProgramsRouteQuery(
    $first: Int!
    $after: String
    $stage: CJProgramStage
    $sort: CJProgramSort!
  ) {
    cjProgramStageCounts {
      new
      considering
      selected
      applied
      accepted
      notPursuing
      declined
    }
    cjPrograms(first: $first, after: $after, stage: $stage, sort: $sort) {
      edges {
        node {
          id
          ...ProgramLifecycleRow_program
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        endCursor
      }
    }
  }
`;

export type CJProgramsLoaderData =
  | {
      status: "ready";
      pagination: CJProgramsPagination;
      query: RelayRouteQueryDescriptor<CJProgramsRouteQuery["variables"]>;
      unmatchedQuery:
        | Promise<RelayRouteQueryDescriptor<UnmatchedFeedsQuery["variables"]> | null>
        | RelayRouteQueryDescriptor<UnmatchedFeedsQuery["variables"]>
        | null;
    }
  | {
      status: "error";
      pagination: CJProgramsPagination;
    };

export async function cjProgramsLoader({
  context,
  request,
}: LoaderFunctionArgs): Promise<CJProgramsLoaderData> {
  const environment = getRelayEnvironmentFromRouterContext(context);
  const pagination = cjProgramsPaginationFromUrl(new URL(request.url));
  const query = preloadRouteQuery<CJProgramsRouteQuery>(
    environment,
    cjProgramsRouteQuery,
    {
      first: pagination.first,
      after: pagination.after,
      stage: pagination.stage,
      sort: pagination.sort,
    },
    { signal: request.signal },
  );
  const unmatchedQuery = preloadUnmatchedFeeds(environment, pagination, request.signal).catch(
    (reason: unknown) =>
      recoverRouteLoaderError(reason, "Failed to preload unmatched CJ feeds query.", null),
  );

  try {
    return {
      status: "ready",
      pagination,
      query: await query,
      unmatchedQuery,
    };
  } catch (error) {
    return recoverRouteLoaderError<CJProgramsLoaderData>(
      error,
      "Failed to preload CJ programs route query.",
      {
        status: "error",
        pagination,
      },
    );
  }
}

function preloadUnmatchedFeeds(
  environment: Environment,
  pagination: CJProgramsPagination,
  signal: AbortSignal,
) {
  return preloadRouteQuery<UnmatchedFeedsQuery>(
    environment,
    unmatchedFeedsQuery,
    { first: pagination.unmatchedFirst, after: pagination.unmatchedAfter },
    { signal },
  );
}

const styles = create({
  controls: {
    alignItems: "end",
    display: "grid",
    gap: "0.85rem",
    paddingBlock: "0.25rem",
  },
  field: {
    display: "grid",
    gap: "0.35rem",
  },
  label: {
    color: tokens.textSecondary,
    fontSize: "0.82rem",
    fontWeight: 600,
  },
});

export function CJProgramsRoute() {
  const loaderData = useLoaderData<typeof cjProgramsLoader>();

  return (
    <PageShell
      description="Track each advertiser program from discovery through its application outcome."
      eyebrow="Ingestion"
      title="CJ programs"
    >
      <WorkspaceLayout
        context={
          <ContextRail
            description="Filter programs while their lifecycle counts remain global."
            label="Program controls"
          >
            <CJProgramControls pagination={loaderData.pagination} />
          </ContextRail>
        }
        label="CJ programs"
      >
        {loaderData.status === "ready" ? (
          <ResettableErrorBoundary
            fallback={<CJProgramsUnavailableFallback />}
            resetToken={loaderData.query}
          >
            <Suspense fallback={<FeedbackState kind="loading" title="Loading CJ programs..." />}>
              <CJProgramsPanel
                pagination={loaderData.pagination}
                query={loaderData.query}
                unmatchedQuery={loaderData.unmatchedQuery}
              />
            </Suspense>
          </ResettableErrorBoundary>
        ) : (
          <CJProgramsUnavailableFallback />
        )}
      </WorkspaceLayout>
    </PageShell>
  );
}

function CJProgramsPanel({
  pagination,
  query,
  unmatchedQuery,
}: {
  pagination: CJProgramsPagination;
  query: Extract<CJProgramsLoaderData, { status: "ready" }>["query"];
  unmatchedQuery: Extract<CJProgramsLoaderData, { status: "ready" }>["unmatchedQuery"];
}) {
  const queryRef = useRoutePreloadedQuery<CJProgramsRouteQuery>(cjProgramsRouteQuery, query);
  const data = usePreloadedQuery<CJProgramsRouteQuery>(cjProgramsRouteQuery, queryRef);

  const paginationData = buildCJProgramPageData(pagination, data.cjPrograms.pageInfo);

  return (
    <>
      <ProgramLifecycleTable
        counts={data.cjProgramStageCounts}
        pagination={paginationData}
        programs={data.cjPrograms}
      />
      <DeferredUnmatchedFeedsBoundary pagination={pagination} query={unmatchedQuery} />
    </>
  );
}

function DeferredUnmatchedFeedsBoundary({
  pagination,
  query,
}: {
  pagination: CJProgramsPagination;
  query: Extract<CJProgramsLoaderData, { status: "ready" }>["unmatchedQuery"];
}) {
  return (
    <Suspense fallback={<FeedbackState kind="loading" title="Loading unmatched feeds..." />}>
      <Await resolve={query} errorElement={<UnmatchedFeedsUnavailableFallback />}>
        {(resolvedQuery) => (
          <UnmatchedFeedsBoundary pagination={pagination} query={resolvedQuery} />
        )}
      </Await>
    </Suspense>
  );
}

function UnmatchedFeedsBoundary({
  pagination,
  query,
}: {
  pagination: CJProgramsPagination;
  query: Awaited<Extract<CJProgramsLoaderData, { status: "ready" }>["unmatchedQuery"]>;
}) {
  if (!query) {
    return <UnmatchedFeedsUnavailableFallback />;
  }

  return (
    <ResettableErrorBoundary fallback={<UnmatchedFeedsUnavailableFallback />} resetToken={query}>
      <Suspense fallback={<FeedbackState kind="loading" title="Loading unmatched feeds..." />}>
        <UnmatchedFeeds pagination={pagination} query={query} />
      </Suspense>
    </ResettableErrorBoundary>
  );
}

function CJProgramControls({ pagination }: { pagination: CJProgramsPagination }) {
  const stageValue = pagination.stage ? cjProgramStageToUrlParam(pagination.stage) : "";
  const sortValue = cjProgramSortToUrlParam(pagination.sort);
  const stageOptions = [
    { label: "All stages", value: "" },
    ...CJ_PROGRAM_STAGES.map(({ label, urlValue }) => ({
      label,
      value: urlValue,
    })),
  ];
  const sortOptions = CJ_PROGRAM_SORTS.map(({ label, urlValue }) => ({
    label,
    value: urlValue,
  }));

  return (
    <form action="/ingestion/cj-programs" method="get" {...props(styles.controls)}>
      <input name="first" type="hidden" value={pagination.first} />
      <input name="unmatchedFirst" type="hidden" value={pagination.unmatchedFirst} />
      {pagination.unmatchedAfter ? (
        <input name="unmatchedAfter" type="hidden" value={pagination.unmatchedAfter} />
      ) : null}
      <Label style={styles.field}>
        <span {...props(styles.label)}>Stage</span>
        <Select defaultValue={stageValue} items={stageOptions} key={stageValue} name="stage">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {stageOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Label>
      <Label style={styles.field}>
        <span {...props(styles.label)}>Sort programs</span>
        <Select defaultValue={sortValue} items={sortOptions} key={sortValue} name="sort">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Label>
      <Button type="submit">Apply</Button>
    </form>
  );
}

function CJProgramsUnavailableFallback() {
  return (
    <section role="alert">
      <p>CJ programs unavailable.</p>
    </section>
  );
}

function UnmatchedFeedsUnavailableFallback() {
  return (
    <section role="alert">
      <p>Unmatched feeds unavailable.</p>
    </section>
  );
}
