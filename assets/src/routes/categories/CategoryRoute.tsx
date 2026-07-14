import { create, props } from "@stylexjs/stylex";
import { Link, useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import type { CategoryRouteQuery as CategoryRouteQueryType } from "../../__generated__/CategoryRouteQuery.graphql";
import { useRoutePreloadedQuery } from "../../relay/route-preload";
import { FeedbackState } from "../../ui/components/feedback/FeedbackState";
import { PageShell } from "../../ui/components/layout/PageShell";
import { tokens } from "../../ui/theme/tokens.stylex";
import type { CategoryLoaderData } from "./loader";
import categoryRouteQuery from "./queries/CategoryRouteQuery";

const styles = create({
  facts: { color: tokens.textSecondary, margin: 0 },
  list: { display: "grid", gap: "1rem", listStyle: "none", margin: 0, padding: 0 },
  product: { borderBlockStart: "1px solid var(--pc-border-quiet)", display: "grid", gap: "0.55rem", paddingBlockStart: "1rem" },
  specifications: { display: "flex", flexWrap: "wrap", gap: "0.45rem 1.25rem", listStyle: "none", margin: 0, padding: 0 },
  title: { fontSize: "1.25rem", margin: 0 }
});

export function CategoryRoute() {
  const loaderData = useLoaderData() as CategoryLoaderData;
  if (loaderData.status !== "ready") {
    return <PageShell eyebrow="Product category" title="Category not found"><FeedbackState kind="error" title="This category is unavailable." /></PageShell>;
  }

  return <ReadyCategory query={loaderData.query} />;
}

function ReadyCategory({ query }: { query: Extract<CategoryLoaderData, { status: "ready" }>["query"] }) {
  const queryRef = useRoutePreloadedQuery<CategoryRouteQueryType>(categoryRouteQuery, query);
  const data = usePreloadedQuery<CategoryRouteQueryType>(categoryRouteQuery, queryRef);
  const category = data.category;
  if (!category) return null;

  return (
    <PageShell eyebrow="Product category" title={`Compare ${category.name}`} description={category.description}>
      <p {...props(styles.facts)}>{category.qualifiedProductCount} products currently meet this category’s specification, content, and offer-quality threshold.</p>
      <Link to={`/products?typeTaxonId=${encodeURIComponent(category.id)}&includeTypeDescendants=1`}>Explore every product and filter</Link>
      {category.products.edges.length ? (
        <ul aria-label={`${category.name} products`} {...props(styles.list)}>
          {category.products.edges.map(({ node }) => <li key={node.id} {...props(styles.product)}>
              <h2 {...props(styles.title)}><Link to={`/products/${node.slug}`}>{node.name}</Link></h2>
              <p {...props(styles.facts)}>{node.brand?.name ?? "Unknown brand"} · current qualifying offer evidence available</p>
              <ul aria-label={`${node.name} specification highlights`} {...props(styles.specifications)}>
                {node.currentAttributes.slice(0, 3).map((attribute) => <li key={attribute.attributeId}><strong>{attribute.displayName}:</strong> {attribute.valueText}</li>)}
              </ul>
            </li>)}
        </ul>
      ) : <FeedbackState kind="empty" title="No qualifying products are available yet." />}
      {category.products.pageInfo.hasNextPage && category.products.pageInfo.endCursor ? <Link to={`/categories/${category.slug}?after=${encodeURIComponent(category.products.pageInfo.endCursor)}`}>Next products</Link> : null}
    </PageShell>
  );
}
