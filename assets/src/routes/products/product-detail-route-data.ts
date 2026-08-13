import {
  MAX_COMPARE_PRODUCTS,
  buildComparePathFromSlugs,
  buildCurrentRoutePathWithCompareSlugs,
  selectedCompareSlugsAfterAdding,
  selectedCompareSlugsFromSearch,
} from "../compare/paths";

export type ProductDetailView = "specifications" | "offers" | "community";

export type ProductDetailCompareAction =
  | { kind: "selected" }
  | { kind: "full" }
  | { href: string; kind: "add" };

export interface ProductDetailRouteData {
  browsePath: string;
  compareAction: ProductDetailCompareAction;
  comparePath: string;
  detailView: ProductDetailView;
  offersAfter: string | null;
  productPath: string;
  selectedCompareSlugs: readonly string[];
  removeSelectedPathForIndex(index: number): string;
}

export function createProductDetailRouteData({
  hash,
  productSlug,
  search,
}: {
  hash: string;
  productSlug: string;
  search: string;
}): ProductDetailRouteData {
  const selectedCompareSlugs = selectedCompareSlugsFromSearch(search, {
    maxProducts: MAX_COMPARE_PRODUCTS,
  });
  const productPath = productDetailPath(productSlug);

  return {
    browsePath: buildCurrentRoutePathWithCompareSlugs("/products", "", selectedCompareSlugs, {
      maxProducts: MAX_COMPARE_PRODUCTS,
    }),
    compareAction: productDetailCompareAction({
      hash,
      productPath,
      productSlug,
      search,
      selectedCompareSlugs,
    }),
    comparePath: buildComparePathFromSlugs(selectedCompareSlugs),
    detailView: detailViewFromLocation(hash, search),
    offersAfter: new URLSearchParams(search).get("offersAfter"),
    productPath,
    selectedCompareSlugs,
    removeSelectedPathForIndex(index) {
      return productPathWithCompareSlugs(
        productPath,
        search,
        selectedCompareSlugs.filter((_, selectedIndex) => selectedIndex !== index),
        hash,
      );
    },
  };
}

export function productDetailPath(productSlug: string) {
  return `/products/${encodeURIComponent(productSlug)}`;
}

function productDetailCompareAction({
  hash,
  productPath,
  productSlug,
  search,
  selectedCompareSlugs,
}: {
  hash: string;
  productPath: string;
  productSlug: string;
  search: string;
  selectedCompareSlugs: readonly string[];
}): ProductDetailCompareAction {
  if (selectedCompareSlugs.includes(productSlug)) {
    return { kind: "selected" };
  }

  if (selectedCompareSlugs.length >= MAX_COMPARE_PRODUCTS) {
    return { kind: "full" };
  }

  return {
    href: productPathWithCompareSlugs(
      productPath,
      search,
      selectedCompareSlugsAfterAdding(selectedCompareSlugs, productSlug, MAX_COMPARE_PRODUCTS),
      hash,
    ),
    kind: "add",
  };
}

function detailViewFromLocation(hash: string, search: string): ProductDetailView {
  const view = hash.replace(/^#/, "");

  if (view === "specifications" || view === "offers" || view === "community") {
    return view;
  }

  return new URLSearchParams(search).has("offersAfter") ? "offers" : "specifications";
}

function productPathWithCompareSlugs(
  productPath: string,
  search: string,
  selectedCompareSlugs: readonly string[],
  hash: string,
) {
  const path = buildCurrentRoutePathWithCompareSlugs(productPath, search, selectedCompareSlugs, {
    maxProducts: MAX_COMPARE_PRODUCTS,
  });

  return `${path}${hash}`;
}
