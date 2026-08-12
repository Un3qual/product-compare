import { SummaryStrip } from "$ui/components/data/SummaryStrip";
import { Pagination } from "$ui/components/navigation/Pagination";
import { create, props } from "@stylexjs/stylex";
import type { CJProgramsRouteQuery } from "$generated/CJProgramsRouteQuery.graphql";
import { tokens } from "$ui/theme/tokens.stylex";
import { CJFeedRow } from "./CJFeedRow";
import { CJProgramRow } from "./CJProgramRow";
import { CJ_PROGRAM_STAGES } from "./cj-program-data";
import { buildCJProgramPaginationData, type CJProgramsPagination } from "./pagination";

type CJProgramsData = CJProgramsRouteQuery["response"];

const styles = create({
  content: {
    display: "grid",
    gap: "1rem",
  },
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  empty: {
    color: tokens.textSecondary,
    margin: 0,
  },
  unmatched: {
    borderBlockStartColor: tokens.borderQuiet,
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "1px",
    display: "grid",
    gap: "0.85rem",
    paddingBlockStart: "1.25rem",
  },
  sectionTitle: {
    margin: 0,
  },
});

export function CJProgramList({
  data,
  pagination,
}: {
  data: CJProgramsData;
  pagination: CJProgramsPagination;
}) {
  const paginationData = buildCJProgramPaginationData(pagination, {
    program: {
      ...data.cjPrograms.pageInfo,
      endCursor: data.cjPrograms.pageInfo.endCursor ?? null,
    },
    unmatched: {
      ...data.unmatchedCjFeeds.pageInfo,
      endCursor: data.unmatchedCjFeeds.pageInfo.endCursor ?? null,
    },
  });

  return (
    <div {...props(styles.content)}>
      <SummaryStrip
        items={CJ_PROGRAM_STAGES.map(({ countKey, label }) => ({
          label,
          value: data.cjProgramStageCounts[countKey],
        }))}
        label="CJ program lifecycle summary"
      />
      {data.cjPrograms.edges.length > 0 ? (
        <ul aria-label="CJ programs" {...props(styles.list)}>
          {data.cjPrograms.edges.map(({ node: program }) => (
            <CJProgramRow key={program.id} program={program} />
          ))}
        </ul>
      ) : (
        <p {...props(styles.empty)}>No CJ programs captured yet.</p>
      )}
      <Pagination
        firstHref={paginationData.program.firstHref}
        firstLabel="First programs"
        label="CJ program pages"
        nextHref={paginationData.program.nextHref}
        nextLabel="Next programs"
      />
      <section aria-labelledby="unmatched-cj-feeds" {...props(styles.unmatched)}>
        <h2 id="unmatched-cj-feeds" {...props(styles.sectionTitle)}>
          Unmatched feeds
        </h2>
        {data.unmatchedCjFeeds.edges.length > 0 ? (
          <ul aria-label="Unmatched CJ feeds" {...props(styles.list)}>
            {data.unmatchedCjFeeds.edges.map(({ node: feed }) => (
              <CJFeedRow feed={feed} key={feed.id} showAdvertiserName />
            ))}
          </ul>
        ) : (
          <p {...props(styles.empty)}>No unmatched CJ feeds captured yet.</p>
        )}
        <Pagination
          firstHref={paginationData.unmatched.firstHref}
          firstLabel="First unmatched feeds"
          label="Unmatched CJ feed pages"
          nextHref={paginationData.unmatched.nextHref}
          nextLabel="Next unmatched feeds"
        />
      </section>
    </div>
  );
}
