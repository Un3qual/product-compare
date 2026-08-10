import { homeCategoryCatalogPath, homeProductDetailPath } from "./home-paths";

type HomeOffer = {
  activeOfferCount?: number | null;
  currency?: string | null;
  landedPrice?: string | null;
  merchantName?: string | null;
  observedAt?: string | null;
  priceSignal?: string | null;
};

type HomeProduct = {
  highlights: ReadonlyArray<{ label: string; value: string }>;
  id: string;
  name: string;
  offer: HomeOffer;
  slug: string;
};

type HomeDeal = {
  offer: HomeOffer;
  product: { id: string; name: string; slug: string };
  reasons: ReadonlyArray<HomeDealReason>;
};

export type HomeDealReason = {
  code: string;
  watchTarget?: string | null;
};

export function homeWorkspaceViewData(
  workspace: {
    categories: ReadonlyArray<{
      description: string;
      id: string;
      name: string;
      qualifiedProductCount: number;
      slug: string;
    }>;
    products: ReadonlyArray<HomeProduct>;
    selectedProducts: ReadonlyArray<{ id: string; name: string; slug: string }>;
  },
  selectedSlugs: readonly string[],
) {
  return {
    categories: workspace.categories.map((category) => ({
      description: category.description,
      href: homeCategoryCatalogPath(category.id, selectedSlugs),
      label: category.name,
      productCount: category.qualifiedProductCount,
    })),
    comparisonProducts: workspace.selectedProducts.map((product) => ({
      label: product.name,
      slug: product.slug,
    })),
    ledgerRows: workspace.products
      .slice(0, 6)
      .map((product) => homeLedgerRow(product, selectedSlugs)),
  };
}

export function homeDealsViewData(
  deals: {
    forYou: ReadonlyArray<HomeDeal>;
    new: ReadonlyArray<HomeDeal>;
    trending: ReadonlyArray<HomeDeal>;
  },
  hasViewer: boolean,
  selectedSlugs: readonly string[],
) {
  const tabs = [
    homeDealTab("new", "New", deals.new, selectedSlugs),
    homeDealTab("trending", "Trending", deals.trending, selectedSlugs),
  ];

  if (hasViewer && deals.forYou.length > 0) {
    tabs.push(homeDealTab("for-you", "For you", deals.forYou, selectedSlugs));
  }

  return { tabs };
}

export function homeDealReasonCopy(reason: HomeDealReason, currency: string | null | undefined) {
  switch (reason.code) {
    case "NEW_OFFER":
      return "New offer";
    case "TRENDING_BELOW_MEDIAN":
      return "Below the 30-day price";
    case "WATCH_TARGET":
      return reason.watchTarget && currency
        ? `Matches your ${formatCurrency(reason.watchTarget, currency)} price watch`
        : "Matches your price watch";
    case "SAVED_COMPARISON":
      return "In your saved comparison";
    case "CURRENT_COMPARISON":
      return "In your current comparison";
    default:
      return "Current offer";
  }
}

function homeLedgerRow(product: HomeProduct, selectedSlugs: readonly string[]) {
  return {
    category: "Product",
    freshness: formatObservedAt(product.offer.observedAt),
    highlights: formatHighlights(product.highlights),
    href: homeProductDetailPath(product.slug, selectedSlugs),
    id: product.id,
    name: product.name,
    offer: formatOffer(product.offer),
    priceSignal: priceSignalCopy(product.offer.priceSignal),
    slug: product.slug,
  };
}

function homeDealTab(
  value: string,
  label: string,
  deals: ReadonlyArray<HomeDeal>,
  selectedSlugs: readonly string[],
) {
  return {
    deals: deals.map((deal) => ({
      href: homeProductDetailPath(deal.product.slug, selectedSlugs),
      id: deal.product.id,
      name: deal.product.name,
      offer: formatOffer(deal.offer),
      reason: deal.reasons[0]
        ? homeDealReasonCopy(deal.reasons[0], deal.offer.currency)
        : "Current offer",
    })),
    emptyTitle: `No ${label.toLowerCase()} offers to show yet.`,
    label,
    value,
  };
}

function formatHighlights(highlights: ReadonlyArray<{ label: string; value: string }>) {
  const labels = highlights
    .filter(({ label, value }) => label.trim().length > 0 && value.trim().length > 0)
    .slice(0, 3)
    .map(({ label, value }) => `${label}: ${value}`);

  return labels.length > 0 ? labels.join(" · ") : "Details available on the product page";
}

function formatOffer(offer: HomeOffer) {
  if (!offer.landedPrice || !offer.currency || !offer.merchantName) {
    return "Price unavailable";
  }

  return `${formatCurrency(offer.landedPrice, offer.currency)} at ${offer.merchantName}`;
}

function formatCurrency(value: string, currency: string) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return value;
  }

  try {
    return new Intl.NumberFormat("en-US", {
      currency,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
      style: "currency",
    }).format(amount);
  } catch {
    return `${value} ${currency}`;
  }
}

function priceSignalCopy(code: string | null | undefined) {
  switch (code) {
    case "BELOW_30_DAY_MEDIAN":
      return "Below the 30-day price";
    case "AT_OR_ABOVE_30_DAY_MEDIAN":
      return "At or above the 30-day price";
    default:
      return "No 30-day price history";
  }
}

function formatObservedAt(observedAt: string | null | undefined) {
  if (!observedAt || Number.isNaN(Date.parse(observedAt))) {
    return "Last checked unavailable";
  }

  return `Last checked ${new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(observedAt))}`;
}
