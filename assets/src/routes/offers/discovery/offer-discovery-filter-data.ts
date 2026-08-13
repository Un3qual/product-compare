import {
  buildCurrentRoutePathWithCompareSlugs,
  MAX_COMPARE_PRODUCTS,
  normalizedCompareSlugs,
} from "../../compare/paths";
import { nextRelayPageCursor } from "../../relay-pagination";

export const DEFAULT_OFFERS_PAGE_SIZE = 6;

export const OFFER_DISCOVERY_SORT_OPTIONS = [
  { label: "Default order", value: "default" },
  { label: "Price: low to high", value: "price_asc" },
  { label: "Price: high to low", value: "price_desc" },
  { label: "Merchant name", value: "merchant_name" },
] as const;

const DEFAULT_OFFER_DISCOVERY_SORT_OPTION = OFFER_DISCOVERY_SORT_OPTIONS[0];

export type OfferDiscoverySort = (typeof OFFER_DISCOVERY_SORT_OPTIONS)[number]["value"];

export interface OfferDiscoveryFilters {
  activeOnly: boolean;
  after: string | null;
  compareSlugs: string[];
  first: number;
  merchantId: string | null;
  productId: string | null;
  sort: OfferDiscoverySort;
}

type OfferDiscoveryFilterDataInput = Omit<OfferDiscoveryFilters, "sort"> & {
  sort: string;
};

export interface OfferDiscoveryProductContext {
  brand: {
    name: string;
  } | null;
  id: string;
  name: string;
  slug: string;
}

type OfferDiscoveryProductNode = Readonly<{
  __typename: "Product";
  brand: OfferDiscoveryProductContext["brand"] | undefined;
  id: string;
  name: string;
  slug: string;
}>;

export type OfferDiscoverySelectedProductNode =
  | OfferDiscoveryProductNode
  | Readonly<{ __typename: string }>;

export interface OfferDiscoveryScopeBadgeData {
  label: string;
  tone: "neutral" | "positive";
}

export function normalizeOfferDiscoverySort(sort: string | null | undefined): OfferDiscoverySort {
  const option = OFFER_DISCOVERY_SORT_OPTIONS.find((option) => option.value === sort);

  return option?.value ?? DEFAULT_OFFER_DISCOVERY_SORT_OPTION.value;
}

export function offerDiscoverySelectedProductContext(
  node: OfferDiscoverySelectedProductNode | null | undefined,
): OfferDiscoveryProductContext | null {
  if (!node || !isOfferDiscoveryProductNode(node)) {
    return null;
  }

  return {
    brand: node.brand ?? null,
    id: node.id,
    name: node.name,
    slug: node.slug,
  };
}

export function offerDiscoveryPath(filters: OfferDiscoveryFilterDataInput, after: string | null) {
  const canonicalFilters = canonicalizeFilters(filters);
  const params = new URLSearchParams();

  if (canonicalFilters.productId) {
    params.set("productId", canonicalFilters.productId);
  }

  if (canonicalFilters.merchantId) {
    params.set("merchantId", canonicalFilters.merchantId);
  }

  params.set("activeOnly", String(canonicalFilters.activeOnly));
  params.set("first", String(canonicalFilters.first));

  if (canonicalFilters.sort !== DEFAULT_OFFER_DISCOVERY_SORT_OPTION.value) {
    params.set("sort", canonicalFilters.sort);
  }

  for (const slug of canonicalFilters.compareSlugs) {
    params.append("slug", slug);
  }

  if (after) {
    params.set("after", after);
  }

  return `/offers?${params.toString()}`;
}

export function buildOfferDiscoveryPaginationData({
  endCursor,
  filters,
  hasNextPage,
  hasPreviousPage,
}: {
  readonly endCursor: string | null;
  readonly filters: OfferDiscoveryFilterDataInput;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
}) {
  const nextCursor = nextRelayPageCursor({ endCursor, hasNextPage }, filters.after);

  return {
    firstHref: hasPreviousPage && filters.after ? offerDiscoveryPath(filters, null) : null,
    nextHref: nextCursor ? offerDiscoveryPath(filters, nextCursor) : null,
  };
}

export function offerDiscoveryResetPath(filters: OfferDiscoveryFilterDataInput) {
  const canonicalFilters = canonicalizeFilters(filters);
  const params = new URLSearchParams();

  if (canonicalFilters.productId) {
    params.set("productId", canonicalFilters.productId);
  }

  if (canonicalFilters.sort !== DEFAULT_OFFER_DISCOVERY_SORT_OPTION.value) {
    params.set("sort", canonicalFilters.sort);
  }

  for (const slug of canonicalFilters.compareSlugs) {
    params.append("slug", slug);
  }

  const query = params.toString();

  return query ? `/offers?${query}` : "/offers";
}

export function getOfferDiscoveryFilterData(
  filters: OfferDiscoveryFilterDataInput,
  selectedProduct: OfferDiscoveryProductContext | null = null,
) {
  const canonicalFilters = canonicalizeFilters(filters);
  const sortLabel = sortLabelFor(canonicalFilters.sort);

  return {
    clearMerchantFilterPath: canonicalFilters.merchantId
      ? offerDiscoveryPath({ ...canonicalFilters, merchantId: null }, null)
      : null,
    formKey: JSON.stringify([
      canonicalFilters.productId,
      canonicalFilters.merchantId,
      canonicalFilters.activeOnly,
      canonicalFilters.first,
      canonicalFilters.sort,
      canonicalFilters.compareSlugs,
    ]),
    productDetailsPath: selectedProduct
      ? buildCurrentRoutePathWithCompareSlugs(
          `/products/${encodeURIComponent(selectedProduct.slug)}`,
          "",
          canonicalFilters.compareSlugs,
        )
      : null,
    showReset: hasNonDefaultOfferFilters(canonicalFilters),
    scopeBadge: offerDiscoveryScopeBadgeData(canonicalFilters),
    scopeDescription: offerDiscoveryScopeDescription(canonicalFilters, sortLabel),
    scopeEyebrow: selectedProduct?.brand?.name ?? "Offer scope",
    scopeTitle:
      selectedProduct?.name ??
      (canonicalFilters.productId ? "Selected product unavailable" : "Choose a product"),
    sortLabel,
  };
}

function offerDiscoveryScopeBadgeData(
  filters: OfferDiscoveryFilters,
): OfferDiscoveryScopeBadgeData {
  return filters.activeOnly
    ? { label: "Active offers", tone: "positive" }
    : { label: "All offers", tone: "neutral" };
}

function canonicalizeFilters(filters: OfferDiscoveryFilterDataInput): OfferDiscoveryFilters {
  return {
    ...filters,
    compareSlugs: normalizedCompareSlugs(filters.compareSlugs, {
      maxProducts: MAX_COMPARE_PRODUCTS,
    }),
    sort: normalizeOfferDiscoverySort(filters.sort),
  };
}

function isOfferDiscoveryProductNode(
  node: OfferDiscoverySelectedProductNode,
): node is OfferDiscoveryProductNode {
  return node.__typename === "Product";
}

function sortLabelFor(sort: OfferDiscoverySort) {
  const option = OFFER_DISCOVERY_SORT_OPTIONS.find((option) => option.value === sort);

  return option?.label ?? DEFAULT_OFFER_DISCOVERY_SORT_OPTION.label;
}

function offerDiscoveryScopeDescription(filters: OfferDiscoveryFilters, sortLabel: string): string {
  const offerScope = filters.activeOnly ? "active offers" : "all offers";
  const merchantScope = filters.merchantId ? " Merchant filter applied." : "";

  return `Showing ${offerScope}, sorted by ${sortLabel}, ${filters.first} per page.${merchantScope}`;
}

function hasNonDefaultOfferFilters(filters: OfferDiscoveryFilters) {
  return Boolean(
    filters.productId ||
    filters.merchantId ||
    filters.after ||
    !filters.activeOnly ||
    filters.first !== DEFAULT_OFFERS_PAGE_SIZE,
  );
}
