import { create, props } from "@stylexjs/stylex";
import { useMemo, useState } from "react";
import {
  createColumnHelper,
  tableFeatures,
  useTable,
  type Row as TanStackRow,
} from "@tanstack/react-table";
import { graphql, useFragment, usePaginationFragment } from "react-relay";
import type {
  AttributionLedger_connection$data,
  AttributionLedger_connection$key,
} from "$generated/AttributionLedger_connection.graphql";
import type {
  AttributionLedger_row$data,
  AttributionLedger_row$key,
} from "$generated/AttributionLedger_row.graphql";
import { formatProductDateTimeLabel } from "../../product-formatting";
import { Button } from "$ui/primitives/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "$ui/primitives/Table";
import { ATTRIBUTION_LEDGER_PAGE_SIZE, formatCurrencyAmount } from "./revenue-summary-view-data";

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
  scroll: { overflowX: "auto" },
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
  fragment AttributionLedger_row on CommerceAttributionClick {
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
      purchasedAt
      reportedAt
      status
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

type AttributionClickRef =
  AttributionLedger_connection$data["commerceAttributionClicks"]["edges"][number]["node"];

type AttributionColumn = "click" | "identity" | "diagnostics" | "commerce" | "conversions";

const tableModel = tableFeatures({});
const columnHelper = createColumnHelper<typeof tableModel, AttributionClickRef>();
const columns = columnHelper.columns([
  columnHelper.display({
    id: "click",
    header: "Click",
  }),
  columnHelper.display({
    id: "identity",
    header: "Identity",
  }),
  columnHelper.display({
    id: "diagnostics",
    header: "Request diagnostics",
  }),
  columnHelper.display({
    id: "commerce",
    header: "Commerce",
  }),
  columnHelper.display({
    id: "conversions",
    header: "Matched conversions",
  }),
]);

export function AttributionLedger({
  fragmentRef,
}: {
  fragmentRef: AttributionLedger_connection$key;
}) {
  const { data, hasNext, isLoadingNext, loadNext } = usePaginationFragment<
    AttributionLedger_connection$data,
    AttributionLedger_connection$key
  >(attributionLedgerFragment, fragmentRef);
  const clicks = useMemo(
    () => data.commerceAttributionClicks.edges.map(({ node }) => node),
    [data.commerceAttributionClicks.edges],
  );
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
              <AttributionLedgerRow key={row.id} row={row} />
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

type AttributionClick = AttributionLedger_row$data;

function AttributionLedgerRow({
  row,
}: {
  row: TanStackRow<typeof tableModel, AttributionClickRef>;
}) {
  const fragmentRef: AttributionLedger_row$key = row.original;
  const click = useFragment(attributionLedgerRowFragment, fragmentRef);

  return (
    <TableRow style={styles.row}>
      {row.getAllCells().map((cell) => (
        <TableCell key={cell.id} style={styles.cell}>
          <AttributionLedgerCell click={click} column={cell.column.id as AttributionColumn} />
        </TableCell>
      ))}
    </TableRow>
  );
}

function AttributionLedgerCell({
  click,
  column,
}: {
  click: AttributionClick;
  column: AttributionColumn;
}) {
  switch (column) {
    case "click":
      return <AttributionClickDetails click={click} />;
    case "identity":
      return <AttributionIdentity click={click} />;
    case "diagnostics":
      return <AttributionDiagnostics click={click} />;
    case "commerce":
      return <AttributionCommerce click={click} />;
    case "conversions":
      return <AttributionConversionList conversions={click.matchedConversions} />;
    default:
      return assertNever(column);
  }
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
  return (
    <dl {...props(styles.details)}>
      <dt>Merchant</dt>
      <dd>{click.merchantName}</dd>
      <dt>Product</dt>
      <dd>{click.productName ?? "No product"}</dd>
      <dt>Merchant product</dt>
      <dd>{click.merchantProductExternalSku ?? "No SKU"}</dd>
      <dt>Program</dt>
      <dd>{click.affiliateProgramCode ?? "No affiliate program"}</dd>
      <dt>Network</dt>
      <dd>{click.affiliateNetworkName ?? "No affiliate network"}</dd>
    </dl>
  );
}

function assertNever(value: never): never {
  throw new Error(`Unsupported attribution ledger column: ${String(value)}`);
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
        <dd>{click.userEmail ?? "No email"}</dd>
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
        <AttributionConversion
          conversion={conversion}
          key={`${conversion.affiliateNetworkCode}:${conversion.networkConversionRef}`}
        />
      ))}
    </ul>
  );
}

type AttributionConversionData = AttributionClick["matchedConversions"][number];

function AttributionConversion({ conversion }: { conversion: AttributionConversionData }) {
  return (
    <li>
      <dl {...props(styles.details)}>
        <dt>Conversion reference</dt>
        <dd>{conversion.networkConversionRef}</dd>
        <dt>Order</dt>
        <dd>Order: {formatCurrencyAmount(conversion.orderAmount, conversion.currency)}</dd>
        <dt>Commission</dt>
        <dd>
          Commission: {formatCurrencyAmount(conversion.commissionAmount, conversion.currency)}
        </dd>
        <dt>Status</dt>
        <dd>{conversionStatusCopy(conversion.status)}</dd>
        <dt>Attribution</dt>
        <dd>{attributionConfidenceCopy(conversion.attributionConfidence)}</dd>
        <dt>Conversion merchant</dt>
        <dd>{conversion.merchantName ?? "No merchant"}</dd>
        <dt>Conversion product</dt>
        <dd>{conversion.productName ?? "No product"}</dd>
        <dt>Conversion network</dt>
        <dd>{conversion.affiliateNetworkName ?? "No affiliate network"}</dd>
        <dt>Purchased</dt>
        <dd>
          {conversion.purchasedAt ? (
            <time dateTime={conversion.purchasedAt}>
              {formatProductDateTimeLabel(conversion.purchasedAt)}
            </time>
          ) : (
            "Not recorded"
          )}
        </dd>
        <dt>Reported</dt>
        <dd>
          <time dateTime={conversion.reportedAt}>
            {formatProductDateTimeLabel(conversion.reportedAt)}
          </time>
        </dd>
      </dl>
    </li>
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

function conversionStatusCopy(value: string) {
  switch (value.toUpperCase()) {
    case "APPROVED":
      return "Approved";
    case "PAID":
      return "Paid";
    case "PENDING":
      return "Awaiting confirmation";
    case "REVERSED":
      return "Reversed";
    default:
      return "Status unavailable";
  }
}

function attributionConfidenceCopy(value: string) {
  switch (value.toUpperCase()) {
    case "HIGH":
      return "Strong match";
    case "LOW":
      return "Possible match";
    case "UNMATCHED":
      return "Not matched";
    default:
      return "Match unavailable";
  }
}
