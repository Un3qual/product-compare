import { create, props } from "@stylexjs/stylex";
import { tokens } from "../../../ui/theme/tokens.stylex";
import { formatCJDateTime, formatFeedProductCount } from "./cj-program-data";

type CJFeed = Readonly<{
  advertiserCountry?: string | null;
  advertiserName?: string | null;
  currency?: string | null;
  feedName?: string | null;
  id: string;
  language?: string | null;
  lastSeenAt?: string | null;
  productCount?: number | null;
  providerFeedId: string;
  sourceFeedType?: string | null;
}>;

const styles = create({
  feed: {
    borderBlockEndColor: tokens.borderQuiet,
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
    display: "grid",
    gap: "0.25rem",
    paddingBlockEnd: "0.65rem"
  },
  title: {
    margin: 0
  },
  facts: {
    color: tokens.textSecondary,
    display: "flex",
    flexWrap: "wrap",
    gap: "0.35rem 0.75rem",
    margin: 0
  }
});

export function CJFeedRow({
  feed,
  showAdvertiserName = false
}: {
  feed: CJFeed;
  showAdvertiserName?: boolean;
}) {
  return (
    <li {...props(styles.feed)}>
      <h3 {...props(styles.title)}>{feed.feedName ?? "Unnamed feed"}</h3>
      <p {...props(styles.facts)}>
        <span>Provider feed ID {feed.providerFeedId}</span>
        <span>Last seen {formatCJDateTime(feed.lastSeenAt)}</span>
        <span>{formatFeedProductCount(feed.productCount)}</span>
        {showAdvertiserName && feed.advertiserName ? <span>{feed.advertiserName}</span> : null}
        {feed.advertiserCountry ? <span>{feed.advertiserCountry}</span> : null}
        {feed.currency ? <span>{feed.currency}</span> : null}
        {feed.language ? <span>{feed.language}</span> : null}
        {feed.sourceFeedType ? <span>{feed.sourceFeedType}</span> : null}
      </p>
    </li>
  );
}
