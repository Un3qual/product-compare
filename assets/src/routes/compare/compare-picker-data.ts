import {
  MAX_COMPARE_PRODUCTS,
  buildComparePathFromSlugs,
  selectedCompareSlugsAfterAdding,
  type CompareSpecMode
} from "./paths";

export type ComparePickerProduct = {
  readonly brand?: { readonly name: string | null } | null;
  readonly id: string;
  readonly name: string;
  readonly slug: string;
};

export type ComparePickerOption = {
  brandName: string;
  href: string;
  id: string;
  name: string;
};

export type ComparePickerPageInfo = {
  readonly endCursor: string | null | undefined;
  readonly hasNextPage: boolean;
};

export function comparePickerResetToken(
  specMode: CompareSpecMode,
  selectedSlugs: readonly string[]
) {
  return `${specMode}:${selectedSlugs.join("|")}`;
}

export function appendUniqueComparePickerProducts<Product extends ComparePickerProduct>(
  existingProducts: Product[],
  newProducts: readonly Product[]
): Product[] {
  if (newProducts.length === 0) {
    return existingProducts;
  }

  const seenProductIds = new Set(existingProducts.map((product) => product.id));
  const nextProducts = [...existingProducts];

  for (const product of newProducts) {
    if (seenProductIds.has(product.id)) {
      continue;
    }

    seenProductIds.add(product.id);
    nextProducts.push(product);
  }

  return nextProducts.length === existingProducts.length ? existingProducts : nextProducts;
}

export function availableComparePickerProducts<Product extends ComparePickerProduct>(
  products: readonly Product[],
  selectedSlugs: readonly string[]
): Product[] {
  return products.filter((product) => !selectedSlugs.includes(product.slug));
}

export function buildComparePickerOptions(
  availableProducts: readonly ComparePickerProduct[],
  selectedSlugs: readonly string[],
  specMode: CompareSpecMode
): ComparePickerOption[] {
  return availableProducts.map((product) => ({
    brandName: product.brand?.name ?? "Unknown brand",
    href: buildComparePathFromSlugs(
      selectedCompareSlugsAfterAdding(selectedSlugs, product.slug, MAX_COMPARE_PRODUCTS),
      { specMode }
    ),
    id: product.id,
    name: product.name
  }));
}

export function nextComparePickerPageCursor(
  pageInfo: ComparePickerPageInfo | null | undefined
) {
  return pageInfo?.hasNextPage ? pageInfo.endCursor ?? null : null;
}

export function isComparePickerEmpty(
  availableProducts: readonly ComparePickerProduct[],
  nextCursor: string | null | undefined
) {
  return availableProducts.length === 0 && !nextCursor;
}

export function comparePickerEmptyMessage(selectedSlugs: readonly string[]) {
  return selectedSlugs.length === 0
    ? "No products are available to compare yet."
    : "No additional products are available to compare yet.";
}
