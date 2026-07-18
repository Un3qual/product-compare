export {
  offerDiscoveryPath,
  offerDiscoveryResetPath
} from "./offer-discovery-filter-data";

export function productOffersPath(productId: string) {
  return `/offers?productId=${encodeURIComponent(productId)}`;
}
