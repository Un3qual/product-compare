import type { BrowseProductList_item$data } from "$generated/BrowseProductList_item.graphql";

export type BrowseProductSpecificationHighlight =
  BrowseProductList_item$data["currentAttributes"][number];

const SPECIFICATION_HIGHLIGHT_LIMIT = 3;

export function selectBrowseProductSpecificationHighlights<
  T extends BrowseProductSpecificationHighlight,
>(attributes: ReadonlyArray<T>): T[] {
  return attributes
    .map((attribute, index) => ({ attribute, index }))
    .sort((left, right) => {
      const leftSortOrder = left.attribute.sortOrder;
      const rightSortOrder = right.attribute.sortOrder;

      if (leftSortOrder === null && rightSortOrder === null) {
        return left.index - right.index;
      }

      if (leftSortOrder === null) {
        return 1;
      }

      if (rightSortOrder === null) {
        return -1;
      }

      return leftSortOrder - rightSortOrder || left.index - right.index;
    })
    .slice(0, SPECIFICATION_HIGHLIGHT_LIMIT)
    .map(({ attribute }) => attribute);
}
