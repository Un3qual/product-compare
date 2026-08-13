import { create, props } from "@stylexjs/stylex";
import { graphql, useFragment } from "react-relay";
import type { FeedFactsRow_feed$key } from "$generated/FeedFactsRow_feed.graphql";
import { tokens } from "$ui/theme/tokens.stylex";
import { formatCJDateTime, formatFeedProductCount } from "../formatting";

const cjFeedFragment = graphql`
  fragment FeedFactsRow_feed on MerchantFeedCandidate {
    id
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
  feed: {
    borderBlockEndColor: tokens.borderQuiet,
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
    display: "grid",
    gap: "0.25rem",
    paddingBlockEnd: "0.65rem",
  },
  title: {
    margin: 0,
  },
  facts: {
    color: tokens.textSecondary,
    display: "flex",
    flexWrap: "wrap",
    gap: "0.35rem 0.75rem",
    margin: 0,
  },
});

export function FeedFactsRow({
  feed: feedRef,
  showAdvertiserName = false,
}: {
  feed: FeedFactsRow_feed$key;
  showAdvertiserName?: boolean;
}) {
  const feed = useFragment(cjFeedFragment, feedRef);

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
