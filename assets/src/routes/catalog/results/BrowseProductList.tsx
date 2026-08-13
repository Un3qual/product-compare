import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import { graphql, useFragment } from "react-relay";
import type {
  BrowseProductList_item$data,
  BrowseProductList_item$key,
} from "$generated/BrowseProductList_item.graphql";
import type {
  BrowseProductList_products$data,
  BrowseProductList_products$key,
} from "$generated/BrowseProductList_products.graphql";
import { DataList, DataListItem } from "$ui/components/data/DataList";
import { tokens } from "$ui/theme/tokens.stylex";
import { selectBrowseProductSpecificationHighlights } from "./browse-product-list-data";

const browseProductListFragment = graphql`
  fragment BrowseProductList_products on ProductConnection {
    edges {
      node {
        id
        name
        slug
        ...BrowseProductList_item
      }
    }
  }
`;

const browseProductListItemFragment = graphql`
  fragment BrowseProductList_item on Product {
    id
    name
    slug
    brand {
      id
      name
    }
    currentAttributes {
      code
      displayName
      valueText
      sortOrder
    }
  }
`;

export type BrowseProductNode = Pick<
  BrowseProductList_products$data["edges"][number]["node"],
  "id" | "name" | "slug"
>;

export type BrowseCompareAction =
  | { kind: "selected" }
  | { kind: "full" }
  | { href: string; kind: "add" };

const styles = create({
  actionList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.6rem 1rem",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  highlights: {
    display: "grid",
    gap: "0.45rem",
  },
  highlightsList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.45rem 1.25rem",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  highlightsTitle: {
    color: tokens.textSecondary,
    fontSize: "0.8rem",
    letterSpacing: "0.06em",
    margin: 0,
    textTransform: "uppercase",
  },
  metadata: {
    color: tokens.textSecondary,
    display: "flex",
    flexWrap: "wrap",
    gap: "0.45rem 1rem",
  },
  metadataItem: {
    margin: 0,
  },
  product: {
    display: "grid",
    gap: "0.8rem",
  },
  productHeading: {
    fontSize: "1.35rem",
    letterSpacing: "-0.02em",
    margin: 0,
  },
});

export function BrowseProductList({
  compareActionFor,
  detailHrefFor,
  offerHrefFor,
  products,
}: {
  compareActionFor: (product: BrowseProductNode) => BrowseCompareAction;
  detailHrefFor: (product: BrowseProductNode) => string;
  offerHrefFor: (product: BrowseProductNode) => string;
  products: BrowseProductList_products$key;
}) {
  const data = useFragment(browseProductListFragment, products);

  return (
    <DataList label="Products">
      {data.edges.map(({ node: product }) => (
        <BrowseProductListItem
          compareAction={compareActionFor(product)}
          detailHref={detailHrefFor(product)}
          key={product.id}
          offerHref={offerHrefFor(product)}
          product={product}
        />
      ))}
    </DataList>
  );
}

function BrowseProductListItem({
  compareAction,
  detailHref,
  offerHref,
  product,
}: {
  compareAction: BrowseCompareAction;
  detailHref: string;
  offerHref: string;
  product: BrowseProductList_item$key;
}) {
  const data = useFragment(browseProductListItemFragment, product);

  return (
    <DataListItem>
      <article aria-label={data.name} {...props(styles.product)}>
        <h2 {...props(styles.productHeading)}>{data.name}</h2>
        <div {...props(styles.metadata)}>
          <p {...props(styles.metadataItem)}>{data.brand?.name ?? "Unknown brand"}</p>
        </div>
        <SpecificationHighlights attributes={data.currentAttributes} />
        <BrowseProductActions
          compareAction={compareAction}
          detailHref={detailHref}
          offerHref={offerHref}
          product={data}
        />
      </article>
    </DataListItem>
  );
}

function BrowseProductActions({
  compareAction,
  detailHref,
  offerHref,
  product,
}: {
  compareAction: BrowseCompareAction;
  detailHref: string;
  offerHref: string;
  product: BrowseProductNode;
}) {
  return (
    <ul aria-label={`Decision actions for ${product.name}`} {...props(styles.actionList)}>
      <li>
        <Link to={detailHref}>View details for {product.name}</Link>
      </li>
      <BrowseCompareActionItem action={compareAction} product={product} />
      <li>
        <Link to={offerHref}>View offers for {product.name}</Link>
      </li>
    </ul>
  );
}

function SpecificationHighlights({
  attributes,
}: {
  attributes: BrowseProductList_item$data["currentAttributes"];
}) {
  const highlights = selectBrowseProductSpecificationHighlights(attributes);

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
  product,
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
    default:
      return assertNever(action);
  }
}

function assertNever(action: never): never {
  throw new Error(`Unhandled browse compare action: ${JSON.stringify(action)}`);
}
