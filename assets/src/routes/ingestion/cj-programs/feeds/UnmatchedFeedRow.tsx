import { create, props } from "@stylexjs/stylex";
import { graphql, useFragment } from "react-relay";
import type { UnmatchedFeedRow_feed$key } from "$generated/UnmatchedFeedRow_feed.graphql";
import { TableCell, TableHead, TableRow } from "$ui/primitives/Table";
import { tokens } from "$ui/theme/tokens.stylex";
import { formatCJDateTime, formatFeedProductCount } from "../formatting";

const fragment = graphql`
  fragment UnmatchedFeedRow_feed on MerchantFeedCandidate {
    providerFeedId
    advertiserName
    advertiserCountry
    sourceFeedType
    currency
    language
    feedName
    productCount
    lastSeenAt
  }
`;

const styles = create({
  cell: {
    fontSize: "0.8rem",
    minWidth: 0,
    overflowWrap: "anywhere",
    paddingInline: "0.3rem",
  },
  feed: { display: "grid", gap: "0.1rem" },
  name: { fontWeight: 750 },
  id: { color: tokens.textSecondary, fontFamily: tokens.fontMono, fontSize: "0.72rem" },
});

export function UnmatchedFeedRow({ feed: feedRef }: { feed: UnmatchedFeedRow_feed$key }) {
  const feed = useFragment(fragment, feedRef);
  const lastSeen = formatCJDateTime(feed.lastSeenAt);

  return (
    <TableRow>
      <TableHead scope="row" style={styles.cell}>
        <span {...props(styles.feed)}>
          <strong {...props(styles.name)}>{feed.feedName ?? "Unnamed feed"}</strong>
          <span {...props(styles.id)}>{feed.providerFeedId}</span>
        </span>
      </TableHead>
      <TableCell style={styles.cell}>
        {lastSeen ? <time dateTime={feed.lastSeenAt}>{lastSeen}</time> : "Not recorded"}
      </TableCell>
      <TableCell style={styles.cell}>{formatFeedProductCount(feed.productCount)}</TableCell>
      <TableCell style={styles.cell}>{feed.advertiserName ?? "Advertiser unavailable"}</TableCell>
      <TableCell style={styles.cell}>{feed.sourceFeedType ?? "Type unavailable"}</TableCell>
      <TableCell style={styles.cell}>{feed.advertiserCountry ?? "Country unavailable"}</TableCell>
      <TableCell style={styles.cell}>{feed.currency ?? "Currency unavailable"}</TableCell>
      <TableCell style={styles.cell}>{feed.language ?? "Language unavailable"}</TableCell>
    </TableRow>
  );
}
