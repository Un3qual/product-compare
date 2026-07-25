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
import { tokens } from "../../../ui/theme/tokens.stylex";
import { CJProgramList } from "./CJProgramList";
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
        <select defaultValue={stageValue} name="stage">
          <option value="">All stages</option>
          <option value="new">New</option>
          <option value="considering">Considering</option>
          <option value="selected">Selected</option>
          <option value="applied">Applied</option>
          <option value="accepted">Accepted</option>
          <option value="not_pursuing">Not pursuing</option>
          <option value="declined">Declined</option>
        </select>
      </label>
      <label {...props(styles.field)}>
        <span {...props(styles.label)}>Sort programs</span>
        <select defaultValue={sortValue} name="sort">
          <option value="name_asc">Name</option>
          <option value="last_changed_desc">Last changed</option>
          <option value="feed_count_desc">Feed count</option>
        </select>
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
