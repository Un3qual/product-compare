import { useEffect, useId, useState, type ReactNode } from "react";
import { create, props } from "@stylexjs/stylex";
import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import { graphql, usePaginationFragment } from "react-relay";
import type { ConversionSyncRunLedger_connection$key } from "$generated/ConversionSyncRunLedger_connection.graphql";
import type { ConversionSyncRunLedger_connection$data } from "$generated/ConversionSyncRunLedger_connection.graphql";
import type { ConversionSyncRunLedgerPaginationQuery } from "$generated/ConversionSyncRunLedgerPaginationQuery.graphql";
import { formatProductDateTimeLabel } from "$frontend/formatting";
import { StatusBadge } from "$ui/components/status/StatusBadge";
import { Button } from "$ui/primitives/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "$ui/primitives/Table";
import { tokens } from "$ui/theme/tokens.stylex";
import { SYNC_RUN_PAGE_SIZE, formatSyncRunDuration } from "./conversion-ingestion-data";

export const conversionSyncRunLedgerConnection = graphql`
  fragment ConversionSyncRunLedger_connection on RootQueryType
  @refetchable(queryName: "ConversionSyncRunLedgerPaginationQuery")
  @argumentDefinitions(first: { type: "Int!" }, after: { type: "String" }) {
    cjCommissionSyncRuns(first: $first, after: $after)
      @connection(key: "ConversionSyncRunLedger_cjCommissionSyncRuns") {
      edges {
        cursor
        node {
          id
          status
          trigger
          windowStart
          windowEnd
          pagesFetched
          recordsFetched
          recordsPersisted
          recordsFailed
          startedAt
          finishedAt
          errorSummary
        }
      }
    }
  }
`;

const styles = create({
  surface: {
    borderBlockStartColor: tokens.borderQuiet,
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "1px",
    display: "grid",
    gap: "0.75rem",
    paddingBlockStart: "1rem",
  },
  header: { display: "grid", gap: "0.25rem" },
  title: { fontSize: "1rem", margin: 0 },
  description: { color: tokens.textSecondary, fontSize: "0.85rem", margin: 0 },
  table: { minWidth: "58rem", tableLayout: "fixed" },
  cell: { fontSize: "0.8rem", overflowWrap: "anywhere" },
  detail: {
    backgroundColor: tokens.surfaceMuted,
    color: tokens.textSecondary,
    fontSize: "0.8rem",
    lineHeight: 1.45,
  },
  counts: { display: "grid", gap: "0.15rem" },
  pagination: { display: "flex", flexWrap: "wrap", gap: "0.75rem" },
  error: { color: "var(--pc-danger)", fontSize: "0.85rem", margin: 0 },
});

const tableModel = tableFeatures({});
const columnHelper = createColumnHelper<
  typeof tableModel,
  ConversionSyncRunLedger_connection$data["cjCommissionSyncRuns"]["edges"][number]["node"]
>();
const columns = columnHelper.columns([
  columnHelper.display({
    id: "trigger",
    header: "Trigger",
    cell: ({ row }) => row.original.trigger.toLowerCase(),
  }),
  columnHelper.display({
    id: "window",
    header: "Window",
    cell: ({ row }) => <TimeRange run={row.original} />,
  }),
  columnHelper.display({
    id: "started",
    header: "Started",
    cell: ({ row }) => (
      <time dateTime={row.original.startedAt}>
        {formatProductDateTimeLabel(row.original.startedAt)}
      </time>
    ),
  }),
  columnHelper.display({
    id: "duration",
    header: "Duration",
    cell: ({ row }) => formatSyncRunDuration(row.original.startedAt, row.original.finishedAt),
  }),
  columnHelper.display({
    id: "pages",
    header: "Pages",
    cell: ({ row }) => String(row.original.pagesFetched),
  }),
  columnHelper.display({
    id: "records",
    header: "Records",
    cell: ({ row }) => <RecordCounts run={row.original} />,
  }),
  columnHelper.display({
    id: "outcome",
    header: "Outcome",
    cell: ({ row }) => <Outcome run={row.original} />,
  }),
]);

export function ConversionSyncRunLedger({
  fragmentRef,
  isVisible,
  onRunningRunObserved,
}: {
  fragmentRef: ConversionSyncRunLedger_connection$key;
  isVisible: boolean;
  onRunningRunObserved: () => void;
}) {
  const { data, hasNext, isLoadingNext, loadNext } = usePaginationFragment<
    ConversionSyncRunLedgerPaginationQuery,
    ConversionSyncRunLedger_connection$key
  >(conversionSyncRunLedgerConnection, fragmentRef);
  const [paginationError, setPaginationError] = useState(false);
  const runs = data.cjCommissionSyncRuns.edges.map(({ node }) => node);
  const runningRunIsPresent = runs.some(({ status }) => status === "RUNNING");
  const table = useTable({ columns, data: runs, features: tableModel, getRowId: (run) => run.id });

  useEffect(() => {
    if (!runningRunIsPresent || !isVisible) return undefined;

    onRunningRunObserved();
    const timer = window.setInterval(onRunningRunObserved, 10_000);
    return () => {
      window.clearInterval(timer);
    };
  }, [isVisible, onRunningRunObserved, runningRunIsPresent]);

  return (
    <section aria-labelledby="conversion-sync-runs-heading" {...props(styles.surface)}>
      <header {...props(styles.header)}>
        <h2 id="conversion-sync-runs-heading" {...props(styles.title)}>
          Conversion sync runs
        </h2>
        <p {...props(styles.description)}>Latest first. Counts reflect the persisted run record.</p>
      </header>
      <Table aria-label="Conversion sync runs" style={styles.table}>
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
            <RunRow key={row.id} run={row.original}>
              {row.getAllCells().map((cell) => (
                <TableCell key={cell.id} {...props(styles.cell)}>
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </RunRow>
          ))}
        </TableBody>
      </Table>
      {runs.length === 0 ? <p role="status">No conversion sync runs have been recorded.</p> : null}
      <div {...props(styles.pagination)}>
        {hasNext ? (
          <Button
            disabled={isLoadingNext}
            onClick={() => {
              setPaginationError(false);
              loadNext(SYNC_RUN_PAGE_SIZE, {
                onComplete: (error) => setPaginationError(error !== null),
              });
            }}
          >
            {isLoadingNext ? "Loading…" : "Load more runs"}
          </Button>
        ) : null}
        {paginationError ? (
          <p role="alert" {...props(styles.error)}>
            Could not load more conversion sync runs.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function RunRow({
  children,
  run,
}: {
  children: ReactNode;
  run: ConversionSyncRunLedger_connection$data["cjCommissionSyncRuns"]["edges"][number]["node"];
}) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  const runLabel = `run started ${formatProductDateTimeLabel(run.startedAt)}`;
  return (
    <>
      <TableRow>{children}</TableRow>
      {run.errorSummary ? (
        <TableRow>
          <TableCell colSpan={7} {...props(styles.detail)}>
            <Button
              aria-controls={detailsId}
              aria-expanded={open}
              aria-label={`${open ? "Hide" : "Show"} failure details for ${runLabel}`}
              onClick={() => setOpen((value) => !value)}
              variant="ghost"
            >
              {open ? "Hide failure details" : "Show failure details"}
            </Button>
            <p hidden={!open} id={detailsId}>
              {run.errorSummary}
            </p>
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}

function TimeRange({
  run,
}: {
  run: ConversionSyncRunLedger_connection$data["cjCommissionSyncRuns"]["edges"][number]["node"];
}) {
  return (
    <>
      <time dateTime={run.windowStart}>{formatProductDateTimeLabel(run.windowStart)}</time>
      <br />
      <time dateTime={run.windowEnd}>{formatProductDateTimeLabel(run.windowEnd)}</time>
    </>
  );
}

function RecordCounts({
  run,
}: {
  run: ConversionSyncRunLedger_connection$data["cjCommissionSyncRuns"]["edges"][number]["node"];
}) {
  return (
    <span {...props(styles.counts)}>
      <span>Fetched {run.recordsFetched}</span>
      <span>Persisted {run.recordsPersisted}</span>
      <span>Failed {run.recordsFailed}</span>
    </span>
  );
}

function Outcome({
  run,
}: {
  run: ConversionSyncRunLedger_connection$data["cjCommissionSyncRuns"]["edges"][number]["node"];
}) {
  const tone =
    run.status === "SUCCEEDED" ? "positive" : run.status === "FAILED" ? "danger" : "warning";
  return <StatusBadge tone={tone}>{run.status[0] + run.status.slice(1).toLowerCase()}</StatusBadge>;
}
