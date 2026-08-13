import { useId } from "react";
import { create, props } from "@stylexjs/stylex";
import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import type { CJProgramsRouteQuery } from "$generated/CJProgramsRouteQuery.graphql";
import { Pagination } from "$ui/components/navigation/Pagination";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "$ui/primitives/Table";
import { tokens } from "$ui/theme/tokens.stylex";
import { ProgramLifecycleRow } from "./ProgramLifecycleRow";
import { buildCJLifecycleSummary, selectCJProgramAttention } from "./program-dashboard-data";
import type { buildCJProgramPaginationData } from "../pagination";

type ProgramsConnection = CJProgramsRouteQuery["response"]["cjPrograms"];
type ProgramReference = ProgramsConnection["edges"][number]["node"];
type ProgramPagination = ReturnType<typeof buildCJProgramPaginationData>["program"];

const styles = create({
  lifecycle: {
    borderColor: tokens.borderQuiet,
    borderRadius: "var(--pc-radius-large)",
    borderStyle: "solid",
    borderWidth: "1px",
    display: "grid",
    gap: "0.75rem",
    gridArea: "lifecycle",
    minWidth: 0,
    padding: "0.9rem 1rem",
  },
  lifecycleTitle: { fontSize: "0.9rem", margin: 0 },
  lifecycleMetrics: {
    display: "grid",
    gridTemplateColumns: {
      default: "repeat(8, minmax(0, 1fr))",
      "@media (max-width: 64rem)": "repeat(4, minmax(0, 1fr))",
      "@media (max-width: 36rem)": "repeat(2, minmax(0, 1fr))",
    },
    margin: 0,
  },
  lifecycleMetric: {
    borderInlineStartColor: tokens.borderQuiet,
    borderInlineStartStyle: "solid",
    borderInlineStartWidth: "1px",
    display: "grid",
    gap: "0.15rem",
    minWidth: 0,
    paddingInline: "0.65rem",
  },
  lifecycleLabel: { color: tokens.textSecondary, fontSize: "0.72rem" },
  lifecycleValue: { fontSize: "1rem", fontWeight: 750, margin: 0 },
  attention: {
    borderColor: tokens.borderQuiet,
    borderRadius: "var(--pc-radius-large)",
    borderStyle: "solid",
    borderWidth: "1px",
    display: "grid",
    gap: "0.45rem",
    gridArea: "attention",
    minWidth: 0,
    padding: "1rem",
  },
  attentionHeader: {
    alignItems: "baseline",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.4rem 0.75rem",
    justifyContent: "space-between",
  },
  attentionTitle: { fontSize: "0.9rem", margin: 0 },
  attentionCount: { color: tokens.textSecondary, fontSize: "0.78rem", margin: 0 },
  attentionProgram: { fontWeight: 750, margin: 0 },
  attentionAction: { color: tokens.textSecondary, fontSize: "0.82rem", margin: 0 },
  attentionLink: { fontSize: "0.82rem" },
  programs: {
    borderColor: tokens.borderQuiet,
    borderRadius: "var(--pc-radius-large)",
    borderStyle: "solid",
    borderWidth: "1px",
    display: "grid",
    gap: "0.75rem",
    gridArea: "programs",
    minWidth: 0,
    paddingBlock: "0.9rem",
  },
  programsHeader: { alignItems: "baseline", display: "flex", gap: "0.6rem", paddingInline: "1rem" },
  programsTitle: { fontSize: "1rem", margin: 0 },
  programsCount: { color: tokens.textSecondary, fontSize: "0.78rem", margin: 0 },
  pagination: { paddingInline: "1rem" },
  actionColumn: { width: "31%" },
  empty: { color: tokens.textSecondary, margin: 0, paddingInline: "1rem" },
  lastChangeColumn: { width: "23%" },
  lifecycleColumn: { width: "18%" },
  merchantColumn: { width: "28%" },
  table: {
    minWidth: { default: "44rem", "@media (min-width: 62rem)": 0 },
    tableLayout: "fixed",
    width: "100%",
  },
});

const tableModel = tableFeatures({});
const columnHelper = createColumnHelper<typeof tableModel, ProgramReference>();
const columns = columnHelper.columns([
  columnHelper.display({ id: "merchant", header: "Merchant" }),
  columnHelper.display({ id: "lifecycle", header: "Lifecycle" }),
  columnHelper.display({ id: "lastChange", header: "Last change" }),
  columnHelper.display({ id: "action", header: "Action" }),
]);

export function ProgramLifecycleTable({ counts, pagination, programs }: {
  counts: CJProgramsRouteQuery["response"]["cjProgramStageCounts"];
  pagination: ProgramPagination;
  programs: ProgramsConnection;
}) {
  const lifecycleId = useId();
  const attentionId = useId();
  const lifecycle = buildCJLifecycleSummary(counts);
  const programNodes = programs.edges.map(({ node }) => node);
  const attention = selectCJProgramAttention(programNodes);
  const table = useTable({
    columns,
    data: programNodes,
    features: tableModel,
    getRowId: (program) => program.id,
  });

  return (
    <>
      <section aria-labelledby={lifecycleId} {...props(styles.lifecycle)}>
        <h2 id={lifecycleId} {...props(styles.lifecycleTitle)}>
          CJ program lifecycle summary
        </h2>
        <dl {...props(styles.lifecycleMetrics)}>
          {lifecycle.map((item) => (
            <div key={item.label} {...props(styles.lifecycleMetric)}>
              <dt {...props(styles.lifecycleLabel)}>{item.label}</dt>
              <dd {...props(styles.lifecycleValue)}>{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section aria-labelledby={attentionId} {...props(styles.attention)}>
        <header {...props(styles.attentionHeader)}>
          <h2 id={attentionId} {...props(styles.attentionTitle)}>
            Program attention
          </h2>
          <p {...props(styles.attentionCount)}>Needs attention on this page</p>
        </header>
        <p {...props(styles.attentionCount)}>
          {attention.count === 1
            ? "1 program on this page needs attention"
            : `${attention.count} programs on this page need attention`}
        </p>
        {attention.program ? (
          <>
            <p {...props(styles.attentionProgram)}>
              {attention.program.advertiserName ?? attention.program.advertiserId}
            </p>
            <p {...props(styles.attentionAction)}>{attention.requiredAction}</p>
            <a href="#cj-program-work-queue" {...props(styles.attentionLink)}>
              Review programs
            </a>
          </>
        ) : (
          <p {...props(styles.attentionAction)}>No loaded programs need action.</p>
        )}
      </section>
      <section aria-labelledby="cj-program-work-queue" {...props(styles.programs)}>
        <header {...props(styles.programsHeader)}>
          <h2 id="cj-program-work-queue" {...props(styles.programsTitle)}>
            Programs work queue
          </h2>
          <p {...props(styles.programsCount)}>{programs.edges.length} programs on this page</p>
        </header>
        {programs.edges.length > 0 ? (
          <Table aria-label="CJ program lifecycle ledger" style={styles.table}>
            <colgroup>
              <col {...props(styles.merchantColumn)} />
              <col {...props(styles.lifecycleColumn)} />
              <col {...props(styles.lastChangeColumn)} />
              <col {...props(styles.actionColumn)} />
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
                <ProgramLifecycleRow key={row.id} program={row.original} />
              ))}
            </TableBody>
          </Table>
        ) : (
          <p {...props(styles.empty)}>No CJ programs captured yet.</p>
        )}
        <div {...props(styles.pagination)}>
          <Pagination
            firstHref={pagination.firstHref}
            firstLabel="First programs"
            label="CJ program pages"
            nextHref={pagination.nextHref}
            nextLabel="Next programs"
          />
        </div>
      </section>
    </>
  );
}
