import {
  MAX_COMPARE_PRODUCTS,
  buildCurrentRoutePathWithCompareSlugs,
  normalizedCompareSlugs,
  selectedCompareSlugsAfterAdding
} from "../compare/paths";

export type BrowseCompareAction =
  | { kind: "selected" }
  | { kind: "full" }
  | { href: string; kind: "add" };

export interface BrowseRouteData {
  pathname: string;
  selectedCompareSlugs: readonly string[];
  compareActionFor(productSlug: string): BrowseCompareAction;
  productDetailPathFor(productSlug: string): string;
  removeSelectedPathForIndex(index: number): string;
}

export function createBrowseRouteData({
  pathname,
  search,
  selectedCompareSlugs
}: {
  pathname: string;
  search: string;
  selectedCompareSlugs: readonly string[];
}): BrowseRouteData {
  const normalizedSelectedCompareSlugs = normalizedCompareSlugs(
    selectedCompareSlugs,
    { maxProducts: MAX_COMPARE_PRODUCTS }
  );
  const canonicalPathname = pathname === "/" ? "/products" : pathname;

  return {
    pathname: canonicalPathname,
    selectedCompareSlugs: normalizedSelectedCompareSlugs,
    compareActionFor(productSlug) {
      if (normalizedSelectedCompareSlugs.includes(productSlug)) {
        return { kind: "selected" };
      }

      if (normalizedSelectedCompareSlugs.length >= MAX_COMPARE_PRODUCTS) {
        return { kind: "full" };
      }

      return {
        href: buildCurrentRoutePathWithCompareSlugs(
          canonicalPathname,
          search,
          selectedCompareSlugsAfterAdding(
            normalizedSelectedCompareSlugs,
            productSlug,
            MAX_COMPARE_PRODUCTS
          ),
          { maxProducts: MAX_COMPARE_PRODUCTS }
        ),
        kind: "add"
      };
    },
    productDetailPathFor(productSlug) {
      return buildCurrentRoutePathWithCompareSlugs(
        `/products/${encodeURIComponent(productSlug)}`,
        "",
        normalizedSelectedCompareSlugs,
        { maxProducts: MAX_COMPARE_PRODUCTS }
      );
    },
    removeSelectedPathForIndex(index) {
      return buildCurrentRoutePathWithCompareSlugs(
        canonicalPathname,
        search,
        normalizedSelectedCompareSlugs.filter((_, selectedIndex) => selectedIndex !== index),
        { maxProducts: MAX_COMPARE_PRODUCTS }
      );
    }
  };
}
