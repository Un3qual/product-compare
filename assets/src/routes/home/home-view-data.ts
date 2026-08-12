import type { HomeDealReasonCode, HomeDeals_deal$data } from "$generated/HomeDeals_deal.graphql";
import type { HomeDealsQuery$data } from "$generated/HomeDealsQuery.graphql";
import type {
  HomePriceSignalCode,
  HomeProductLedger_products$data,
} from "$generated/HomeProductLedger_products.graphql";
import type { HomeRouteQuery$data } from "$generated/HomeRouteQuery.graphql";
import { homeCategoryCatalogPath, homeProductDetailPath } from "./home-paths";

export const HOME_PAGE_SIZE = 6;

type HomeWorkspace = HomeRouteQuery$data["homeWorkspace"];
type HomeDeals = HomeDealsQuery$data["homeDeals"];
type HomeWorkspaceProduct = HomeProductLedger_products$data["edges"][number];
type HomeDealEdge = HomeDeals["new"]["edges"][number];
type HomeOffer = {
  readonly currency: string;
  readonly landedPrice: unknown;
  readonly merchantName: string;
};

export type HomeLedgerRow = {
  category: string;
  freshness: string;
  highlights: string;
  href: string;
  id: string;
  name: string;
  offer: string;
  priceSignal: string;
  slug: string;
};

export type HomeDealReason = {
  code: HomeDealReasonCode;
  watchTarget?: unknown;
};

export function homeWorkspaceViewData(workspace: HomeWorkspace) {
  const selectedSlugs = workspace.selectedProducts.map((product) => product.slug);

  return {
    categories: workspace.categories.edges.map(({ node: category }) => ({
      description: category.description,
      href: homeCategoryCatalogPath(category.id, selectedSlugs),
      label: category.name,
    })),
    comparisonProducts: workspace.selectedProducts.map((product) => ({
      label: product.name,
      slug: product.slug,
    })),
    selectedSlugs,
  };
}

export function homeLedgerRows(
  products: HomeProductLedger_products$data,
  selectedSlugs: readonly string[],
) {
  return products.edges.map((edge) => homeLedgerRow(edge, selectedSlugs));
}

export function homeDealsViewData(deals: HomeDeals, hasViewer: boolean) {
  const tabs = [
    homeDealTab("new", "New", deals.new.edges),
    homeDealTab("trending", "Trending", deals.trending.edges),
  ];

  if (hasViewer && deals.forYou.edges.length > 0) {
    tabs.push(homeDealTab("for-you", "For you", deals.forYou.edges));
  }

  return { tabs };
}

export function homeDealViewData(deal: HomeDeals_deal$data, selectedSlugs: readonly string[]) {
  return {
    href: homeProductDetailPath(deal.node.slug, selectedSlugs),
    id: deal.node.id,
    name: deal.node.name,
    offer: formatOffer(deal.offer),
    reason: deal.reasons[0]
      ? homeDealReasonCopy(deal.reasons[0], deal.offer.currency)
      : "Current offer",
  };
}

export function homeDealReasonCopy(reason: HomeDealReason, currency: string) {
  switch (reason.code) {
    case "NEW_OFFER":
      return "New offer";
    case "TRENDING_BELOW_MEDIAN":
      return "Below the 30-day price";
    case "WATCH_TARGET": {
      const watchTarget = scalarText(reason.watchTarget);

      return watchTarget
        ? `Matches your ${formatCurrency(watchTarget, currency)} price watch`
        : "Matches your price watch";
    }
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

function homeLedgerRow(row: HomeWorkspaceProduct, selectedSlugs: readonly string[]): HomeLedgerRow {
  const { offer, node: product } = row;

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

function homeDealTab(value: string, label: string, deals: ReadonlyArray<HomeDealEdge>) {
  return {
    deals: deals.map((edge) => ({ cursor: edge.cursor, fragmentRef: edge })),
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
  const match = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(value.trim());

  if (!match) return value;

  try {
    const [, sign, whole = "0", rawFraction = ""] = match;
    const fraction = rawFraction.padEnd(3, "0");
    let minorUnits = BigInt(whole) * 100n + BigInt(fraction.slice(0, 2));

    if (fraction[2] >= "5") minorUnits += 1n;

    const formatter = new Intl.NumberFormat("en-US", {
      currency,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
      style: "currency",
    });
    const formatted = formatter
      .formatToParts(minorUnits / 100n)
      .map((part) =>
        part.type === "fraction" ? (minorUnits % 100n).toString().padStart(2, "0") : part.value,
      )
      .join("");

    return sign === "-" && minorUnits !== 0n ? `-${formatted}` : formatted;
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
