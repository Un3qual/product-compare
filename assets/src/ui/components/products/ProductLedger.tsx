import type { ReactNode } from "react";
import { create, props } from "@stylexjs/stylex";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../primitives/Collapsible";
import { Button } from "../../primitives/Button";
import { StatusBadge } from "../status/StatusBadge";
import { tokens } from "../../theme/tokens.stylex";

const styles = create({
  list: {
    borderBlockStartColor: tokens.borderQuiet,
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "1px",
    listStyle: "none",
    margin: 0,
    maxWidth: "100%",
    minWidth: 0,
    padding: 0,
  },
  row: {
    borderBlockEndColor: tokens.borderQuiet,
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
    paddingBlock: "1.15rem",
  },
  article: {
    alignItems: "start",
    display: "grid",
    gap: {
      default: "1.5rem",
      "@media (max-width: 62rem)": "1rem 1.5rem",
      "@media (max-width: 42rem)": "1rem",
    },
    gridTemplate: {
      default:
        '"summary market actions" / minmax(19rem, 1.45fr) minmax(17rem, 1fr) minmax(10rem, auto)',
      "@media (max-width: 62rem)":
        '"summary actions" "market actions" / minmax(0, 1fr) minmax(10rem, auto)',
      "@media (max-width: 42rem)": '"summary" "market" "actions" "disclosure" / minmax(0, 1fr)',
    },
    maxWidth: "100%",
    minWidth: 0,
  },
  summary: {
    display: "grid",
    gap: "0.45rem",
    gridArea: "summary",
    minWidth: 0,
  },
  title: {
    fontSize: "1.12rem",
    letterSpacing: "-0.02em",
    lineHeight: 1.2,
    margin: 0,
  },
  highlights: {
    color: tokens.textSecondary,
    fontSize: "0.88rem",
    lineHeight: 1.45,
    margin: 0,
    maxWidth: "48rem",
    minWidth: 0,
  },
  market: {
    alignContent: "start",
    display: "grid",
    gap: "0.35rem",
    gridArea: "market",
    minWidth: 0,
  },
  marketLabel: {
    color: tokens.textSecondary,
    fontFamily: tokens.fontMono,
    fontSize: "0.7rem",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  offer: {
    color: tokens.text,
    fontSize: "0.96rem",
    fontWeight: 700,
    lineHeight: 1.35,
  },
  marketSupporting: {
    alignItems: "center",
    display: {
      default: "flex",
      "@media (max-width: 42rem)": "none",
    },
    flexWrap: "wrap",
    gap: "0.4rem 0.65rem",
  },
  priceSignal: {
    color: tokens.textSecondary,
    fontSize: "0.82rem",
    fontWeight: 600,
    lineHeight: 1.4,
  },
  freshness: {
    fontFamily: tokens.fontMono,
    fontSize: "0.75rem",
    lineHeight: 1.45,
  },
  actions: {
    alignItems: {
      default: "end",
      "@media (max-width: 42rem)": "start",
    },
    display: "flex",
    flexDirection: {
      default: "column",
      "@media (max-width: 42rem)": "row",
    },
    flexWrap: "wrap",
    gap: "0.5rem",
    gridArea: "actions",
  },
  disclosure: {
    display: {
      default: "none",
      "@media (max-width: 42rem)": "block",
    },
    gridArea: "disclosure",
  },
  disclosureTrigger: {
    justifyContent: "start",
    textAlign: "start",
  },
  disclosureContent: {
    color: tokens.textSecondary,
    fontSize: "0.88rem",
    lineHeight: 1.5,
    paddingBlockStart: "0.45rem",
  },
});

export type ProductLedgerRow = {
  actions: ReactNode;
  freshness: ReactNode;
  highlights: ReactNode;
  id: string;
  offer: ReactNode;
  priceSignal: ReactNode;
  secondaryDetails?: ReactNode;
  title: string;
};

export function ProductLedger({
  label = "Products",
  rows,
  secondaryDisclosureLabel,
}: {
  label?: string;
  rows: readonly ProductLedgerRow[];
  secondaryDisclosureLabel: string;
}) {
  return (
    <ol aria-label={label} {...props(styles.list)}>
      {rows.map((row) => (
        <ProductLedgerItem
          key={row.id}
          row={row}
          secondaryDisclosureLabel={secondaryDisclosureLabel}
        />
      ))}
    </ol>
  );
}

function ProductLedgerItem({
  row,
  secondaryDisclosureLabel,
}: {
  row: ProductLedgerRow;
  secondaryDisclosureLabel: string;
}) {
  return (
    <li {...props(styles.row)}>
      <article aria-labelledby={`product-ledger-${row.id}`} {...props(styles.article)}>
        <div data-slot="product-ledger-summary" {...props(styles.summary)}>
          <h3 id={`product-ledger-${row.id}`} {...props(styles.title)}>
            {row.title}
          </h3>
          <p data-slot="product-ledger-highlights" {...props(styles.highlights)}>
            {row.highlights}
          </p>
        </div>
        <div data-slot="product-ledger-market" {...props(styles.market)}>
          <span data-tone="secondary" {...props(styles.marketLabel)}>
            Best available
          </span>
          <span data-slot="product-ledger-offer" {...props(styles.offer)}>
            {row.offer}
          </span>
          <div {...props(styles.marketSupporting)}>
            <span data-slot="product-ledger-price-signal" {...props(styles.priceSignal)}>
              {row.priceSignal}
            </span>
            <StatusBadge
              data-slot="product-ledger-freshness"
              style={styles.freshness}
              tone="positive"
            >
              {row.freshness}
            </StatusBadge>
          </div>
        </div>
        <div data-slot="product-ledger-actions" {...props(styles.actions)}>
          {row.actions}
        </div>
        {row.secondaryDetails ? (
          <Collapsible style={styles.disclosure}>
            <CollapsibleTrigger
              render={
                <Button
                  size="sm"
                  type="button"
                  variant="secondary"
                  style={styles.disclosureTrigger}
                />
              }
            >
              {secondaryDisclosureLabel}
            </CollapsibleTrigger>
            <CollapsibleContent style={styles.disclosureContent}>
              {row.secondaryDetails}
            </CollapsibleContent>
          </Collapsible>
        ) : null}
      </article>
    </li>
  );
}
