import {
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
  maxCompareProducts,
  pathname,
  search,
  selectedCompareSlugs
}: {
  maxCompareProducts: number;
  pathname: string;
  search: string;
  selectedCompareSlugs: readonly string[];
}): BrowseRouteData {
  const normalizedSelectedCompareSlugs = normalizedCompareSlugs(
    selectedCompareSlugs,
    { maxProducts: maxCompareProducts }
  );
  const canonicalPathname = pathname === "/" ? "/products" : pathname;

  return {
    pathname: canonicalPathname,
    selectedCompareSlugs: normalizedSelectedCompareSlugs,
    compareActionFor(productSlug) {
      if (normalizedSelectedCompareSlugs.includes(productSlug)) {
        return { kind: "selected" };
      }

      if (normalizedSelectedCompareSlugs.length >= maxCompareProducts) {
        return { kind: "full" };
      }

      return {
        href: buildCurrentRoutePathWithCompareSlugs(
          canonicalPathname,
          search,
          selectedCompareSlugsAfterAdding(
            normalizedSelectedCompareSlugs,
            productSlug,
            maxCompareProducts
          ),
          { maxProducts: maxCompareProducts }
        ),
        kind: "add"
      };
    },
    productDetailPathFor(productSlug) {
      return buildCurrentRoutePathWithCompareSlugs(
        `/products/${encodeURIComponent(productSlug)}`,
        "",
        normalizedSelectedCompareSlugs,
        { maxProducts: maxCompareProducts }
      );
    },
    removeSelectedPathForIndex(index) {
      return buildCurrentRoutePathWithCompareSlugs(
        canonicalPathname,
        search,
        normalizedSelectedCompareSlugs.filter((_, selectedIndex) => selectedIndex !== index),
        { maxProducts: maxCompareProducts }
      );
    }
  };
}
