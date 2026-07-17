import { create, props } from "@stylexjs/stylex";
import { Link, useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import type { CategoryRouteQuery as CategoryRouteQueryType } from "../../__generated__/CategoryRouteQuery.graphql";
import { useRoutePreloadedQuery } from "../../relay/route-preload";
import { FeedbackState } from "../../ui/components/feedback/FeedbackState";
import { PageShell } from "../../ui/components/layout/PageShell";
import { tokens } from "../../ui/theme/tokens.stylex";
import { productDetailPath } from "../products/product-detail-route-data";
import { getCategoryViewData } from "./category-view-data";
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
  const viewData = getCategoryViewData(category);

  return (
    <PageShell eyebrow="Product category" title={viewData.title} description={category.description}>
      <p {...props(styles.facts)}>{viewData.qualificationCopy}</p>
      <Link to={viewData.browsePath}>Explore every product and filter</Link>
      {viewData.productRows.length ? (
        <ul aria-label={`${category.name} products`} {...props(styles.list)}>
          {viewData.productRows.map((product) => <li key={product.id} {...props(styles.product)}>
              <h2 {...props(styles.title)}><Link to={productDetailPath(product.slug)}>{product.name}</Link></h2>
              <p {...props(styles.facts)}>{product.brandName} · current qualifying offer evidence available</p>
              <ul aria-label={`${product.name} specification highlights`} {...props(styles.specifications)}>
                {product.specificationHighlights.map((attribute) => <li key={attribute.attributeId}><strong>{attribute.displayName}:</strong> {attribute.valueText}</li>)}
              </ul>
            </li>)}
        </ul>
      ) : <FeedbackState kind="empty" title="No qualifying products are available yet." />}
      {viewData.nextPagePath ? <Link to={viewData.nextPagePath}>Next products</Link> : null}
    </PageShell>
  );
}
