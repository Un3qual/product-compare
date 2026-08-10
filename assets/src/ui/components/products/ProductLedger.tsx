import type { ReactNode } from "react";
import { create, props, type StyleXStyles } from "@stylexjs/stylex";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../primitives/Collapsible";
import { Button } from "../../primitives/Button";
import { tokens } from "../../theme/tokens.stylex";

const styles = create({
  list: {
    borderBlockStart: `1px solid ${tokens.borderQuiet}`,
    listStyle: "none",
    margin: 0,
    maxWidth: "100%",
    minWidth: 0,
    padding: 0,
  },
  row: {
    borderBlockEnd: `1px solid ${tokens.borderQuiet}`,
    paddingBlock: "1.15rem",
  },
  article: {
    display: "grid",
    gap: "1rem",
    gridTemplate: {
      default:
        '"identity highlights offer signal freshness actions" / minmax(13rem, 1.35fr) minmax(10rem, 1fr) minmax(10rem, 1fr) minmax(9rem, 0.8fr) minmax(8rem, 0.7fr) 10rem',
      "@media (max-width: 62rem)":
        '"identity highlights" "offer signal" "freshness actions" / minmax(0, 1fr) minmax(0, 1fr)',
      "@media (max-width: 42rem)": '"identity" "offer" "actions" "disclosure" / minmax(0, 1fr)',
    },
    maxWidth: "100%",
    minWidth: 0,
  },
  identity: {
    display: "grid",
    gap: "0.25rem",
    gridArea: "identity",
    minWidth: 0,
  },
  category: {
    color: tokens.textSecondary,
    fontFamily: tokens.fontMono,
    fontSize: "0.72rem",
    letterSpacing: "0.04em",
    margin: 0,
    textTransform: "uppercase",
  },
  title: {
    fontSize: "1.05rem",
    letterSpacing: "-0.015em",
    lineHeight: 1.2,
    margin: 0,
  },
  fact: {
    color: tokens.textSecondary,
    display: "grid",
    fontSize: "0.88rem",
    gap: "0.25rem",
    lineHeight: 1.45,
    minWidth: 0,
  },
  highlights: {
    display: {
      default: "grid",
      "@media (max-width: 42rem)": "none",
    },
    gridArea: "highlights",
  },
  offer: {
    gridArea: "offer",
  },
  factLabel: {
    color: tokens.textSecondary,
    fontFamily: tokens.fontMono,
    fontSize: "0.7rem",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  priceSignal: {
    color: tokens.textSecondary,
    fontWeight: 700,
  },
  signal: {
    display: {
      default: "grid",
      "@media (max-width: 42rem)": "none",
    },
    gridArea: "signal",
  },
  freshness: {
    backgroundColor: tokens.freshnessSoft,
    color: tokens.freshnessGreen,
    display: {
      default: "inline",
      "@media (max-width: 42rem)": "none",
    },
    fontFamily: tokens.fontMono,
    fontSize: "0.75rem",
    gridArea: "freshness",
    lineHeight: 1.45,
  },
  actions: {
    alignItems: {
      default: "end",
      "@media (max-width: 62rem)": "start",
    },
    display: "flex",
    flexDirection: {
      default: "column",
      "@media (max-width: 62rem)": "row",
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
  secondaryDisclosureLabel,
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
            <div data-slot="product-ledger-identity" {...props(styles.identity)}>
              <p data-tone="secondary" {...props(styles.category)}>
                {row.category}
              </p>
              <h3 id={`product-ledger-${row.id}`} {...props(styles.title)}>
                {row.title}
              </h3>
            </div>
            <LedgerFact
              label="Highlights"
              slot="product-ledger-highlights"
              style={styles.highlights}
            >
              {row.highlights}
            </LedgerFact>
            <LedgerFact label="Best offer" slot="product-ledger-offer" style={styles.offer}>
              {row.offer}
            </LedgerFact>
            <div data-slot="product-ledger-price-signal" {...props(styles.fact, styles.signal)}>
              <span data-tone="secondary" {...props(styles.factLabel)}>
                Price signal
              </span>
              <span {...props(styles.priceSignal)}>{row.priceSignal}</span>
            </div>
            <span
              data-slot="product-ledger-freshness"
              data-tone="freshness"
              {...props(styles.freshness)}
            >
              {row.freshness}
            </span>
            <div data-slot="product-ledger-actions" {...props(styles.actions)}>
              {row.actions}
            </div>
            {row.secondaryDetails ? (
              <Collapsible {...props(styles.disclosure)}>
                <CollapsibleTrigger asChild>
                  <Button
                    size="1"
                    type="button"
                    variant="soft"
                    {...props(styles.disclosureTrigger)}
                  >
                    {secondaryDisclosureLabel}
                  </Button>
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

function LedgerFact({
  children,
  label,
  slot,
  style,
}: {
  children: ReactNode;
  label: string;
  slot: string;
  style: StyleXStyles;
}) {
  return (
    <div data-slot={slot} {...props(styles.fact, style)}>
      <span data-tone="secondary" {...props(styles.factLabel)}>
        {label}
      </span>
      <span>{children}</span>
    </div>
  );
}
