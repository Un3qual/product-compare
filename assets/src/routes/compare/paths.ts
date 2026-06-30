export function buildComparePathFromSlugs(selectedSlugs: readonly string[]) {
  const params = new URLSearchParams();

  for (const slug of selectedSlugs) {
    params.append("slug", slug);
  }

  const nextQueryString = params.toString();

  return nextQueryString.length > 0 ? `/compare?${nextQueryString}` : "/compare";
}

export function buildComparePathAfterRemovingSlugIndex(
  selectedSlugs: readonly string[],
  removeIndex: number
) {
  const nextSelectedSlugs = selectedSlugs.filter((_, index) => index !== removeIndex);

  return buildComparePathFromSlugs(nextSelectedSlugs);
}
