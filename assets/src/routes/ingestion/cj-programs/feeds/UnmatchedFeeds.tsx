import { useId } from "react";
import { create, props } from "@stylexjs/stylex";
import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import { graphql, usePreloadedQuery } from "react-relay";
import type { UnmatchedFeedsQuery } from "$generated/UnmatchedFeedsQuery.graphql";
import { useRoutePreloadedQuery, type RelayRouteQueryDescriptor } from "$relay/route-preload";
import { Pagination } from "$ui/components/navigation/Pagination";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "$ui/primitives/Table";
import { tokens } from "$ui/theme/tokens.stylex";
import { formatFeedProductCount } from "../formatting";
import { buildCJUnmatchedFeedPageData, type CJProgramsPagination } from "../pagination";
import { UnmatchedFeedRow } from "./UnmatchedFeedRow";

export const unmatchedFeedsQuery = graphql`
  query UnmatchedFeedsQuery($first: Int!, $after: String) {
    unmatchedCjFeeds(first: $first, after: $after) {
      edges {
        node {
          id
          feedName
          productCount
          ...UnmatchedFeedRow_feed
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

type FeedReference = UnmatchedFeedsQuery["response"]["unmatchedCjFeeds"]["edges"][number]["node"];

const styles = create({
  health: {
    borderColor: tokens.borderQuiet,
    borderRadius: "var(--pc-radius-large)",
    borderStyle: "solid",
    borderWidth: "1px",
    display: "grid",
    gap: "0.45rem",
    gridArea: "feedHealth",
    minWidth: 0,
    padding: "1rem",
  },
  healthHeader: {
    alignItems: "baseline",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.4rem 0.75rem",
    justifyContent: "space-between",
  },
  healthTitle: { fontSize: "0.9rem", margin: 0 },
  healthCount: { color: tokens.textSecondary, fontSize: "0.78rem", margin: 0 },
  healthExample: { fontWeight: 750, margin: 0 },
  healthProducts: { color: tokens.textSecondary, fontSize: "0.82rem", margin: 0 },
  section: {
    borderColor: tokens.borderQuiet,
    borderRadius: "var(--pc-radius-large)",
    borderStyle: "solid",
    borderWidth: "1px",
    display: "grid",
    gap: "0.75rem",
    gridArea: "unmatched",
    minWidth: 0,
    paddingBlock: "0.9rem",
  },
  sectionHeader: { alignItems: "baseline", display: "flex", gap: "0.6rem", paddingInline: "1rem" },
  title: { fontSize: "1rem", margin: 0 },
  count: { color: tokens.textSecondary, fontSize: "0.78rem", margin: 0 },
  empty: { color: tokens.textSecondary, margin: 0, paddingInline: "1rem" },
  pagination: { paddingInline: "1rem" },
  table: { minWidth: "58rem", tableLayout: "fixed", width: "100%" },
  feedColumn: { width: "20%" },
  timeColumn: { width: "15%" },
  productsColumn: { width: "10%" },
  advertiserColumn: { width: "18%" },
  compactColumn: { width: "9.25%" },
});

const tableModel = tableFeatures({});
const columnHelper = createColumnHelper<typeof tableModel, FeedReference>();
const columns = columnHelper.columns([
  columnHelper.display({ id: "feed", header: "Provider feed" }),
  columnHelper.display({ id: "lastSeen", header: "Last seen" }),
  columnHelper.display({ id: "products", header: "Products" }),
  columnHelper.display({ id: "advertiser", header: "Advertiser" }),
  columnHelper.display({ id: "type", header: "Feed type" }),
  columnHelper.display({ id: "country", header: "Country" }),
  columnHelper.display({ id: "currency", header: "Currency" }),
  columnHelper.display({ id: "language", header: "Language" }),
]);

export function UnmatchedFeeds({ pagination, query }: {
  pagination: CJProgramsPagination;
  query: RelayRouteQueryDescriptor<UnmatchedFeedsQuery["variables"]>;
}) {
  const healthId = useId();
  const queryRef = useRoutePreloadedQuery<UnmatchedFeedsQuery>(unmatchedFeedsQuery, query);
  const data = usePreloadedQuery<UnmatchedFeedsQuery>(unmatchedFeedsQuery, queryRef);
  const feeds = data.unmatchedCjFeeds.edges.map(({ node }) => node);
  const firstFeed = feeds[0] ?? null;
  const paginationData = buildCJUnmatchedFeedPageData(pagination, data.unmatchedCjFeeds.pageInfo);
  const table = useTable({ columns, data: feeds, features: tableModel, getRowId: (feed) => feed.id });

  return (
    <>
      <section aria-labelledby={healthId} {...props(styles.health)}>
        <header {...props(styles.healthHeader)}>
          <h2 id={healthId} {...props(styles.healthTitle)}>Feed health</h2>
          <p {...props(styles.healthCount)}>
            {feeds.length === 0
              ? "No unmatched feeds on this loaded page"
              : `${feeds.length} unmatched ${feeds.length === 1 ? "feed" : "feeds"} on this loaded page`}
          </p>
        </header>
        {firstFeed ? (
          <>
            <p {...props(styles.healthExample)}>{firstFeed.feedName ?? "Unnamed feed"}</p>
            <p {...props(styles.healthProducts)}>{formatFeedProductCount(firstFeed.productCount)}</p>
          </>
        ) : null}
      </section>
      <section aria-labelledby="unmatched-cj-feeds" {...props(styles.section)}>
        <header {...props(styles.sectionHeader)}>
          <h2 id="unmatched-cj-feeds" {...props(styles.title)}>Unmatched feeds</h2>
          <p {...props(styles.count)}>{feeds.length} feeds on this loaded page</p>
        </header>
        {feeds.length > 0 ? (
          <Table aria-label="Unmatched CJ feeds" style={styles.table}>
            <colgroup>
              <col {...props(styles.feedColumn)} />
              <col {...props(styles.timeColumn)} />
              <col {...props(styles.productsColumn)} />
              <col {...props(styles.advertiserColumn)} />
              <col {...props(styles.compactColumn)} />
              <col {...props(styles.compactColumn)} />
              <col {...props(styles.compactColumn)} />
              <col {...props(styles.compactColumn)} />
            </colgroup>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} scope="col">
                      {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <UnmatchedFeedRow feed={row.original} key={row.id} />
              ))}
            </TableBody>
          </Table>
        ) : (
          <p {...props(styles.empty)}>No unmatched CJ feeds captured yet.</p>
        )}
        <div {...props(styles.pagination)}>
          <Pagination
            firstHref={paginationData.firstHref}
            firstLabel="First unmatched feeds"
            label="Unmatched CJ feed pages"
            nextHref={paginationData.nextHref}
            nextLabel="Next unmatched feeds"
          />
        </div>
      </section>
    </>
  );
}
