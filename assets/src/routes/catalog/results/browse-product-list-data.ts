export interface BrowseProductSpecificationHighlight {
  code: string;
  displayName: string;
  sortOrder?: number | null;
  valueText: string;
}

const SPECIFICATION_HIGHLIGHT_LIMIT = 3;

export function selectBrowseProductSpecificationHighlights<
  T extends BrowseProductSpecificationHighlight,
>(attributes: ReadonlyArray<T>): T[] {
  return attributes
    .map((attribute, index) => ({ attribute, index }))
    .sort((left, right) => {
      const leftSortOrder = finiteSortOrder(left.attribute.sortOrder);
      const rightSortOrder = finiteSortOrder(right.attribute.sortOrder);

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

function finiteSortOrder(sortOrder: number | null | undefined): number | null {
  return typeof sortOrder === "number" && Number.isFinite(sortOrder) ? sortOrder : null;
}
