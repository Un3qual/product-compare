import type { CompareProductPickerBoundary_products$data } from "$generated/CompareProductPickerBoundary_products.graphql";
import {
  MAX_COMPARE_PRODUCTS,
  buildComparePathFromSlugs,
  selectedCompareSlugsAfterAdding,
  type CompareSpecMode,
} from "../paths";

export type ComparePickerProduct = NonNullable<
  CompareProductPickerBoundary_products$data["products"]
>["edges"][number]["node"];

export type ComparePickerOption = {
  brandName: string;
  href: string;
  id: string;
  name: string;
};

export function comparePickerResetToken(
  specMode: CompareSpecMode,
  selectedSlugs: readonly string[],
) {
  return `${specMode}:${selectedSlugs.join("|")}`;
}

export function availableComparePickerProducts<Product extends ComparePickerProduct>(
  products: readonly Product[],
  selectedSlugs: readonly string[],
): Product[] {
  return products.filter((product) => !selectedSlugs.includes(product.slug));
}

export function buildComparePickerOptions(
  availableProducts: readonly ComparePickerProduct[],
  selectedSlugs: readonly string[],
  specMode: CompareSpecMode,
): ComparePickerOption[] {
  return availableProducts.map((product) => ({
    brandName: product.brand?.name ?? "Unknown brand",
    href: buildComparePathFromSlugs(
      selectedCompareSlugsAfterAdding(selectedSlugs, product.slug, MAX_COMPARE_PRODUCTS),
      { specMode },
    ),
    id: product.id,
    name: product.name,
  }));
}

export function isComparePickerEmpty(
  availableProducts: readonly ComparePickerProduct[],
  hasNext: boolean,
) {
  return availableProducts.length === 0 && !hasNext;
}

export function comparePickerEmptyMessage(selectedSlugs: readonly string[]) {
  return selectedSlugs.length === 0
    ? "No products are available to compare yet."
    : "No additional products are available to compare yet.";
}
