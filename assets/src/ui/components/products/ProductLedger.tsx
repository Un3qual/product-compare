import type { ReactNode } from "react";
import { create, props } from "@stylexjs/stylex";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "../../primitives/Collapsible";
import { tokens } from "../../theme/tokens.stylex";

const styles = create({
  list: {
    borderBlockStart: `1px solid ${tokens.borderQuiet}`,
    listStyle: "none",
    margin: 0,
    padding: 0
  },
  row: {
    borderBlockEnd: `1px solid ${tokens.borderQuiet}`,
    paddingBlock: "1.15rem"
  },
  article: {
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: {
      default: "minmax(13rem, 1.35fr) minmax(10rem, 1fr) minmax(10rem, 1fr) minmax(9rem, 0.8fr) minmax(8rem, 0.7fr) auto",
      "@media (max-width: 62rem)": "minmax(13rem, 1.3fr) minmax(10rem, 1fr) minmax(9rem, 0.8fr) auto",
      "@media (max-width: 42rem)": "minmax(0, 1fr)"
    }
  },
  identity: {
    display: "grid",
    gap: "0.25rem",
    minWidth: 0
  },
  category: {
    color: tokens.textSecondary,
    fontFamily: tokens.fontMono,
    fontSize: "0.72rem",
    letterSpacing: "0.04em",
    margin: 0,
    textTransform: "uppercase"
  },
  title: {
    fontSize: "1.05rem",
    letterSpacing: "-0.015em",
    lineHeight: 1.2,
    margin: 0
  },
  fact: {
    color: tokens.textSecondary,
    display: "grid",
    fontSize: "0.88rem",
    gap: "0.25rem",
    lineHeight: 1.45,
    minWidth: 0
  },
  factLabel: {
    color: tokens.textSecondary,
    fontFamily: tokens.fontMono,
    fontSize: "0.7rem",
    letterSpacing: "0.04em",
    textTransform: "uppercase"
  },
  priceSignal: {
    color: tokens.textSecondary,
    fontWeight: 700
  },
  freshness: {
    backgroundColor: tokens.freshnessSoft,
    color: tokens.freshnessGreen,
    fontFamily: tokens.fontMono,
    fontSize: "0.75rem",
    lineHeight: 1.45
  },
  actions: {
    alignItems: {
      default: "end",
      "@media (max-width: 42rem)": "start"
    },
    display: "flex",
    flexDirection: {
      default: "column",
      "@media (max-width: 42rem)": "row"
    },
    flexWrap: "wrap",
    gap: "0.5rem"
  },
  disclosure: {
    gridColumn: {
      default: "1 / -1",
      "@media (min-width: 62.0625rem)": "2 / 4"
    }
  },
  disclosureTrigger: {
    backgroundColor: "transparent",
    border: 0,
    color: tokens.actionAccent,
    cursor: "pointer",
    font: "inherit",
    fontSize: "0.88rem",
    fontWeight: 700,
    minHeight: tokens.controlHeight,
    padding: 0,
    textAlign: "start"
  },
  disclosureContent: {
    color: tokens.textSecondary,
    fontSize: "0.88rem",
    lineHeight: 1.5,
    paddingBlockStart: "0.45rem"
  }
});

export type ProductLedgerRow = {
  actions: ReactNode;
  category: string;
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
  secondaryDisclosureLabel
}: {
  label?: string;
  rows: readonly ProductLedgerRow[];
  secondaryDisclosureLabel: string;
}) {
  return (
    <ol aria-label={label} {...props(styles.list)}>
      {rows.map((row) => (
        <li key={row.id} {...props(styles.row)}>
          <article aria-labelledby={`product-ledger-${row.id}`} {...props(styles.article)}>
            <div {...props(styles.identity)}>
              <p data-tone="secondary" {...props(styles.category)}>
                {row.category}
              </p>
              <h3 id={`product-ledger-${row.id}`} {...props(styles.title)}>
                {row.title}
              </h3>
            </div>
            <LedgerFact label="Highlights">{row.highlights}</LedgerFact>
            <LedgerFact label="Best offer">{row.offer}</LedgerFact>
            <div {...props(styles.fact)}>
              <span data-tone="secondary" {...props(styles.factLabel)}>
                Price signal
              </span>
              <span {...props(styles.priceSignal)}>{row.priceSignal}</span>
            </div>
            <span data-slot="product-ledger-freshness" data-tone="freshness" {...props(styles.freshness)}>
              {row.freshness}
            </span>
            <div {...props(styles.actions)}>{row.actions}</div>
            {row.secondaryDetails ? (
              <Collapsible {...props(styles.disclosure)}>
                <CollapsibleTrigger {...props(styles.disclosureTrigger)}>
                  {secondaryDisclosureLabel}
                </CollapsibleTrigger>
                <CollapsibleContent {...props(styles.disclosureContent)}>
                  {row.secondaryDetails}
                </CollapsibleContent>
              </Collapsible>
            ) : null}
          </article>
        </li>
      ))}
    </ol>
  );
}

function LedgerFact({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div {...props(styles.fact)}>
      <span data-tone="secondary" {...props(styles.factLabel)}>
        {label}
      </span>
      <span>{children}</span>
    </div>
  );
}
