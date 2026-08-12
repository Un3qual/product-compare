import { Suspense, useEffect, useRef, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { useRevalidator } from "react-router-dom";
import {
  graphql,
  useFragment,
  useMutation,
  usePreloadedQuery,
  useQueryLoader,
  type PreloadedQuery,
} from "react-relay";
import type { CJProgramRowFeedsQuery } from "$generated/CJProgramRowFeedsQuery.graphql";
import type { CJProgramRow_program$key } from "$generated/CJProgramRow_program.graphql";
import type { CJProgramRowUpdateCJProgramMutation } from "$generated/CJProgramRowUpdateCJProgramMutation.graphql";
import { ResettableErrorBoundary } from "$relay/ResettableErrorBoundary";
import { StatusBadge } from "$ui/components/status/StatusBadge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "$ui/primitives/Collapsible";
import { Button } from "$ui/primitives/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "$ui/primitives/Select";
import { Textarea } from "$ui/primitives/Textarea";
import { tokens } from "$ui/theme/tokens.stylex";
import {
  CJ_PROGRAM_STAGES,
  cjProgramStageLabel,
  cjProgramWarningCopy,
  formatCJDateTime,
  isCJProgramStage,
  type CJProgramStage,
} from "./cj-program-data";
import { CJFeedRow } from "./CJFeedRow";

const cjProgramFragment = graphql`
  fragment CJProgramRow_program on CJProgram {
    id
    advertiserId
    advertiserName
    stage
    note
    lastChanged
    feedCount
    warningCodes
  }
`;

const cjProgramFeedsQuery = graphql`
  query CJProgramRowFeedsQuery($id: ID!, $first: Int!, $after: String) {
    cjProgram(id: $id) {
      feeds(first: $first, after: $after) {
        edges {
          node {
            id
            ...CJFeedRow_feed
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

const updateCJProgramMutation = graphql`
  mutation CJProgramRowUpdateCJProgramMutation($input: UpdateCjProgramInput!) {
    updateCjProgram(input: $input) {
      errors {
        code
        field
        message
      }
    }
  }
`;

const styles = create({
  item: {
    borderBlockEndColor: tokens.borderQuiet,
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
    display: "grid",
    gap: "0.8rem",
    paddingBlock: "1.15rem",
  },
  header: {
    alignItems: "start",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.6rem 1rem",
    justifyContent: "space-between",
  },
  title: {
    margin: 0,
  },
  facts: {
    color: tokens.textSecondary,
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem 1rem",
    margin: 0,
  },
  controls: {
    alignItems: "end",
    display: "grid",
    gap: "0.65rem",
    gridTemplateColumns: {
      default: "minmax(10rem, 0.6fr) minmax(14rem, 1fr) auto",
      "@media (max-width: 42rem)": "1fr",
    },
  },
  field: {
    display: "grid",
    gap: "0.35rem",
  },
  label: {
    color: tokens.textSecondary,
    fontSize: "0.82rem",
    fontWeight: 600,
  },
  warnings: {
    color: tokens.textSecondary,
    display: "grid",
    gap: "0.25rem",
    margin: 0,
    paddingInlineStart: "1rem",
  },
  feedDetails: {
    borderBlockStartColor: tokens.borderQuiet,
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "1px",
    display: "grid",
    gap: "0.75rem",
    paddingBlockStart: "0.85rem",
  },
  feedList: {
    display: "grid",
    gap: "0.65rem",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  feedActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.65rem",
  },
});

export function CJProgramRow({ program: programRef }: { program: CJProgramRow_program$key }) {
  const program = useFragment(cjProgramFragment, programRef);
  const programName = program.advertiserName ?? program.advertiserId;
  const [stage, setStage] = useState<CJProgramStage | null>(
    isCJProgramStage(program.stage) ? program.stage : null,
  );
  const [note, setNote] = useState(program.note ?? "");
  const [feedback, setFeedback] = useState("");
  const revalidator = useRevalidator();
  const [commitUpdate, isUpdateInFlight] =
    useMutation<CJProgramRowUpdateCJProgramMutation>(updateCJProgramMutation);
  const stageLabel = cjProgramStageLabel(program.stage) ?? program.stage ?? null;
  const warnings = program.warningCodes
    .map(cjProgramWarningCopy)
    .filter((warning) => warning !== null);
  const lastChanged = formatCJDateTime(program.lastChanged);
  const stageOptions = [
    ...(stage ? [] : [{ label: "Stage unavailable", value: "" }]),
    ...CJ_PROGRAM_STAGES.map(({ label, value }) => ({ label, value })),
  ];

  useEffect(() => {
    setStage(isCJProgramStage(program.stage) ? program.stage : null);
    setNote(program.note ?? "");
  }, [program.lastChanged, program.note, program.stage]);

  const handleSave = () => {
    if (!stage) {
      return;
    }

    setFeedback("");
    commitUpdate({
      variables: {
        input: {
          id: program.id,
          stage,
          note: note.trim() || null,
          expectedChangedAt: program.lastChanged,
        },
      },
      onCompleted(response) {
        const payload = response.updateCjProgram;
        const errors = payload.errors ?? [];

        if (errors.length > 0) {
          if (errors.some((error) => error.code === "CONFLICT")) {
            revalidator.revalidate();
          }

          setFeedback(errors.map((error) => error.message).join(" "));
          return;
        }

        revalidator.revalidate();
        setFeedback(`${programName} saved.`);
      },
      onError() {
        setFeedback("CJ program could not be updated.");
      },
    });
  };

  const programSummary = (
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
  );

  return (
    <li aria-busy={isUpdateInFlight} {...props(styles.item)}>
      {programSummary}
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
          <Select
            disabled={isUpdateInFlight || !stage}
            items={stageOptions}
            onValueChange={(nextStage) => {
              const value = nextStage ?? "";
              if (isCJProgramStage(value)) {
                setStage(value);
              }
            }}
            value={stage ?? ""}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stageOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label {...props(styles.field)}>
          <span {...props(styles.label)}>Note for {programName}</span>
          <Textarea
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
          {isUpdateInFlight ? "Saving..." : "Save"}
        </Button>
      </div>
      {feedback ? <p role="status">{feedback}</p> : null}
      <CJProgramFeedDisclosure programId={program.id} programName={programName} />
    </li>
  );
}

function CJProgramFeedDisclosure({
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
  const [queryRef, loadQuery, disposeQuery] =
    useQueryLoader<CJProgramRowFeedsQuery>(cjProgramFeedsQuery);

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
        render={
          <Button
            aria-label={`${isOpen ? "Hide" : "Show"} feeds for ${programName}`}
            type="button"
            variant="secondary"
          />
        }
      >
        {isOpen ? "Hide feeds" : "Show feeds"}
      </CollapsibleTrigger>
      <CollapsibleContent style={styles.feedDetails}>
        {queryRef ? (
          <ResettableErrorBoundary
            fallback={<CJProgramFeedUnavailable onRetry={retryPage} programName={programName} />}
            resetToken={retryToken}
          >
            <Suspense fallback={<p>Loading feed details...</p>}>
              <CJProgramFeeds onPage={loadPage} programName={programName} queryRef={queryRef} />
            </Suspense>
          </ResettableErrorBoundary>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
}

function CJProgramFeedUnavailable({
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

function CJProgramFeeds({
  onPage,
  programName,
  queryRef,
}: {
  onPage: (after: string | null) => void;
  programName: string;
  queryRef: PreloadedQuery<CJProgramRowFeedsQuery>;
}) {
  const data = usePreloadedQuery<CJProgramRowFeedsQuery>(cjProgramFeedsQuery, queryRef);
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
            <CJFeedRow feed={feed} key={feed.id} />
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
              variant="secondary"
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
