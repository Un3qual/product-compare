import { MAX_COMPARE_PRODUCTS, normalizedCompareSlugs } from "../compare/paths";

export {
  offerDiscoveryPath,
  offerDiscoveryResetPath,
} from "./discovery/offer-discovery-filter-data";

export function productOffersPath(productId: string, compareSlugs: readonly string[] = []) {
  const params = new URLSearchParams();

  for (const slug of normalizedCompareSlugs(compareSlugs, { maxProducts: MAX_COMPARE_PRODUCTS })) {
    params.append("slug", slug);
  }

  const compareQuery = params.toString();

  return `/offers?productId=${encodeURIComponent(productId)}${
    compareQuery ? `&${compareQuery}` : ""
  }`;
}
