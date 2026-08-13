import { create, props } from "@stylexjs/stylex";
import { Fragment, useState } from "react";
import { graphql, useFragment, usePaginationFragment } from "react-relay";
import type {
  AttributionLedger_connection$data,
  AttributionLedger_connection$key,
} from "$generated/AttributionLedger_connection.graphql";
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
type AttributionClick = AttributionLedger_row$data;

const columns = [
  {
    header: "Click",
    render: (click: AttributionClick) => <AttributionClickDetails click={click} />,
  },
  {
    header: "Identity",
    render: (click: AttributionClick) => <AttributionIdentity click={click} />,
  },
  {
    header: "Request diagnostics",
    render: (click: AttributionClick) => <AttributionDiagnostics click={click} />,
  },
  {
    header: "Commerce",
    render: (click: AttributionClick) => <AttributionCommerce click={click} />,
  },
  {
    header: "Matched conversions",
    render: (click: AttributionClick) => (
      <AttributionConversionList conversions={click.matchedConversions} />
    ),
  },
];

export function AttributionLedger({
  fragmentRef,
}: {
  fragmentRef: AttributionLedger_connection$key;
}) {
  const { data, hasNext, isLoadingNext, loadNext } = usePaginationFragment<
    AttributionLedgerPaginationQuery,
    AttributionLedger_connection$key
  >(attributionLedgerFragment, fragmentRef);
  const clicks = data.commerceAttributionClicks.edges.map(({ node }) => node);
  const [paginationFailed, setPaginationFailed] = useState(false);
  const loadMore = () => {
    setPaginationFailed(false);
    loadNext(ATTRIBUTION_LEDGER_PAGE_SIZE, {
      onComplete: (error) => setPaginationFailed(error !== null),
    });
  };
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
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.header} scope="col">
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {clicks.map((fragmentRef) => (
              <AttributionLedgerRow fragmentRef={fragmentRef} key={fragmentRef.clickId} />
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

function AttributionLedgerRow({
  fragmentRef,
}: {
  fragmentRef: AttributionClickRef;
}) {
  const rowFragmentRef: AttributionLedger_row$key = fragmentRef;
  const click = useFragment(attributionLedgerRowFragment, rowFragmentRef);

  return (
    <TableRow style={styles.row}>
      {columns.map((column) => (
        <TableCell key={column.header} style={styles.cell}>
          {column.render(click)}
        </TableCell>
      ))}
    </TableRow>
  );
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
