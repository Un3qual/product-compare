import type { CompareSpecMode } from "./paths";

export type RecommendationProfile = "lowest_current_cost" | "best_value";

interface RecommendationRevalidationArgs {
  currentUrl: URL;
  defaultShouldRevalidate: boolean;
  nextUrl: URL;
}

export function recommendationProfileFromUrl(requestUrl: string): RecommendationProfile {
  return new URL(requestUrl, "http://product-compare.local").searchParams.get("recommend") ===
    "best_value"
    ? "best_value"
    : "lowest_current_cost";
}

export function buildRecommendationProfilePath(
  slugs: readonly string[],
  specMode: CompareSpecMode,
  profile: RecommendationProfile
) {
  const params = new URLSearchParams();

  slugs.forEach((slug) => {
    params.append("slug", slug);
  });

  if (specMode !== "shared") params.set("specs", specMode);
  if (profile === "best_value") params.set("recommend", profile);

  return `/compare?${params.toString()}`;
}

export function shouldRevalidateCompareLoader({
  currentUrl,
  defaultShouldRevalidate,
  nextUrl
}: RecommendationRevalidationArgs) {
  const current = new URL(currentUrl);
  const next = new URL(nextUrl);
  const recommendationChanged =
    current.searchParams.get("recommend") !== next.searchParams.get("recommend");
  current.searchParams.delete("recommend");
  next.searchParams.delete("recommend");

  return recommendationChanged &&
    current.pathname === next.pathname &&
    current.search === next.search
    ? false
    : defaultShouldRevalidate;
}
