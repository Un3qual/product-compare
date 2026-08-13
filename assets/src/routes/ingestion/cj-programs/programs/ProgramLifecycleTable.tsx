import { create, props } from "@stylexjs/stylex";
import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import type { CJProgramsRouteQuery } from "$generated/CJProgramsRouteQuery.graphql";
import { SummaryStrip } from "$ui/components/data/SummaryStrip";
import { Pagination } from "$ui/components/navigation/Pagination";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "$ui/primitives/Table";
import { tokens } from "$ui/theme/tokens.stylex";
import { ProgramLifecycleRow } from "./ProgramLifecycleRow";
import { CJ_PROGRAM_STAGES } from "./lifecycle-policy";
import type { buildCJProgramPaginationData } from "../pagination";

type ProgramsConnection = CJProgramsRouteQuery["response"]["cjPrograms"];
type ProgramReference = ProgramsConnection["edges"][number]["node"];
type ProgramPagination = ReturnType<typeof buildCJProgramPaginationData>["program"];

const styles = create({
  content: { display: "grid", gap: "1rem" },
  empty: { color: tokens.textSecondary, margin: 0 },
  table: { minWidth: "64rem" },
});

const tableModel = tableFeatures({});
const columnHelper = createColumnHelper<typeof tableModel, ProgramReference>();
const columns = columnHelper.columns([
  columnHelper.display({ id: "merchant", header: "Merchant" }),
  columnHelper.display({ id: "lifecycle", header: "Lifecycle" }),
  columnHelper.display({ id: "lastChange", header: "Last change" }),
  columnHelper.display({ id: "requiredAction", header: "Required action" }),
  columnHelper.display({ id: "controls", header: "Controls" }),
]);

export function ProgramLifecycleTable({
  counts,
  pagination,
  programs,
}: {
  counts: CJProgramsRouteQuery["response"]["cjProgramStageCounts"];
  pagination: ProgramPagination;
  programs: ProgramsConnection;
}) {
  const table = useTable({
    columns,
    data: programs.edges.map(({ node }) => node),
    features: tableModel,
    getRowId: (program) => program.id,
  });

  return (
    <section aria-label="CJ program lifecycle workspace" {...props(styles.content)}>
      <SummaryStrip
        items={CJ_PROGRAM_STAGES.map(({ countKey, label }) => ({
          label,
          value: counts[countKey],
        }))}
        label="CJ program lifecycle summary"
      />
      {programs.edges.length > 0 ? (
        <Table aria-label="CJ program lifecycle ledger" style={styles.table}>
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
      <Pagination
        firstHref={pagination.firstHref}
        firstLabel="First programs"
        label="CJ program pages"
        nextHref={pagination.nextHref}
        nextLabel="Next programs"
      />
    </section>
  );
}
