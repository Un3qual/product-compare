import { create, props } from "@stylexjs/stylex";
import { graphql, usePreloadedQuery } from "react-relay";
import type { UnmatchedFeedsQuery } from "$generated/UnmatchedFeedsQuery.graphql";
import {
  useRoutePreloadedQuery,
  type RelayRouteQueryDescriptor,
} from "$relay/route-preload";
import { Pagination } from "$ui/components/navigation/Pagination";
import { tokens } from "$ui/theme/tokens.stylex";
import { FeedFactsRow } from "./FeedFactsRow";
import {
  buildCJUnmatchedFeedPageData,
  type CJProgramsPagination,
} from "../pagination";

export const unmatchedFeedsQuery = graphql`
  query UnmatchedFeedsQuery($first: Int!, $after: String) {
    unmatchedCjFeeds(first: $first, after: $after) {
      edges {
        node {
          id
          ...FeedFactsRow_feed
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

const styles = create({
  section: {
    borderBlockStartColor: tokens.borderQuiet,
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "1px",
    display: "grid",
    gap: "0.85rem",
    paddingBlockStart: "1.25rem",
  },
  list: { display: "grid", gap: "0.65rem", listStyle: "none", margin: 0, padding: 0 },
  empty: { color: tokens.textSecondary, margin: 0 },
  title: { margin: 0 },
});

export function UnmatchedFeeds({
  pagination,
  query,
}: {
  pagination: CJProgramsPagination;
  query: RelayRouteQueryDescriptor<UnmatchedFeedsQuery["variables"]>;
}) {
  const queryRef = useRoutePreloadedQuery<UnmatchedFeedsQuery>(unmatchedFeedsQuery, query);
  const data = usePreloadedQuery<UnmatchedFeedsQuery>(unmatchedFeedsQuery, queryRef);
  const paginationData = buildCJUnmatchedFeedPageData(
    pagination,
    data.unmatchedCjFeeds.pageInfo,
  );

  return (
    <section aria-labelledby="unmatched-cj-feeds" {...props(styles.section)}>
      <h2 id="unmatched-cj-feeds" {...props(styles.title)}>
        Unmatched feeds
      </h2>
      {data.unmatchedCjFeeds.edges.length > 0 ? (
        <ul aria-label="Unmatched CJ feeds" {...props(styles.list)}>
          {data.unmatchedCjFeeds.edges.map(({ node: feed }) => (
            <FeedFactsRow feed={feed} key={feed.id} showAdvertiserName />
          ))}
        </ul>
      ) : (
        <p {...props(styles.empty)}>No unmatched CJ feeds captured yet.</p>
      )}
      <Pagination
        firstHref={paginationData.firstHref}
        firstLabel="First unmatched feeds"
        label="Unmatched CJ feed pages"
        nextHref={paginationData.nextHref}
        nextLabel="Next unmatched feeds"
      />
    </section>
  );
}
