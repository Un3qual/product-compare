import type { CategoryRouteQuery } from "$generated/CategoryRouteQuery.graphql";
import { nextPageCursor } from "$relay/pagination";

type Category = NonNullable<CategoryRouteQuery["response"]["category"]>;
type CategoryProduct = Category["products"]["edges"][number]["node"];

export type CategoryViewDataInput = Pick<
  Category,
  "id" | "name" | "qualifiedProductCount" | "slug"
> & {
  readonly products: {
    readonly edges: ReadonlyArray<{
      readonly node: Pick<CategoryProduct, "brand" | "currentAttributes" | "id" | "name" | "slug">;
    }>;
    readonly pageInfo: Pick<Category["products"]["pageInfo"], "endCursor" | "hasNextPage">;
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
  const nextCursor = nextPageCursor(category.products.pageInfo, currentAfter);

  return nextCursor
    ? `/categories/${encodeURIComponent(category.slug)}?after=${encodeURIComponent(nextCursor)}`
    : null;
}
