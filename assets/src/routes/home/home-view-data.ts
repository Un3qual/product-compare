import type {
  HomeDealReasonCode,
  HomeDealsRouteQuery$data,
} from "../../__generated__/HomeDealsRouteQuery.graphql";
import type {
  HomePriceSignalCode,
  HomeWorkspaceRouteQuery$data,
} from "../../__generated__/HomeWorkspaceRouteQuery.graphql";
import { homeCategoryCatalogPath, homeProductDetailPath } from "./home-paths";

type HomeWorkspace = HomeWorkspaceRouteQuery$data["homeWorkspace"];
type HomeWorkspaceProduct = HomeWorkspace["products"][number];
type HomeDeals = HomeDealsRouteQuery$data["homeDeals"];
type HomeDeal = HomeDeals["new"][number];
type HomeOffer = HomeWorkspaceProduct["offer"] | HomeDeal["offer"];

export type HomeDealReason = {
  code: HomeDealReasonCode;
  watchTarget?: unknown;
};

export function homeWorkspaceViewData(workspace: HomeWorkspace) {
  const selectedSlugs = workspace.selectedProducts.map((product) => product.slug);

  return {
    categories: workspace.categories.map((category) => ({
      description: category.description,
      href: homeCategoryCatalogPath(category.taxonId, selectedSlugs),
      label: category.name,
    })),
    comparisonProducts: workspace.selectedProducts.map((product) => ({
      label: product.name,
      slug: product.slug,
    })),
    ledgerRows: workspace.products.slice(0, 6).map((row) => homeLedgerRow(row, selectedSlugs)),
    selectedSlugs,
  };
}

export function homeDealsViewData(
  deals: HomeDeals,
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

export function homeDealReasonCopy(reason: HomeDealReason, currency: string) {
  switch (reason.code) {
    case "NEW_OFFER":
      return "New offer";
    case "TRENDING_BELOW_MEDIAN":
      return "Below the 30-day price";
    case "WATCH_TARGET":
      return scalarText(reason.watchTarget)
        ? `Matches your ${formatCurrency(scalarText(reason.watchTarget)!, currency)} price watch`
        : "Matches your price watch";
    case "SAVED_COMPARISON":
      return "In your saved comparison";
    case "CURRENT_COMPARISON":
      return "In your current comparison";
    case "%future added value":
      return "Current offer";
    default:
      return "Current offer";
  }
}

function homeLedgerRow(row: HomeWorkspaceProduct, selectedSlugs: readonly string[]) {
  const { offer, product } = row;

  return {
    category: "Product",
    freshness: formatObservedAt(scalarText(offer.observedAt)),
    highlights: formatHighlights(row.highlights),
    href: homeProductDetailPath(product.slug, selectedSlugs),
    id: product.id,
    name: product.name,
    offer: formatOffer(offer),
    priceSignal: priceSignalCopy(offer.priceSignal),
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
  return `${formatCurrency(scalarText(offer.landedPrice) ?? "0", offer.currency)} at ${offer.merchantName}`;
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

function priceSignalCopy(code: HomePriceSignalCode) {
  switch (code) {
    case "BELOW_30_DAY_MEDIAN":
      return "Below the 30-day price";
    case "AT_OR_ABOVE_30_DAY_MEDIAN":
      return "At or above the 30-day price";
    case "%future added value":
      return "No 30-day price history";
    default:
      return "No 30-day price history";
  }
}

function formatObservedAt(observedAt: string | null) {
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

function scalarText(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return null;

  const text = String(value).trim();
  return text.length > 0 ? text : null;
}
