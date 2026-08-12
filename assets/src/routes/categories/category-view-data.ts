import { nextRelayPageCursor } from "../relay-pagination";

export type CategorySpecificationHighlight = {
  attributeId: string;
  displayName: string;
  valueText: string;
};

export type CategoryViewDataInput = {
  id: string;
  name: string;
  slug: string;
  qualifiedProductCount: number;
  products: {
    edges: ReadonlyArray<{
      node: {
        id: string;
        name: string;
        slug: string;
        brand?: { name: string } | null;
        currentAttributes: ReadonlyArray<CategorySpecificationHighlight>;
      };
    }>;
    pageInfo: {
      hasNextPage: boolean;
      endCursor?: string | null;
    };
  };
};

export function getCategoryViewData(
  category: CategoryViewDataInput,
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

function categoryNextPagePath(category: CategoryViewDataInput, currentAfter: string | null) {
  const nextCursor = nextRelayPageCursor(category.products.pageInfo, currentAfter);

  return nextCursor
    ? `/categories/${encodeURIComponent(category.slug)}?after=${encodeURIComponent(nextCursor)}`
    : null;
}
