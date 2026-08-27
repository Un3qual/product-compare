import type { CategoryRouteQuery } from "$generated/CategoryRouteQuery.graphql";
import { nextPageCursor } from "$relay/pagination";

export function getCategoryViewData(
  category: NonNullable<CategoryRouteQuery["response"]["category"]>,
  currentAfter: string | null = null,
) {
  return {
    title: `Compare ${category.name}`,
    qualificationCopy: `${category.qualifiedProductCount} products currently have the specifications, product details, and current offers needed for comparison.`,
    browsePath: `/products?typeTaxonId=${encodeURIComponent(category.id)}&includeTypeDescendants=1`,
    productRows: category.products.edges.map(({ node }) => ({
      id: node.id,
      name: node.name,
      slug: node.slug,
      brandName: node.brand?.name ?? "Unknown brand",
      specificationHighlights: node.currentAttributes.slice(0, 3),
    })),
    nextPagePath: categoryNextPagePath(category, currentAfter),
  };
}

function categoryNextPagePath(
  category: NonNullable<CategoryRouteQuery["response"]["category"]>,
  currentAfter: string | null,
) {
  const nextCursor = nextPageCursor(category.products.pageInfo, currentAfter);

  return nextCursor
    ? `/categories/${encodeURIComponent(category.slug)}?after=${encodeURIComponent(nextCursor)}`
    : null;
}
