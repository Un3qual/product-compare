import type { CompareSpecMode } from "./loader";

interface BuildComparePathOptions {
  specMode?: CompareSpecMode;
}

export function selectedCompareSlugsFromSearch(search: string): string[] {
  return normalizedCompareSlugs(new URLSearchParams(search).getAll("slug"));
}

export function selectedCompareSlugsAfterAdding(
  selectedSlugs: readonly string[],
  slug: string,
  maxProducts: number
): string[] {
  const nextSelectedSlugs = normalizedCompareSlugs(selectedSlugs);
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
  selectedSlugs: readonly string[]
): string {
  const currentParams = new URLSearchParams(search);
  const nextParams = new URLSearchParams();

  for (const [key, value] of currentParams) {
    if (key !== "slug") {
      nextParams.append(key, value);
    }
  }

  for (const slug of normalizedCompareSlugs(selectedSlugs)) {
    nextParams.append("slug", slug);
  }

  const nextQueryString = nextParams.toString();

  return nextQueryString.length > 0 ? `${pathname}?${nextQueryString}` : pathname;
}

export function buildComparePathFromSlugs(
  selectedSlugs: readonly string[],
  options: BuildComparePathOptions = {}
) {
  const params = new URLSearchParams();

  for (const slug of normalizedCompareSlugs(selectedSlugs)) {
    params.append("slug", slug);
  }

  if (options.specMode && options.specMode !== "shared") {
    params.set("specs", options.specMode);
  }

  const nextQueryString = params.toString();

  return nextQueryString.length > 0 ? `/compare?${nextQueryString}` : "/compare";
}

export function buildComparePathAfterRemovingSlugIndex(
  selectedSlugs: readonly string[],
  removeIndex: number,
  options: BuildComparePathOptions = {}
) {
  const nextSelectedSlugs = selectedSlugs.filter((_, index) => index !== removeIndex);

  return buildComparePathFromSlugs(nextSelectedSlugs, options);
}

function normalizedCompareSlugs(slugs: readonly string[]): string[] {
  const selectedSlugs: string[] = [];
  const seenSlugs = new Set<string>();

  for (const slug of slugs) {
    const normalizedSlug = slug.trim();

    if (normalizedSlug.length === 0 || seenSlugs.has(normalizedSlug)) {
      continue;
    }

    selectedSlugs.push(normalizedSlug);
    seenSlugs.add(normalizedSlug);
  }

  return selectedSlugs;
}
