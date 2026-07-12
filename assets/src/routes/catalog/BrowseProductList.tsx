import type { ReactElement } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import type { BrowseProductsRouteQuery } from "../../__generated__/BrowseProductsRouteQuery.graphql";
import { DataList, DataListItem } from "../../ui/components/data/DataList";
import { tokens } from "../../ui/theme/tokens.stylex";

export type BrowseProductNode =
  BrowseProductsRouteQuery["response"]["products"]["edges"][number]["node"];

export type BrowseCompareAction =
  | { kind: "selected" }
  | { kind: "full" }
  | { href: string; kind: "add" };

const SPECIFICATION_HIGHLIGHT_LIMIT = 3;

const styles = create({
  actionList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.6rem 1rem",
    listStyle: "none",
    margin: 0,
    padding: 0
  },
  highlights: {
    display: "grid",
    gap: "0.45rem"
  },
  highlightsList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.45rem 1.25rem",
    listStyle: "none",
    margin: 0,
    padding: 0
  },
  highlightsTitle: {
    color: tokens.textSecondary,
    fontSize: "0.8rem",
    letterSpacing: "0.06em",
    margin: 0,
    textTransform: "uppercase"
  },
  metadata: {
    color: tokens.textSecondary,
    display: "flex",
    flexWrap: "wrap",
    gap: "0.45rem 1rem"
  },
  metadataItem: {
    margin: 0
  },
  product: {
    display: "grid",
    gap: "0.8rem"
  },
  productHeading: {
    fontSize: "1.35rem",
    letterSpacing: "-0.02em",
    margin: 0
  }
});

export function BrowseProductList({
  compareActionFor,
  detailHrefFor,
  offerHrefFor,
  products
}: {
  compareActionFor: (product: BrowseProductNode) => BrowseCompareAction;
  detailHrefFor: (product: BrowseProductNode) => string;
  offerHrefFor: (product: BrowseProductNode) => string;
  products: readonly BrowseProductNode[];
}): ReactElement {
  return (
    <DataList label="Products">
      {products.map((product) => (
        <DataListItem key={product.id}>
          <article aria-label={product.name} {...props(styles.product)}>
            <h2 {...props(styles.productHeading)}>{product.name}</h2>
            <div {...props(styles.metadata)}>
              <p {...props(styles.metadataItem)}>{product.brand.name}</p>
              <p {...props(styles.metadataItem)}>{product.slug}</p>
            </div>
            <SpecificationHighlights attributes={product.currentAttributes} />
            <ul
              aria-label={`Decision actions for ${product.name}`}
              {...props(styles.actionList)}
            >
              <li>
                <Link to={detailHrefFor(product)}>View details for {product.name}</Link>
              </li>
              <BrowseCompareActionItem action={compareActionFor(product)} product={product} />
              <li>
                <Link to={offerHrefFor(product)}>View offers for {product.name}</Link>
              </li>
            </ul>
          </article>
        </DataListItem>
      ))}
    </DataList>
  );
}

function SpecificationHighlights({
  attributes
}: {
  attributes: BrowseProductNode["currentAttributes"];
}) {
  const highlights = [...attributes]
    .sort(
      (left, right) =>
        (left.sortOrder ?? Number.MAX_SAFE_INTEGER) -
        (right.sortOrder ?? Number.MAX_SAFE_INTEGER)
    )
    .slice(0, SPECIFICATION_HIGHLIGHT_LIMIT);

  if (highlights.length === 0) {
    return null;
  }

  return (
    <section {...props(styles.highlights)}>
      <h3 {...props(styles.highlightsTitle)}>Specification highlights</h3>
      <ul aria-label="Specification highlights" {...props(styles.highlightsList)}>
        {highlights.map((attribute) => (
          <li key={attribute.code}>
            {attribute.displayName}: {attribute.valueText}
          </li>
        ))}
      </ul>
    </section>
  );
}

function BrowseCompareActionItem({
  action,
  product
}: {
  action: BrowseCompareAction;
  product: BrowseProductNode;
}) {
  switch (action.kind) {
    case "selected":
      return <li>{product.name} selected for comparison</li>;
    case "full":
      return <li>Compare selection full</li>;
    case "add":
      return (
        <li>
          <Link to={action.href}>Add {product.name} to compare</Link>
        </li>
      );
  }
}
