import { create, props } from "@stylexjs/stylex";
import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { graphql, useFragment, usePaginationFragment } from "react-relay";
import type { AttributionLedger_connection$key } from "$generated/AttributionLedger_connection.graphql";
import type { AttributionLedgerPaginationQuery } from "$generated/AttributionLedgerPaginationQuery.graphql";
import type {
  AttributionLedger_row$data,
  AttributionLedger_row$key,
} from "$generated/AttributionLedger_row.graphql";
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
import {
  ATTRIBUTION_LEDGER_PAGE_SIZE,
  formatCurrencyAmount,
} from "../summary/revenue-summary-data";
import { AttributionClickDetails } from "./AttributionClickDetails";
import { buildAttributionOutcome } from "./attribution-ledger-data";
import {
  attributionConfidenceCopy,
  attributionConfidenceTone,
  conversionStatusCopy,
  conversionStatusTone,
} from "./ConversionDetails";
import { RecentConversion } from "./RecentConversion";

export const attributionLedgerRouteQuery = graphql`
  query AttributionLedgerRouteQuery($input: RevenueSummaryInput, $first: Int!, $after: String) {
    ...AttributionLedger_connection @arguments(input: $input, first: $first, after: $after)
  }
`;

const styles = create({
  wrapper: {
    borderColor: tokens.borderQuiet,
    borderRadius: "var(--pc-radius-large)",
    borderStyle: "solid",
    borderWidth: "1px",
    display: "grid",
    gap: "0.75rem",
    gridArea: "ledger",
    minWidth: 0,
    paddingBlock: "0.9rem",
  },
  header: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem 1rem",
    justifyContent: "space-between",
    paddingInline: "1rem",
  },
  heading: { display: "grid", gap: "0.2rem" },
  title: { fontSize: "1rem", margin: 0 },
  description: { color: tokens.textSecondary, fontSize: "0.8rem", margin: 0 },
  cell: {
    fontSize: "0.8rem",
    minWidth: 0,
    overflowWrap: "anywhere",
    textAlign: "start",
    verticalAlign: "middle",
  },
  row: { borderBlockStart: `1px solid ${tokens.borderQuiet}` },
  table: {
    borderCollapse: "collapse",
    minWidth: { default: "52rem", "@media (min-width: 72rem)": 0 },
    tableLayout: "fixed",
    width: "100%",
  },
  visitColumn: { width: "14%" },
  customerColumn: { width: "20%" },
  commerceColumn: { width: "22%" },
  amountColumn: { width: "11%" },
  stateColumn: { width: "13%" },
  actionColumn: { width: "9%" },
  time: { fontWeight: 650, whiteSpace: "nowrap" },
  identity: { display: "grid", gap: "0.1rem" },
  primary: { fontWeight: 700, lineHeight: 1.25, overflowWrap: "anywhere" },
  secondary: { color: tokens.textSecondary, fontSize: "0.72rem", lineHeight: 1.25 },
  state: { display: "flex", flexWrap: "wrap", gap: "0.25rem" },
  actionCell: { paddingInline: "0.25rem", textAlign: "end", whiteSpace: "nowrap" },
  actionButton: {
    minHeight: "2rem",
    minWidth: 0,
    paddingInline: "0.2rem",
    whiteSpace: "nowrap",
  },
  pagination: { paddingInline: "1rem" },
});

const attributionLedgerFragment = graphql`
  fragment AttributionLedger_connection on RootQueryType
  @refetchable(queryName: "AttributionLedgerPaginationQuery")
  @argumentDefinitions(
    input: { type: "RevenueSummaryInput" }
    first: { type: "Int!" }
    after: { type: "String" }
  ) {
    commerceAttributionClicks(input: $input, first: $first, after: $after)
      @connection(key: "AttributionLedger_commerceAttributionClicks") {
      edges {
        node {
          clickId
          ...AttributionLedger_row
        }
      }
    }
  }
`;

const attributionLedgerRowFragment = graphql`
  fragment AttributionLedger_row on CommerceAttributionClick @relay(plural: true) {
    affiliateNetworkCode
    affiliateNetworkName
    affiliateProgramCode
    anonymousVisitor
    clickId
    insertedAt
    ipAddress
    linkType
    matchedConversions {
      affiliateNetworkCode
      affiliateNetworkName
      attributionConfidence
      commissionAmount
      currency
      merchantName
      networkConversionRef
      orderAmount
      productName
      reportedAt
      status
      ...ConversionDetails_conversion
    }
    merchantName
    merchantProductExternalSku
    productName
    referrer
    sourceSurface
    userAgent
    userEmail
  }
`;

type AttributionClick = AttributionLedger_row$data[number];

const tableModel = tableFeatures({});
const columnHelper = createColumnHelper<typeof tableModel, AttributionClick>();
const columns = columnHelper.columns([
  columnHelper.display({
    id: "visit",
    header: "Visit",
    cell: ({ row }) => (
      <time dateTime={row.original.insertedAt} {...props(styles.time)}>
        {formatProductDateTimeLabel(row.original.insertedAt)}
      </time>
    ),
  }),
  columnHelper.display({
    id: "customer",
    header: "Customer",
    cell: ({ row }) => <AttributionIdentity click={row.original} />,
  }),
  columnHelper.display({
    id: "commerce",
    header: "Commerce",
    cell: ({ row }) => (
      <span {...props(styles.primary)}>
        {row.original.merchantName} · {row.original.productName ?? "No product"}
      </span>
    ),
  }),
  columnHelper.display({
    id: "order",
    header: "Order",
    cell: ({ row }) => <AttributionAmount click={row.original} kind="order" />,
  }),
  columnHelper.display({
    id: "commission",
    header: "Commission",
    cell: ({ row }) => <AttributionAmount click={row.original} kind="commission" />,
  }),
  columnHelper.display({
    id: "state",
    header: "State",
    cell: ({ row }) => <AttributionState click={row.original} />,
  }),
  columnHelper.display({ id: "details", header: "Details", cell: () => null }),
]);

export function AttributionLedger({
  fragmentRef,
}: {
  fragmentRef: AttributionLedger_connection$key;
}) {
  const { data, hasNext, isLoadingNext, loadNext } = usePaginationFragment<
    AttributionLedgerPaginationQuery,
    AttributionLedger_connection$key
  >(attributionLedgerFragment, fragmentRef);
  const rowFragmentRefs: AttributionLedger_row$key = data.commerceAttributionClicks.edges.map(
    ({ node }) => node,
  );
  const clicks = useFragment(attributionLedgerRowFragment, rowFragmentRefs);
  const [paginationFailed, setPaginationFailed] = useState(false);
  const loadMore = () => {
    setPaginationFailed(false);
    loadNext(ATTRIBUTION_LEDGER_PAGE_SIZE, {
      onComplete: (error) => setPaginationFailed(error !== null),
    });
  };
  const table = useTable({
    columns,
    data: clicks,
    features: tableModel,
    getRowId: (row) => row.clickId,
  });

  return (
    <>
      <RecentConversion clicks={clicks} />
      <section aria-labelledby="attribution-ledger-heading" {...props(styles.wrapper)}>
        <header {...props(styles.header)}>
          <div {...props(styles.heading)}>
            <h2 id="attribution-ledger-heading" {...props(styles.title)}>
              Attribution clicks
            </h2>
            <p {...props(styles.description)}>
              Individual visits and purchases for the active revenue filters.
            </p>
          </div>
          <AttributionPaginationControl
            failed={paginationFailed}
            hasNext={hasNext}
            isLoadingNext={isLoadingNext}
            onLoadMore={loadMore}
          />
        </header>
        {clicks.length === 0 ? (
          <p {...props(styles.pagination)}>No attribution clicks match these filters.</p>
        ) : (
          <Table aria-label="Attribution ledger" style={styles.table} tabIndex={0}>
            <colgroup>
              <col {...props(styles.visitColumn)} />
              <col {...props(styles.customerColumn)} />
              <col {...props(styles.commerceColumn)} />
              <col {...props(styles.amountColumn)} />
              <col {...props(styles.amountColumn)} />
              <col {...props(styles.stateColumn)} />
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
                <AttributionLedgerRow click={row.original} key={row.id}>
                  {row
                    .getAllCells()
                    .slice(0, -1)
                    .map((cell) => (
                      <TableCell key={cell.id} style={styles.cell}>
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    ))}
                </AttributionLedgerRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </>
  );
}

function AttributionLedgerRow({
  click,
  children,
}: {
  click: AttributionClick;
  children: ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const time = formatProductDateTimeLabel(click.insertedAt);
  const identity = attributionIdentityCopy(click);
  const target = `${identity} at ${time}`;
  const detailsLabel = `Attribution details for ${target}`;

  return (
    <>
      <TableRow style={styles.row}>
        {children}
        <TableCell style={[styles.cell, styles.actionCell]}>
          <Button
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? "Close" : "Show"} details for ${target}`}
            onClick={() => setIsExpanded((expanded) => !expanded)}
            size="sm"
            style={styles.actionButton}
            type="button"
            variant="link"
          >
            {isExpanded ? "Close" : "Details"}
            {isExpanded ? (
              <ChevronUpIcon aria-hidden="true" size={14} />
            ) : (
              <ChevronDownIcon aria-hidden="true" size={14} />
            )}
          </Button>
        </TableCell>
      </TableRow>
      {isExpanded ? <AttributionClickDetails click={click} label={detailsLabel} /> : null}
    </>
  );
}

function AttributionIdentity({ click }: { click: AttributionClick }) {
  return (
    <span {...props(styles.identity)}>
      <strong {...props(styles.primary)}>{attributionIdentityCopy(click)}</strong>
      <span {...props(styles.secondary)}>
        {click.userEmail
          ? "Known customer"
          : click.anonymousVisitor
            ? "No account linked"
            : "Identity unavailable"}
      </span>
    </span>
  );
}

function attributionIdentityCopy(click: AttributionClick) {
  if (click.userEmail) return click.userEmail;
  return click.anonymousVisitor ? "Anonymous visitor" : "Unidentified click";
}

function AttributionAmount({
  click,
  kind,
}: {
  click: AttributionClick;
  kind: "commission" | "order";
}) {
  const outcome = buildAttributionOutcome(click.matchedConversions);

  if (outcome.kind === "none") return <>—</>;
  if (outcome.kind === "multiple") return <>Multiple</>;

  return (
    <>
      {formatCurrencyAmount(
        kind === "order" ? outcome.conversion.orderAmount : outcome.conversion.commissionAmount,
        outcome.conversion.currency,
      )}
    </>
  );
}

function AttributionState({ click }: { click: AttributionClick }) {
  const outcome = buildAttributionOutcome(click.matchedConversions);

  if (outcome.kind === "none") return <StatusBadge>No conversion</StatusBadge>;
  if (outcome.kind === "multiple") return <StatusBadge>{outcome.count} conversions</StatusBadge>;

  return (
    <span {...props(styles.state)}>
      <StatusBadge tone={conversionStatusTone(outcome.conversion.status)}>
        {conversionStatusCopy(outcome.conversion.status)}
      </StatusBadge>
      <StatusBadge tone={attributionConfidenceTone(outcome.conversion.attributionConfidence)}>
        {attributionConfidenceCopy(outcome.conversion.attributionConfidence)}
      </StatusBadge>
    </span>
  );
}

function AttributionPaginationControl({
  failed,
  hasNext,
  isLoadingNext,
  onLoadMore,
}: {
  failed: boolean;
  hasNext: boolean;
  isLoadingNext: boolean;
  onLoadMore: () => void;
}) {
  if (failed) {
    return (
      <div role="alert">
        <p>Unable to load more attribution clicks.</p>
        <Button disabled={isLoadingNext} onClick={onLoadMore} type="button">
          Retry loading attribution clicks
        </Button>
      </div>
    );
  }

  return hasNext ? (
    <Button disabled={isLoadingNext} onClick={onLoadMore} type="button" variant="link">
      {isLoadingNext ? "Loading more attribution clicks…" : "Load more attribution clicks"}
    </Button>
  ) : null;
}
