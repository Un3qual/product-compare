import { create, props } from "@stylexjs/stylex";
import type { ProductDetailRouteQuery } from "$generated/ProductDetailRouteQuery.graphql";
import { RelativeDateTime } from "$ui/components/data";
import { tokens } from "$ui/theme/tokens.stylex";

type Product = NonNullable<ProductDetailRouteQuery["response"]["product"]>;

const styles = create({
  root: { display: "grid", gap: "1rem" },
  identity: {
    color: tokens.textSecondary,
    display: "flex",
    flexWrap: "wrap",
    fontSize: "1rem",
    gap: "0.35rem 0.6rem",
    margin: 0,
  },
  description: { lineHeight: 1.55, margin: 0, maxWidth: "46rem" },
  facts: {
    borderBlockColor: tokens.borderQuiet,
    borderBlockStyle: "solid",
    borderBlockWidth: "1px",
    display: "grid",
    gridTemplateColumns: {
      default: "repeat(3, minmax(0, 1fr))",
      "@media (max-width: 42rem)": "minmax(0, 1fr)",
    },
  },
  fact: {
    display: "grid",
    gap: "0.25rem",
    paddingBlock: "0.8rem",
    paddingInline: {
      default: "1rem",
      "@media (max-width: 42rem)": 0,
    },
  },
  borderedFact: {
    borderInlineStartColor: {
      default: tokens.borderQuiet,
      "@media (max-width: 42rem)": "transparent",
    },
    borderInlineStartStyle: "solid",
    borderInlineStartWidth: "1px",
    borderBlockStartColor: {
      default: "transparent",
      "@media (max-width: 42rem)": tokens.borderQuiet,
    },
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "1px",
  },
  factLabel: {
    color: tokens.textSecondary,
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  factValue: { color: tokens.text, fontSize: "1rem", fontWeight: 700 },
  keySpecs: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.4rem 1.25rem",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  keySpec: { display: "flex", fontSize: "0.88rem", gap: "0.35rem" },
  keySpecLabel: { color: tokens.textSecondary },
  keySpecValue: { color: tokens.text, fontWeight: 700 },
});

export function ProductDecisionHeader({ product }: { product: Product }) {
  const keySpecifications = [...product.currentAttributes]
    .filter((attribute) => attribute.valueText.trim() !== "")
    .sort(
      (left, right) =>
        Number(right.isRequired) - Number(left.isRequired) ||
        (left.sortOrder ?? Number.MAX_SAFE_INTEGER) -
          (right.sortOrder ?? Number.MAX_SAFE_INTEGER) ||
        left.displayName.localeCompare(right.displayName),
    )
    .slice(0, 4);
  const price = currentPrice(product.offerTruth.currencySummaries);
  const freshestOffer = currentOffer(product.offerTruth.currencySummaries);

  return (
    <div {...props(styles.root)}>
      <p {...props(styles.identity)}>
        <span>{product.brand?.name ?? "Unknown brand"}</span>
        {product.modelNumber ? <span>Model {product.modelNumber}</span> : null}
      </p>
      {product.description ? <p {...props(styles.description)}>{product.description}</p> : null}
      <section aria-label="Product decision summary" {...props(styles.facts)}>
        <div {...props(styles.fact)}>
          <span {...props(styles.factLabel)}>Best current price</span>
          <strong {...props(styles.factValue)}>{price}</strong>
        </div>
        <div {...props(styles.fact, styles.borderedFact)}>
          <span {...props(styles.factLabel)}>Active offers</span>
          <strong {...props(styles.factValue)}>{product.offerTruth.offerCount}</strong>
        </div>
        <div {...props(styles.fact, styles.borderedFact)}>
          <span {...props(styles.factLabel)}>Price freshness</span>
          <strong {...props(styles.factValue)}>
            {freshestOffer?.observedAt ? (
              <RelativeDateTime
                prefix="Observed"
                referenceTime={String(product.offerTruth.asOf)}
                value={freshestOffer.observedAt}
              />
            ) : (
              "Unavailable"
            )}
          </strong>
        </div>
      </section>
      {keySpecifications.length > 0 ? (
        <ul aria-label="Key specifications" {...props(styles.keySpecs)}>
          {keySpecifications.map((attribute) => (
            <li key={attribute.attributeId ?? attribute.code} {...props(styles.keySpec)}>
              <span {...props(styles.keySpecLabel)}>{attribute.displayName}</span>
              <span aria-hidden>·</span>
              <strong {...props(styles.keySpecValue)}>{attribute.valueText}</strong>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function currentPrice(currencySummaries: Product["offerTruth"]["currencySummaries"]) {
  if (currencySummaries.length === 0) return "No current price";
  if (currencySummaries.length > 1) return `Prices in ${currencySummaries.length} currencies`;

  const [summary] = currencySummaries;
  const price = summary.bestOffer?.landedPrice ?? null;
  return price === null ? "No comparable price" : `${price} ${summary.currency}`;
}

function currentOffer(currencySummaries: Product["offerTruth"]["currencySummaries"]) {
  if (currencySummaries.length !== 1) return null;
  return currencySummaries[0].bestOffer ?? null;
}
