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
  const normalizedSelectedCompareSlugs = normalizeCompareSlugs(
    selectedCompareSlugs,
    maxCompareProducts
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
        href: buildPathWithCompareSlugs(
          canonicalPathname,
          search,
          addCompareSlug(normalizedSelectedCompareSlugs, productSlug, maxCompareProducts)
        ),
        kind: "add"
      };
    },
    productDetailPathFor(productSlug) {
      return buildPathWithCompareSlugs(
        `/products/${encodeURIComponent(productSlug)}`,
        "",
        normalizedSelectedCompareSlugs
      );
    },
    removeSelectedPathForIndex(index) {
      return buildPathWithCompareSlugs(
        canonicalPathname,
        search,
        normalizedSelectedCompareSlugs.filter((_, selectedIndex) => selectedIndex !== index)
      );
    }
  };
}

function addCompareSlug(
  selectedCompareSlugs: readonly string[],
  productSlug: string,
  maxCompareProducts: number
) {
  const normalizedProductSlug = productSlug.trim();

  if (
    normalizedProductSlug.length === 0 ||
    selectedCompareSlugs.includes(normalizedProductSlug) ||
    selectedCompareSlugs.length >= maxCompareProducts
  ) {
    return selectedCompareSlugs;
  }

  return [...selectedCompareSlugs, normalizedProductSlug];
}

function buildPathWithCompareSlugs(
  pathname: string,
  search: string,
  selectedCompareSlugs: readonly string[]
) {
  const currentParams = new URLSearchParams(search);
  const nextParams = new URLSearchParams();

  for (const [key, value] of currentParams) {
    if (key !== "slug") {
      nextParams.append(key, value);
    }
  }

  for (const slug of selectedCompareSlugs) {
    nextParams.append("slug", slug);
  }

  const queryString = nextParams.toString();

  return queryString.length > 0 ? `${pathname}?${queryString}` : pathname;
}

function normalizeCompareSlugs(slugs: readonly string[], maxCompareProducts: number) {
  const normalizedSlugs: string[] = [];
  const seenSlugs = new Set<string>();

  for (const slug of slugs) {
    if (normalizedSlugs.length >= maxCompareProducts) {
      break;
    }

    const normalizedSlug = slug.trim();

    if (normalizedSlug.length === 0 || seenSlugs.has(normalizedSlug)) {
      continue;
    }

    normalizedSlugs.push(normalizedSlug);
    seenSlugs.add(normalizedSlug);
  }

  return normalizedSlugs;
}
