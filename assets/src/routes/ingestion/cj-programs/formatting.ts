import { formatProductDateTime } from "$frontend/formatting";
import { parseGraphQLDateTime } from "$relay/scalars";

export function formatFeedProductCount(productCount: number | null) {
  if (productCount === null) {
    return "Product count unavailable";
  }

  return productCount === 1 ? "1 product" : `${productCount} products`;
}

export function formatCJDateTime(value: string | null) {
  const date = parseGraphQLDateTime(value);

  return date ? formatProductDateTime(date) : "";
}
