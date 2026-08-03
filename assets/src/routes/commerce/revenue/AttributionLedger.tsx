import { create, props } from "@stylexjs/stylex";
import { graphql, usePaginationFragment } from "react-relay";
import type {
  AttributionLedger_connection$data,
  AttributionLedger_connection$key,
} from "../../../__generated__/AttributionLedger_connection.graphql";
import { formatProductDateTimeLabel } from "../../product-formatting";
import { Button } from "../../../ui/primitives/Button";
import { ATTRIBUTION_LEDGER_PAGE_SIZE, formatCurrencyAmount } from "./revenue-summary-view-data";

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
          affiliateNetworkCode
          affiliateNetworkId
          affiliateNetworkName
          affiliateProgramCode
          affiliateProgramId
          anonymousId
          clickId
          insertedAt
          ipAddress
          linkType
          matchedConversions {
            attributionConfidence
            commissionAmount
            currency
            networkConversionRef
            orderAmount
            purchasedAt
            reportedAt
            status
          }
          merchantId
          merchantName
          merchantProductExternalSku
          merchantProductId
          productId
          productName
          referrer
          sourceSurface
          userAgent
          userEmail
          userId
        }
      }
    }
  }
`;

export function AttributionLedger({
  fragmentRef,
}: {
  fragmentRef: AttributionLedger_connection$key;
}) {
  const { data, hasNext, isLoadingNext, loadNext } = usePaginationFragment<
    AttributionLedger_connection$data,
    AttributionLedger_connection$key
  >(attributionLedgerFragment, fragmentRef);
  const clicks = data.commerceAttributionClicks.edges.map(({ node }) => node);

  return (
    <section aria-labelledby="attribution-ledger-heading" {...props(styles.wrapper)}>
      <div>
        <h2 id="attribution-ledger-heading" {...props(styles.title)}>
          Attribution ledger
        </h2>
        <p>Individual click and conversion evidence for the active revenue filters.</p>
      </div>
      {clicks.length === 0 ? (
        <p>No attribution clicks match these filters.</p>
      ) : (
        <div {...props(styles.scroll)}>
          <table {...props(styles.table)}>
            <thead>
              <tr>
                <th scope="col">Click</th>
                <th scope="col">Identity</th>
                <th scope="col">Request diagnostics</th>
                <th scope="col">Commerce</th>
                <th scope="col">Matched conversions</th>
              </tr>
            </thead>
            <tbody>
              {clicks.map((click) => (
                <AttributionLedgerRow click={click} key={click.clickId} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      {hasNext ? (
        <Button
          disabled={isLoadingNext}
          onClick={() => loadNext(ATTRIBUTION_LEDGER_PAGE_SIZE)}
          type="button"
        >
          {isLoadingNext ? "Loading more attribution clicks…" : "Load more attribution clicks"}
        </Button>
      ) : null}
    </section>
  );
}

type AttributionClick =
  AttributionLedger_connection$data["commerceAttributionClicks"]["edges"][number]["node"];

function AttributionLedgerRow({ click }: { click: AttributionClick }) {
  return (
    <tr {...props(styles.row)}>
      <td {...props(styles.cell)}>
        <dl {...props(styles.details)}>
          <dt>Click ID</dt>
          <dd>
            <code>{click.clickId}</code>
          </dd>
          <dt>Created</dt>
          <dd>
            <time dateTime={click.insertedAt}>{formatProductDateTimeLabel(click.insertedAt)}</time>
          </dd>
          <dt>Source</dt>
          <dd>{formatLedgerEnum(click.sourceSurface)}</dd>
          <dt>Link type</dt>
          <dd>{formatLedgerEnum(click.linkType)}</dd>
        </dl>
      </td>
      <td {...props(styles.cell)}>
        <AttributionIdentity click={click} />
      </td>
      <td {...props(styles.cell)}>
        <dl {...props(styles.details)}>
          <dt>Referrer</dt>
          <dd>{click.referrer ?? "Not captured"}</dd>
          <dt>User agent</dt>
          <dd>{click.userAgent ?? "Not captured"}</dd>
          <dt>IP address</dt>
          <dd>{click.ipAddress ?? "Not captured"}</dd>
        </dl>
      </td>
      <td {...props(styles.cell)}>
        <dl {...props(styles.details)}>
          <dt>Merchant</dt>
          <dd>
            {click.merchantName} ({click.merchantId})
          </dd>
          <dt>Product</dt>
          <dd>
            {click.productName ?? "No product"}
            {click.productId ? ` (${click.productId})` : ""}
          </dd>
          <dt>Merchant product</dt>
          <dd>
            {click.merchantProductExternalSku ?? "No SKU"}
            {click.merchantProductId ? ` (${click.merchantProductId})` : ""}
          </dd>
          <dt>Program</dt>
          <dd>
            {click.affiliateProgramCode ?? "No affiliate program"}
            {click.affiliateProgramId ? ` (${click.affiliateProgramId})` : ""}
          </dd>
          <dt>Network</dt>
          <dd>
            {click.affiliateNetworkName ?? "No affiliate network"}
            {click.affiliateNetworkCode ? ` (${click.affiliateNetworkCode})` : ""}
            {click.affiliateNetworkId ? ` [${click.affiliateNetworkId}]` : ""}
          </dd>
        </dl>
      </td>
      <td {...props(styles.cell)}>
        <AttributionConversionList conversions={click.matchedConversions} />
      </td>
    </tr>
  );
}

function AttributionIdentity({ click }: { click: AttributionClick }) {
  if (click.userId) {
    return (
      <dl {...props(styles.details)}>
        <dt>User</dt>
        <dd>{click.userEmail ?? "No email"}</dd>
        <dt>User ID</dt>
        <dd>User ID: {click.userId}</dd>
      </dl>
    );
  }

  return <p>Anonymous click: {click.anonymousId ?? "No anonymous ID"}</p>;
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
        <li key={conversion.networkConversionRef}>
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
            <dd>Status: {formatLedgerEnum(conversion.status)}</dd>
            <dt>Attribution</dt>
            <dd>Attribution: {formatLedgerEnum(conversion.attributionConfidence)}</dd>
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
      ))}
    </ul>
  );
}

function formatLedgerEnum(value: string) {
  return value.toLowerCase().replaceAll("_", " ");
}
