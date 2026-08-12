import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import { Button } from "../../primitives/Button";
import { tokens } from "../../theme/tokens.stylex";

const styles = create({
  root: {
    alignItems: "center",
    backgroundColor: tokens.surfaceInteractive,
    borderBlock: `1px solid ${tokens.border}`,
    display: "grid",
    gap: "0.85rem",
    gridTemplateColumns: {
      default: "minmax(0, 1fr) auto",
      "@media (max-width: 40rem)": "minmax(0, 1fr)",
    },
    padding: "0.8rem 1rem",
  },
  content: {
    display: "grid",
    gap: "0.35rem",
    minWidth: 0,
  },
  title: {
    color: tokens.textSecondary,
    fontFamily: tokens.fontMono,
    fontSize: "0.72rem",
    fontWeight: 500,
    letterSpacing: "0.04em",
    margin: 0,
    textTransform: "uppercase",
  },
  selections: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.4rem",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  selection: {
    backgroundColor: tokens.surfaceRaised,
    border: `1px solid ${tokens.border}`,
    color: tokens.text,
    fontSize: "0.88rem",
    padding: "0.28rem 0.45rem",
    transition: "background-color 160ms ease, border-color 160ms ease",
  },
  action: {
    width: {
      default: "auto",
      "@media (max-width: 40rem)": "100%",
    },
  },
});

export type ComparisonContinuityProduct = {
  label: string;
  slug: string;
};

export function ComparisonContinuity({
  destination,
  products,
}: {
  destination: string;
  products: readonly ComparisonContinuityProduct[];
}) {
  if (products.length === 0) return null;

  return (
    <section aria-label="Comparison selection" {...props(styles.root)}>
      <div {...props(styles.content)}>
        <p {...props(styles.title)}>Comparison selection</p>
        <ol {...props(styles.selections)}>
          {products.map((product, index) => (
            <li key={product.slug} {...props(styles.selection)}>
              {index + 1}. {product.label}
            </li>
          ))}
        </ol>
      </div>
      <Button render={<Link to={destination} />} style={styles.action}>
        Open comparison
      </Button>
    </section>
  );
}
