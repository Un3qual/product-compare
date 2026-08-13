import { create, props } from "@stylexjs/stylex";
import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import { Fragment, useState } from "react";
import { graphql, useFragment, usePaginationFragment } from "react-relay";
import type { AttributionLedger_connection$key } from "$generated/AttributionLedger_connection.graphql";
import type { AttributionLedgerPaginationQuery } from "$generated/AttributionLedgerPaginationQuery.graphql";
import type {
  AttributionLedger_row$data,
  AttributionLedger_row$key,
} from "$generated/AttributionLedger_row.graphql";
import { formatProductDateTimeLabel } from "$frontend/formatting";
import { Button } from "$ui/primitives/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "$ui/primitives/Table";
import {
  ATTRIBUTION_LEDGER_PAGE_SIZE,
} from "../summary/revenue-summary-data";
import { ConversionDetails } from "./ConversionDetails";

export const attributionLedgerRouteQuery = graphql`
  query AttributionLedgerRouteQuery($input: RevenueSummaryInput, $first: Int!, $after: String) {
    ...AttributionLedger_connection @arguments(input: $input, first: $first, after: $after)
  }
`;

const styles = create({
  cell: { verticalAlign: "top" },
  conversionList: { display: "grid", gap: "0.5rem", listStyle: "none", margin: 0, padding: 0 },
  details: { display: "grid", gap: "0.2rem", margin: 0 },
  row: { borderBlockStart: "1px solid var(--pc-border-quiet)" },
  table: { borderCollapse: "collapse", minWidth: "68rem", width: "100%" },
  title: { fontSize: "1.25rem", marginBlockEnd: "0.5rem" },
  wrapper: { display: "grid", gap: "1rem", marginBlockStart: "2rem" },
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
      networkConversionRef
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
    id: "click",
    header: "Click",
    cell: ({ row }) => <AttributionClickDetails click={row.original} />,
  }),
  columnHelper.display({
    id: "identity",
    header: "Identity",
    cell: ({ row }) => <AttributionIdentity click={row.original} />,
  }),
  columnHelper.display({
    id: "diagnostics",
    header: "Request diagnostics",
    cell: ({ row }) => <AttributionDiagnostics click={row.original} />,
  }),
  columnHelper.display({
    id: "commerce",
    header: "Commerce",
    cell: ({ row }) => <AttributionCommerce click={row.original} />,
  }),
  columnHelper.display({
    id: "conversions",
    header: "Matched conversions",
    cell: ({ row }) => (
      <AttributionConversionList conversions={row.original.matchedConversions} />
    ),
  }),
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
    <section aria-labelledby="attribution-ledger-heading" {...props(styles.wrapper)}>
      <div>
        <h2 id="attribution-ledger-heading" {...props(styles.title)}>
          Attribution ledger
        </h2>
        <p>Individual visits and purchases for the active revenue filters.</p>
      </div>
      {clicks.length === 0 ? (
        <p>No attribution clicks match these filters.</p>
      ) : (
        <Table aria-labelledby="attribution-ledger-heading" style={styles.table}>
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
              <TableRow key={row.id} style={styles.row}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id} style={styles.cell}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <AttributionPaginationControl
        failed={paginationFailed}
        hasNext={hasNext}
        isLoadingNext={isLoadingNext}
        onLoadMore={loadMore}
      />
    </section>
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
    <Button disabled={isLoadingNext} onClick={onLoadMore} type="button">
      {isLoadingNext ? "Loading more attribution clicks…" : "Load more attribution clicks"}
    </Button>
  ) : null;
}

function AttributionDiagnostics({ click }: { click: AttributionClick }) {
  return (
    <dl {...props(styles.details)}>
      <dt>Referrer</dt>
      <dd>{click.referrer ?? "Not captured"}</dd>
      <dt>User agent</dt>
      <dd>{click.userAgent ?? "Not captured"}</dd>
      <dt>IP address</dt>
      <dd>{click.ipAddress ?? "Not captured"}</dd>
    </dl>
  );
}

function AttributionCommerce({ click }: { click: AttributionClick }) {
  const details = [
    ["Merchant", click.merchantName],
    ["Product", click.productName ?? "No product"],
    ["Merchant product", click.merchantProductExternalSku ?? "No SKU"],
    ["Program", click.affiliateProgramCode ?? "No affiliate program"],
    ["Network", click.affiliateNetworkName ?? "No affiliate network"],
  ] as const;

  return (
    <dl {...props(styles.details)}>
      {details.map(([label, value]) => (
        <Fragment key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

function AttributionClickDetails({ click }: { click: AttributionClick }) {
  return (
    <dl {...props(styles.details)}>
      <dt>Created</dt>
      <dd>
        <time dateTime={click.insertedAt}>{formatProductDateTimeLabel(click.insertedAt)}</time>
      </dd>
      <dt>Source</dt>
      <dd>{sourceSurfaceCopy(click.sourceSurface)}</dd>
      <dt>Link type</dt>
      <dd>{linkTypeCopy(click.linkType)}</dd>
    </dl>
  );
}

function AttributionIdentity({ click }: { click: AttributionClick }) {
  if (click.userEmail) {
    return (
      <dl {...props(styles.details)}>
        <dt>User</dt>
        <dd>{click.userEmail}</dd>
      </dl>
    );
  }

  return <p>{click.anonymousVisitor ? "Anonymous visitor" : "Unidentified click"}</p>;
}

function AttributionConversionList({
  conversions,
}: {
  conversions: AttributionClick["matchedConversions"];
}) {
  if (conversions.length === 0) {
    return <p>No matched conversions.</p>;
  }

  return (
    <ul aria-label="Matched conversions" {...props(styles.conversionList)}>
      {conversions.map((conversion) => (
        <ConversionDetails
          conversion={conversion}
          key={`${conversion.affiliateNetworkCode}:${conversion.networkConversionRef}`}
        />
      ))}
    </ul>
  );
}

function sourceSurfaceCopy(value: string) {
  switch (value.toUpperCase()) {
    case "API":
      return "Connected tool";
    case "EXTENSION":
      return "Browser extension";
    case "WEB":
      return "Product Compare website";
    default:
      return "Source unavailable";
  }
}

function linkTypeCopy(value: string) {
  switch (value.toUpperCase()) {
    case "AFFILIATE":
      return "Partner link";
    case "NON_AFFILIATE":
      return "Direct link";
    default:
      return "Link type unavailable";
  }
}
