import { Suspense, useEffect, useRef, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { useRevalidator } from "react-router-dom";
import {
  useMutation,
  usePreloadedQuery,
  useQueryLoader,
  type PreloadedQuery
} from "react-relay";
import cjProgramFeedsQuery, {
  type CJProgramFeedsQuery
} from "../../../__generated__/CJProgramFeedsQuery.graphql";
import type { CJProgramsRouteQuery } from "../../../__generated__/CJProgramsRouteQuery.graphql";
import type { UpdateCJProgramMutation } from "../../../__generated__/UpdateCJProgramMutation.graphql";
import updateCJProgramMutation from "../../../__generated__/UpdateCJProgramMutation.graphql";
import { StatusBadge } from "../../../ui/components/status/StatusBadge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "../../../ui/primitives/Collapsible";
import { Button } from "../../../ui/primitives/Button";
import { tokens } from "../../../ui/theme/tokens.stylex";
import {
  buildUpdateCJProgramInput,
  cjProgramStageLabel,
  cjProgramWarningCopy,
  formatCJProgramLastChanged,
  formatCJProgramName,
  formatFeedProductCount
} from "./cj-program-data";
import type { CJProgramStage } from "./pagination";

type CJProgram = CJProgramsRouteQuery["response"]["cjPrograms"]["edges"][number]["node"];

const stages = [
  ["NEW", "New"],
  ["CONSIDERING", "Considering"],
  ["SELECTED", "Selected"],
  ["APPLIED", "Applied"],
  ["ACCEPTED", "Accepted"],
  ["NOT_PURSUING", "Not pursuing"],
  ["DECLINED", "Declined"]
] as const satisfies readonly [CJProgramStage, string][];

const styles = create({
  item: {
    borderBlockEndColor: tokens.borderQuiet,
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
    display: "grid",
    gap: "0.8rem",
    paddingBlock: "1.15rem"
  },
  header: {
    alignItems: "start",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.6rem 1rem",
    justifyContent: "space-between"
  },
  title: {
    margin: 0
  },
  facts: {
    color: tokens.textSecondary,
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem 1rem",
    margin: 0
  },
  controls: {
    alignItems: "end",
    display: "grid",
    gap: "0.65rem",
    gridTemplateColumns: {
      default: "minmax(10rem, 0.6fr) minmax(14rem, 1fr) auto",
      "@media (max-width: 42rem)": "1fr"
    }
  },
  field: {
    display: "grid",
    gap: "0.35rem"
  },
  label: {
    color: tokens.textSecondary,
    fontSize: "0.82rem",
    fontWeight: 600
  },
  warnings: {
    color: tokens.textSecondary,
    display: "grid",
    gap: "0.25rem",
    margin: 0,
    paddingInlineStart: "1rem"
  },
  feedDetails: {
    borderBlockStartColor: tokens.borderQuiet,
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "1px",
    display: "grid",
    gap: "0.75rem",
    paddingBlockStart: "0.85rem"
  },
  feedList: {
    display: "grid",
    gap: "0.65rem",
    listStyle: "none",
    margin: 0,
    padding: 0
  },
  feed: {
    borderBlockEndColor: tokens.borderQuiet,
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
    display: "grid",
    gap: "0.25rem",
    paddingBlockEnd: "0.65rem"
  },
  feedTitle: {
    margin: 0
  },
  feedFacts: {
    color: tokens.textSecondary,
    display: "flex",
    flexWrap: "wrap",
    gap: "0.35rem 0.75rem",
    margin: 0
  },
  feedActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.65rem"
  }
});

export function CJProgramRow({ program }: { program: CJProgram }) {
  const programName = formatCJProgramName(program);
  const [stage, setStage] = useState<CJProgramStage | null>(
    isCJProgramStage(program.stage) ? program.stage : null
  );
  const [note, setNote] = useState(program.note ?? "");
  const [feedback, setFeedback] = useState("");
  const [isFeedsOpen, setIsFeedsOpen] = useState(false);
  const hasLoadedFeeds = useRef(false);
  const revalidator = useRevalidator();
  const [commitUpdate, isUpdateInFlight] = useMutation<UpdateCJProgramMutation>(
    updateCJProgramMutation
  );
  const [feedQueryRef, loadFeedQuery, disposeFeedQuery] = useQueryLoader<CJProgramFeedsQuery>(
    cjProgramFeedsQuery
  );
  const stageLabel = cjProgramStageLabel(program.stage) ?? program.stage ?? null;
  const warnings = program.warningCodes
    .map(cjProgramWarningCopy)
    .filter((warning) => warning !== null);
  const lastChanged = formatCJProgramLastChanged(program.lastChanged);

  useEffect(() => disposeFeedQuery, [disposeFeedQuery]);

  const handleSave = () => {
    if (!stage) {
      return;
    }

    setFeedback("");
    commitUpdate({
      variables: {
        input: buildUpdateCJProgramInput(program.id, stage, note)
      },
      onCompleted(response) {
        const payload = response.updateCjProgram;
        const errors = payload.errors ?? [];

        if (errors.length > 0) {
          setFeedback(errors.map((error) => error.message).join(" "));
          return;
        }

        revalidator.revalidate();
        setFeedback(`${programName} saved.`);
      },
      onError() {
        setFeedback("CJ program could not be updated.");
      }
    });
  };

  return (
    <li {...props(styles.item)}>
      <header {...props(styles.header)}>
        <div>
          <h2 {...props(styles.title)}>{programName}</h2>
          <p {...props(styles.facts)}>
            <span>Advertiser ID {program.advertiserId}</span>
            <span>{formatFeedCount(program.feedCount)}</span>
            {lastChanged ? <span>Last changed {lastChanged}</span> : null}
          </p>
        </div>
        {stageLabel ? <StatusBadge>{stageLabel}</StatusBadge> : null}
      </header>
      {warnings.length > 0 ? (
        <ul aria-label={`Warnings for ${programName}`} {...props(styles.warnings)}>
          {warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}
      <div {...props(styles.controls)}>
        <label {...props(styles.field)}>
          <span {...props(styles.label)}>Stage for {programName}</span>
          <select
            disabled={isUpdateInFlight || !stage}
            onChange={(event) => {
              const nextStage = event.currentTarget.value;

              if (isCJProgramStage(nextStage)) {
                setStage(nextStage);
              }
            }}
            value={stage ?? ""}
          >
            {stage ? null : <option value="">Stage unavailable</option>}
            {stages.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label {...props(styles.field)}>
          <span {...props(styles.label)}>Note for {programName}</span>
          <textarea
            disabled={isUpdateInFlight || !stage}
            onChange={(event) => setNote(event.currentTarget.value)}
            value={note}
          />
        </label>
        <Button
          aria-label={`Save ${programName}`}
          disabled={isUpdateInFlight || !stage}
          onClick={handleSave}
          type="button"
        >
          Save
        </Button>
      </div>
      {feedback ? <p role="status">{feedback}</p> : null}
      <Collapsible
        onOpenChange={(open) => {
          setIsFeedsOpen(open);

          if (open && !hasLoadedFeeds.current) {
            hasLoadedFeeds.current = true;
            loadFeedQuery(
              { id: program.id, first: 10, after: null },
              { fetchPolicy: "store-or-network" }
            );
          }
        }}
        open={isFeedsOpen}
      >
        <CollapsibleTrigger asChild>
          <Button aria-label={`${isFeedsOpen ? "Hide" : "Show"} feeds for ${programName}`} type="button" variant="soft">
            {isFeedsOpen ? "Hide feeds" : "Show feeds"}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent {...props(styles.feedDetails)}>
          {feedQueryRef ? (
            <Suspense fallback={<p>Loading feed details...</p>}>
              <CJProgramFeeds
                onPage={(after) =>
                  loadFeedQuery(
                    { id: program.id, first: 10, after },
                    { fetchPolicy: "store-or-network" }
                  )
                }
                programName={programName}
                queryRef={feedQueryRef}
              />
            </Suspense>
          ) : null}
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}

function CJProgramFeeds({
  onPage,
  programName,
  queryRef
}: {
  onPage: (after: string | null) => void;
  programName: string;
  queryRef: PreloadedQuery<CJProgramFeedsQuery>;
}) {
  const data = usePreloadedQuery<CJProgramFeedsQuery>(cjProgramFeedsQuery, queryRef);
  const program = data.cjProgram;

  if (!program) {
    return <p>Feeds unavailable.</p>;
  }

  const { feeds } = program;

  return (
    <>
      {feeds.edges.length > 0 ? (
        <ul aria-label={`Feeds for ${programName}`} {...props(styles.feedList)}>
          {feeds.edges.map(({ node: feed }) => (
            <li key={feed.id} {...props(styles.feed)}>
              <h3 {...props(styles.feedTitle)}>{feed.feedName ?? feed.providerFeedId}</h3>
              <p {...props(styles.feedFacts)}>
                <span>{formatFeedProductCount(feed.productCount)}</span>
                {feed.advertiserCountry ? <span>{feed.advertiserCountry}</span> : null}
                {feed.currency ? <span>{feed.currency}</span> : null}
                {feed.language ? <span>{feed.language}</span> : null}
                {feed.sourceFeedType ? <span>{feed.sourceFeedType}</span> : null}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No feeds are linked to this program.</p>
      )}
      {feeds.pageInfo.hasPreviousPage || feeds.pageInfo.hasNextPage ? (
        <div {...props(styles.feedActions)}>
          {feeds.pageInfo.hasPreviousPage ? (
            <Button
              aria-label={`First feeds for ${programName}`}
              onClick={() => onPage(null)}
              type="button"
              variant="soft"
            >
              First feeds
            </Button>
          ) : null}
          {feeds.pageInfo.hasNextPage && feeds.pageInfo.endCursor ? (
            <Button
              aria-label={`Next feeds for ${programName}`}
              onClick={() => onPage(feeds.pageInfo.endCursor ?? null)}
              type="button"
            >
              Next feeds
            </Button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function formatFeedCount(feedCount: number | null | undefined) {
  if (typeof feedCount !== "number") {
    return "Feed count unavailable";
  }

  return feedCount === 1 ? "1 feed" : `${feedCount} feeds`;
}

function isCJProgramStage(stage: string): stage is CJProgramStage {
  return stages.some(([value]) => value === stage);
}
