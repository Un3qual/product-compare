import { Suspense, useEffect, useRef, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import {
  graphql,
  usePreloadedQuery,
  useQueryLoader,
  type PreloadedQuery,
} from "react-relay";
import type { ProgramFeedsQuery } from "$generated/ProgramFeedsQuery.graphql";
import { ResettableErrorBoundary } from "$relay/ResettableErrorBoundary";
import { Button } from "$ui/primitives/Button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "$ui/primitives/Collapsible";
import { tokens } from "$ui/theme/tokens.stylex";
import { FeedFactsRow } from "./FeedFactsRow";

const programFeedsQuery = graphql`
  query ProgramFeedsQuery($id: ID!, $first: Int!, $after: String) {
    cjProgram(id: $id) {
      feeds(first: $first, after: $after) {
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
  }
`;

const styles = create({
  details: {
    borderBlockStartColor: tokens.borderQuiet,
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "1px",
    display: "grid",
    gap: "0.75rem",
    paddingBlockStart: "0.85rem",
  },
  list: {
    display: "grid",
    gap: "0.65rem",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.65rem",
  },
});

export function ProgramFeeds({
  programId,
  programName,
}: {
  programId: string;
  programName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [after, setAfter] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const hasLoaded = useRef(false);
  const [queryRef, loadQuery, disposeQuery] = useQueryLoader<ProgramFeedsQuery>(programFeedsQuery);

  useEffect(() => disposeQuery, [disposeQuery]);

  const loadPage = (nextAfter: string | null) => {
    setAfter(nextAfter);
    loadQuery({ id: programId, first: 10, after: nextAfter }, { fetchPolicy: "store-or-network" });
  };

  const retryPage = () => {
    setRetryToken((token) => token + 1);
    loadPage(after);
  };

  return (
    <Collapsible
      onOpenChange={(open) => {
        setIsOpen(open);

        if (open && !hasLoaded.current) {
          hasLoaded.current = true;
          loadPage(null);
        }
      }}
      open={isOpen}
    >
      <CollapsibleTrigger
        aria-label={`${isOpen ? "Hide" : "Show"} feeds for ${programName}`}
        render={<Button variant="link" />}
      >
        {isOpen ? "Hide feeds" : "Show feeds"}
      </CollapsibleTrigger>
      <CollapsibleContent style={styles.details}>
        {queryRef ? (
          <ResettableErrorBoundary
            fallback={<ProgramFeedsUnavailable onRetry={retryPage} programName={programName} />}
            resetToken={retryToken}
          >
            <Suspense fallback={<p>Loading feed details...</p>}>
              <ProgramFeedPage onPage={loadPage} programName={programName} queryRef={queryRef} />
            </Suspense>
          </ResettableErrorBoundary>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
}

function ProgramFeedsUnavailable({
  onRetry,
  programName,
}: {
  onRetry: () => void;
  programName: string;
}) {
  return (
    <div role="alert">
      <p>Feeds unavailable.</p>
      <Button
        aria-label={`Retry feeds for ${programName}`}
        onClick={onRetry}
        type="button"
        variant="secondary"
      >
        Retry feeds
      </Button>
    </div>
  );
}

function ProgramFeedPage({
  onPage,
  programName,
  queryRef,
}: {
  onPage: (after: string | null) => void;
  programName: string;
  queryRef: PreloadedQuery<ProgramFeedsQuery>;
}) {
  const data = usePreloadedQuery<ProgramFeedsQuery>(programFeedsQuery, queryRef);
  const program = data.cjProgram;

  if (!program) {
    return <p>Feeds unavailable.</p>;
  }

  const { feeds } = program;

  return (
    <>
      {feeds.edges.length > 0 ? (
        <ul aria-label={`Feeds for ${programName}`} {...props(styles.list)}>
          {feeds.edges.map(({ node: feed }) => (
            <FeedFactsRow feed={feed} key={feed.id} />
          ))}
        </ul>
      ) : (
        <p>No feeds are linked to this program.</p>
      )}
      {feeds.pageInfo.hasPreviousPage || feeds.pageInfo.hasNextPage ? (
        <div {...props(styles.actions)}>
          {feeds.pageInfo.hasPreviousPage ? (
            <Button
              aria-label={`First feeds for ${programName}`}
              onClick={() => onPage(null)}
              type="button"
              variant="link"
            >
              First feeds
            </Button>
          ) : null}
          {feeds.pageInfo.hasNextPage && feeds.pageInfo.endCursor ? (
            <Button
              aria-label={`Next feeds for ${programName}`}
              onClick={() => onPage(feeds.pageInfo.endCursor)}
              type="button"
              variant="link"
            >
              Next feeds
            </Button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
