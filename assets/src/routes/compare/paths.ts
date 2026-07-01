import type { CompareSpecMode } from "./loader";

interface BuildComparePathOptions {
  specMode?: CompareSpecMode;
}

export function buildComparePathFromSlugs(
  selectedSlugs: readonly string[],
  options: BuildComparePathOptions = {}
) {
  const params = new URLSearchParams();

  for (const slug of selectedSlugs) {
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
