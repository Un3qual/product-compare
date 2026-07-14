import {
  buildComparePathFromSlugs,
  buildCurrentRoutePathWithCompareSlugs,
  selectedCompareSlugsAfterAdding,
  selectedCompareSlugsFromSearch
} from "../compare/paths";

export type ProductDetailView = "overview" | "specifications" | "offers" | "community";

export type ProductDetailCompareAction =
  | { kind: "selected" }
  | { kind: "full" }
  | { href: string; kind: "add" };

export type ProductOverviewSummaryItem = {
  label: string;
  value: number | string;
};

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
  maxCompareProducts,
  productSlug,
  search
}: {
  hash: string;
  maxCompareProducts: number;
  productSlug: string;
  search: string;
}): ProductDetailRouteData {
  const selectedCompareSlugs = selectedCompareSlugsFromSearch(search, {
    maxProducts: maxCompareProducts
  });
  const productPath = productDetailPath(productSlug);

  return {
    browsePath: buildCurrentRoutePathWithCompareSlugs(
      "/products",
      "",
      selectedCompareSlugs,
      { maxProducts: maxCompareProducts }
    ),
    compareAction: productDetailCompareAction({
      hash,
      maxCompareProducts,
      productPath,
      productSlug,
      search,
      selectedCompareSlugs
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
        maxCompareProducts
      );
    }
  };
}

export function overviewSummaryItems({
  attributeCount,
  hasMoreOffers,
  loadedOfferCount
}: {
  attributeCount: number;
  hasMoreOffers: boolean;
  loadedOfferCount: number;
}): ProductOverviewSummaryItem[] {
  return [
    { label: "Specifications available", value: attributeCount },
    {
      label: "Active offers loaded",
      value: hasMoreOffers ? `${loadedOfferCount}+` : loadedOfferCount
    }
  ];
}

export function productDetailPath(productSlug: string) {
  return `/products/${encodeURIComponent(productSlug)}`;
}

function productDetailCompareAction({
  hash,
  maxCompareProducts,
  productPath,
  productSlug,
  search,
  selectedCompareSlugs
}: {
  hash: string;
  maxCompareProducts: number;
  productPath: string;
  productSlug: string;
  search: string;
  selectedCompareSlugs: readonly string[];
}): ProductDetailCompareAction {
  if (selectedCompareSlugs.includes(productSlug)) {
    return { kind: "selected" };
  }

  if (selectedCompareSlugs.length >= maxCompareProducts) {
    return { kind: "full" };
  }

  return {
    href: productPathWithCompareSlugs(
      productPath,
      search,
      selectedCompareSlugsAfterAdding(
        selectedCompareSlugs,
        productSlug,
        maxCompareProducts
      ),
      hash,
      maxCompareProducts
    ),
    kind: "add"
  };
}

function detailViewFromLocation(hash: string, search: string): ProductDetailView {
  const view = hash.replace(/^#/, "");

  if (
    view === "overview" ||
    view === "specifications" ||
    view === "offers" ||
    view === "community"
  ) {
    return view;
  }

  return new URLSearchParams(search).has("offersAfter") ? "offers" : "overview";
}

function productPathWithCompareSlugs(
  productPath: string,
  search: string,
  selectedCompareSlugs: readonly string[],
  hash: string,
  maxCompareProducts: number
) {
  const path = buildCurrentRoutePathWithCompareSlugs(
    productPath,
    search,
    selectedCompareSlugs,
    { maxProducts: maxCompareProducts }
  );

  return `${path}${hash}`;
}
