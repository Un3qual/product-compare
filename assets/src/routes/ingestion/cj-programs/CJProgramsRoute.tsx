import { Suspense } from "react";
import { create, props } from "@stylexjs/stylex";
import { useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import cjProgramsRouteQuery, {
  type CJProgramsRouteQuery
} from "../../../__generated__/CJProgramsRouteQuery.graphql";
import { useRoutePreloadedQuery } from "../../../relay/route-preload";
import { ResettableErrorBoundary } from "../../../relay/ResettableErrorBoundary";
import { FeedbackState } from "../../../ui/components/feedback/FeedbackState";
import { ContextRail } from "../../../ui/components/layout/ContextRail";
import { PageShell } from "../../../ui/components/layout/PageShell";
import { WorkspaceLayout } from "../../../ui/components/layout/WorkspaceLayout";
import { Button } from "../../../ui/primitives/Button";
import { Select } from "../../../ui/primitives/Select";
import { tokens } from "../../../ui/theme/tokens.stylex";
import { CJProgramList } from "./CJProgramList";
import { CJ_PROGRAM_SORTS, CJ_PROGRAM_STAGES } from "./cj-program-data";
import {
  cjProgramSortToUrlParam,
  cjProgramStageToUrlParam,
  type CJProgramsPagination
} from "./pagination";
import type { CJProgramsLoaderData } from "./loader";

const styles = create({
  controls: {
    alignItems: "end",
    display: "grid",
    gap: "0.85rem",
    paddingBlock: "0.25rem"
  },
  field: {
    display: "grid",
    gap: "0.35rem"
  },
  label: {
    color: tokens.textSecondary,
    fontSize: "0.82rem",
    fontWeight: 600
  }
});

export function CJProgramsRoute() {
  const loaderData = useLoaderData<typeof import("./loader").cjProgramsLoader>() as CJProgramsLoaderData;

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
              <CJProgramsPanel pagination={loaderData.pagination} query={loaderData.query} />
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
  query
}: {
  pagination: CJProgramsPagination;
  query: Extract<CJProgramsLoaderData, { status: "ready" }>["query"];
}) {
  const queryRef = useRoutePreloadedQuery<CJProgramsRouteQuery>(
    cjProgramsRouteQuery,
    query
  );
  const data = usePreloadedQuery<CJProgramsRouteQuery>(cjProgramsRouteQuery, queryRef);

  return <CJProgramList data={data} pagination={pagination} />;
}

function CJProgramControls({ pagination }: { pagination: CJProgramsPagination }) {
  const stageValue = pagination.stage ? cjProgramStageToUrlParam(pagination.stage) : "";
  const sortValue = cjProgramSortToUrlParam(pagination.sort);

  return (
    <form action="/ingestion/cj-programs" method="get" {...props(styles.controls)}>
      <input name="first" type="hidden" value={pagination.first} />
      <input name="unmatchedFirst" type="hidden" value={pagination.unmatchedFirst} />
      {pagination.unmatchedAfter ? (
        <input name="unmatchedAfter" type="hidden" value={pagination.unmatchedAfter} />
      ) : null}
      <label {...props(styles.field)}>
        <span {...props(styles.label)}>Stage</span>
        <Select
          defaultValue={stageValue}
          key={stageValue}
          name="stage"
          options={[
            { label: "All stages", value: "" },
            ...CJ_PROGRAM_STAGES.map(({ label, urlValue }) => ({
              label,
              value: urlValue
            }))
          ]}
        />
      </label>
      <label {...props(styles.field)}>
        <span {...props(styles.label)}>Sort programs</span>
        <Select
          defaultValue={sortValue}
          key={sortValue}
          name="sort"
          options={CJ_PROGRAM_SORTS.map(({ label, urlValue }) => ({
            label,
            value: urlValue
          }))}
        />
      </label>
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
