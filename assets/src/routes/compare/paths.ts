export const MAX_COMPARE_PRODUCTS = 3;

export type CompareSpecMode = "shared" | "differences" | "all";

interface BuildComparePathOptions {
  specMode?: CompareSpecMode;
}

export interface NormalizeCompareSlugsOptions {
  maxProducts?: number;
}

export function selectedCompareSlugsFromSearch(
  search: string,
  options: NormalizeCompareSlugsOptions = {},
): string[] {
  return normalizedCompareSlugs(new URLSearchParams(search).getAll("slug"), options);
}

export function selectedCompareSlugsAfterAdding(
  selectedSlugs: readonly string[],
  slug: string,
  maxProducts: number,
): string[] {
  const nextSelectedSlugs = normalizedCompareSlugs(selectedSlugs, { maxProducts });
  const normalizedSlug = slug.trim();

  if (
    normalizedSlug.length === 0 ||
    nextSelectedSlugs.includes(normalizedSlug) ||
    nextSelectedSlugs.length >= maxProducts
  ) {
    return nextSelectedSlugs;
  }

  return [...nextSelectedSlugs, normalizedSlug];
}

export function buildCurrentRoutePathWithCompareSlugs(
  pathname: string,
  search: string,
  selectedSlugs: readonly string[],
  options: NormalizeCompareSlugsOptions = {},
): string {
  const currentParams = new URLSearchParams(search);
  const nextParams = new URLSearchParams();

  for (const [key, value] of currentParams) {
    if (key !== "slug") {
      nextParams.append(key, value);
    }
  }

  appendNormalizedCompareSlugParams(nextParams, selectedSlugs, options);

  const nextQueryString = nextParams.toString();

  return nextQueryString.length > 0 ? `${pathname}?${nextQueryString}` : pathname;
}

export function buildComparePathFromSlugs(
  selectedSlugs: readonly string[],
  options: BuildComparePathOptions = {},
) {
  const params = new URLSearchParams();

  appendNormalizedCompareSlugParams(params, selectedSlugs);

  if (options.specMode && options.specMode !== "shared") {
    params.set("specs", options.specMode);
  }

  const nextQueryString = params.toString();

  return nextQueryString.length > 0 ? `/compare?${nextQueryString}` : "/compare";
}

export function buildComparePathAfterRemovingSlugIndex(
  selectedSlugs: readonly string[],
  removeIndex: number,
  options: BuildComparePathOptions = {},
) {
  const nextSelectedSlugs = selectedSlugs.filter((_, index) => index !== removeIndex);

  return buildComparePathFromSlugs(nextSelectedSlugs, options);
}

function appendNormalizedCompareSlugParams(
  params: URLSearchParams,
  slugs: readonly string[],
  options: NormalizeCompareSlugsOptions = {},
) {
  for (const slug of normalizedCompareSlugs(slugs, {
    maxProducts: options.maxProducts ?? MAX_COMPARE_PRODUCTS,
  })) {
    params.append("slug", slug);
  }
}

export function normalizedCompareSlugs(
  slugs: readonly string[],
  options: NormalizeCompareSlugsOptions = {},
): string[] {
  const selectedSlugs: string[] = [];
  const seenSlugs = new Set<string>();

  for (const slug of slugs) {
    if (options.maxProducts !== undefined && selectedSlugs.length >= options.maxProducts) {
      break;
    }

    const normalizedSlug = slug.trim();

    if (normalizedSlug.length === 0 || seenSlugs.has(normalizedSlug)) {
      continue;
    }

    selectedSlugs.push(normalizedSlug);
    seenSlugs.add(normalizedSlug);
  }

  return selectedSlugs;
}
