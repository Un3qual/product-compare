import { create, props } from "@stylexjs/stylex";
import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import { useState } from "react";
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
import { ATTRIBUTION_LEDGER_PAGE_SIZE } from "../summary/revenue-summary-data";
import { ConversionDetails } from "./ConversionDetails";

export const attributionLedgerRouteQuery = graphql`
  query AttributionLedgerRouteQuery($input: RevenueSummaryInput, $first: Int!, $after: String) {
    ...AttributionLedger_connection @arguments(input: $input, first: $first, after: $after)
  }
`;

const styles = create({
  cell: { minWidth: "12rem", textAlign: "start", verticalAlign: "top" },
  code: {
    fontFamily: tokens.fontMono,
    fontSize: "0.78rem",
    overflowWrap: "anywhere",
  },
  conversionList: { display: "grid", gap: "0.5rem", listStyle: "none", margin: 0, padding: 0 },
  identity: {
    fontSize: "0.9rem",
    fontWeight: 700,
    lineHeight: 1.3,
    margin: 0,
    overflowWrap: "anywhere",
  },
  meta: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.35rem",
  },
  primary: {
    fontWeight: 700,
    lineHeight: 1.3,
    margin: 0,
    overflowWrap: "anywhere",
  },
  row: { borderBlockStart: "1px solid var(--pc-border-quiet)" },
  secondary: {
    color: tokens.textSecondary,
    fontSize: "0.88rem",
    lineHeight: 1.4,
    margin: 0,
    overflowWrap: "anywhere",
  },
  stack: { display: "grid", gap: "0.55rem" },
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
    cell: ({ row }) => <AttributionConversionList conversions={row.original.matchedConversions} />,
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
  const referrer = referrerCopy(click.referrer);

  return (
    <div {...props(styles.stack)}>
      <strong title={click.referrer ?? undefined} {...props(styles.primary)}>
        {referrer}
      </strong>
      <span title={click.userAgent ?? undefined} {...props(styles.secondary)}>
        {userAgentCopy(click.userAgent)}
      </span>
      <code {...props(styles.code)}>{click.ipAddress ?? "IP not captured"}</code>
    </div>
  );
}

function AttributionCommerce({ click }: { click: AttributionClick }) {
  return (
    <div {...props(styles.stack)}>
      <div>
        <p {...props(styles.primary)}>{click.merchantName}</p>
        <p {...props(styles.secondary)}>{click.productName ?? "No product"}</p>
      </div>
      <div {...props(styles.meta)}>
        <StatusBadge>{click.affiliateNetworkName ?? "No network"}</StatusBadge>
        <code title="Merchant SKU" {...props(styles.code)}>
          {click.merchantProductExternalSku ?? "No SKU"}
        </code>
      </div>
      <code title="Affiliate program" {...props(styles.code)}>
        {click.affiliateProgramCode ?? "No affiliate program"}
      </code>
    </div>
  );
}

function AttributionClickDetails({ click }: { click: AttributionClick }) {
  return (
    <div {...props(styles.stack)}>
      <time dateTime={click.insertedAt} {...props(styles.primary)}>
        {formatProductDateTimeLabel(click.insertedAt)}
      </time>
      <div {...props(styles.meta)}>
        <StatusBadge tone="accent">{sourceSurfaceCopy(click.sourceSurface)}</StatusBadge>
        <StatusBadge>{linkTypeCopy(click.linkType)}</StatusBadge>
      </div>
    </div>
  );
}

function AttributionIdentity({ click }: { click: AttributionClick }) {
  if (click.userEmail) {
    return (
      <div {...props(styles.stack)}>
        <strong {...props(styles.identity)}>{click.userEmail}</strong>
        <span {...props(styles.secondary)}>Known customer</span>
      </div>
    );
  }

  return (
    <div {...props(styles.stack)}>
      <p {...props(styles.primary)}>
        {click.anonymousVisitor ? "Anonymous visitor" : "Unidentified click"}
      </p>
      <span {...props(styles.secondary)}>No account linked</span>
    </div>
  );
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

function sourceSurfaceCopy(value: AttributionClick["sourceSurface"]) {
  switch (value) {
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

function linkTypeCopy(value: AttributionClick["linkType"]) {
  switch (value) {
    case "AFFILIATE":
      return "Partner link";
    case "NON_AFFILIATE":
      return "Direct link";
    default:
      return "Link type unavailable";
  }
}

function referrerCopy(value: AttributionClick["referrer"]) {
  if (!value) {
    return "Not captured";
  }

  try {
    const url = new URL(value);
    const path = url.pathname === "/" ? "" : ` ${url.pathname}`;

    return `${url.hostname}${path}`;
  } catch {
    return value;
  }
}

function userAgentCopy(value: AttributionClick["userAgent"]) {
  return value?.replace(/([A-Za-z])\/(?=\d)/g, "$1 ") ?? "Not captured";
}
