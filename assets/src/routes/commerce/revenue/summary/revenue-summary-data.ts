import type { RevenueSummaryRouteQuery } from "$generated/RevenueSummaryRouteQuery.graphql";

export type RevenueSummaryFilters = Pick<
  NonNullable<RevenueSummaryRouteQuery["variables"]["input"]>,
  "currency" | "from" | "network" | "to"
>;

export const ATTRIBUTION_LEDGER_PAGE_SIZE = 20;
const DATE_FILTER_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SUPPORTED_NETWORKS = new Set(["impact", "awin", "rakuten", "cj", "amazon_associates"]);

type RevenueSummaryMetrics = NonNullable<
  RevenueSummaryRouteQuery["response"]["revenueSummary"]
>["metrics"];
type RevenueSummaryMetricSource = {
  readonly metrics: Pick<
    RevenueSummaryMetrics,
    "averagePaidPrice" | "clicks" | "commissionRevenue" | "conversions" | "grossOrderValue"
  >;
};

export function buildRevenueSummaryFilterFormData(filters: RevenueSummaryFilters) {
  const values = {
    currency: revenueFilterFormValue(filters.currency),
    from: revenueFilterFormValue(filters.from),
    network: revenueFilterFormValue(filters.network),
    to: revenueFilterFormValue(filters.to),
  };

  return {
    key: JSON.stringify([values.network, values.currency, values.from, values.to]),
    values,
  };
}

function revenueFilterFormValue(value: RevenueSummaryFilters["currency"]) {
  return value ?? "";
}

export function buildRevenueSummaryControls(
  filters: RevenueSummaryFilters,
  currentDate: Date | null = new Date(),
) {
  return {
    activeFilters: buildActiveFilterItems(filters),
    datePresetLinks: buildRevenueDatePresetLinks(filters, currentDate),
  };
}

export function buildRevenueDatePresetLinks(
  filters: Pick<RevenueSummaryFilters, "network" | "currency">,
  currentDate: Date | null = new Date(),
) {
  if (currentDate === null) {
    return [
      {
        label: "Clear dates",
        to: buildRevenueDatePresetSearchPath(filters, null, null),
      },
    ];
  }

  const baseDate = toLocalDateOnly(currentDate);
  const toDate = formatDate(baseDate);
  const monthStartDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const presets = [
    {
      label: "Last 7 days",
      from: formatDate(shiftDate(baseDate, -6)),
      to: toDate,
    },
    {
      label: "Last 30 days",
      from: formatDate(shiftDate(baseDate, -29)),
      to: toDate,
    },
    {
      label: "Month to date",
      from: formatDate(monthStartDate),
      to: toDate,
    },
    {
      label: "Clear dates",
      from: null,
      to: null,
    },
  ] as const;
  return presets
    .filter(({ from, to }) => !from || !to || from <= to)
    .map(({ label, from, to }) => ({
      label,
      to: buildRevenueDatePresetSearchPath(filters, from, to),
    }));
}

export function buildRevenueDashboardMetrics(summary: RevenueSummaryMetricSource, currency: string) {
  return {
    attribution: {
      clicks: formatCount(summary.metrics.clicks),
      conversions: formatCount(summary.metrics.conversions),
      conversionRate: formatConversionRate(summary.metrics.clicks, summary.metrics.conversions),
    },
    revenue: [
      {
        label: "Gross order value",
        value: formatCurrencyAmount(summary.metrics.grossOrderValue, currency),
      },
      {
        label: "Commission revenue",
        value: formatCurrencyAmount(summary.metrics.commissionRevenue, currency),
      },
      {
        label: "Average paid price",
        value: formatCurrencyAmount(summary.metrics.averagePaidPrice, currency),
      },
    ],
  };
}

function formatConversionRate(
  clicks: RevenueSummaryMetrics["clicks"],
  conversions: RevenueSummaryMetrics["conversions"],
) {
  if (clicks === null || conversions === null || clicks === 0) {
    return "Not available";
  }

  const percentage = Math.round((conversions / clicks) * 1_000) / 10;

  return `${percentage.toFixed(1).replace(/\.0$/, "")}%`;
}

function buildActiveFilterItems(filters: RevenueSummaryFilters) {
  return [
    ...(filters.network ? [{ label: "Network", value: filters.network }] : []),
    ...(filters.currency ? [{ label: "Currency", value: filters.currency }] : []),
    ...(filters.from || filters.to
      ? [
          {
            label: "Date range",
            value: `${filters.from ?? "Any start"} to ${filters.to ?? "Any end"}`,
          },
        ]
      : []),
  ];
}

function buildRevenueDatePresetSearchPath(
  filters: Pick<RevenueSummaryFilters, "network" | "currency">,
  from: string | null,
  to: string | null,
) {
  const search = new URLSearchParams();

  if (filters.network) {
    search.set("network", filters.network);
  }

  if (filters.currency) {
    search.set("currency", filters.currency);
  }

  if (from) {
    search.set("from", from);
  }

  if (to) {
    search.set("to", to);
  }

  const query = search.toString();

  return query ? `/commerce/revenue?${query}` : "/commerce/revenue";
}

function toLocalDateOnly(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDate(date: Date) {
  const localDate = toLocalDateOnly(date);
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, "0");
  const day = String(localDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function shiftDate(baseDate: Date, days: number) {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + days);

  return toLocalDateOnly(date);
}

function formatCount(value: RevenueSummaryMetrics["clicks"]) {
  return value === null ? "Not available" : String(value);
}

export function formatCurrencyAmount(
  value: RevenueSummaryMetrics["commissionRevenue"],
  currency: string,
) {
  if (value === null) {
    return "Not available";
  }

  return currency ? `${value} ${currency}` : value;
}

export function revenueSummaryFiltersFromUrl(url: URL): RevenueSummaryFilters {
  const currency = normalizeCurrencyFilter(url.searchParams.get("currency"));
  const from = normalizeDateFilter(url.searchParams.get("from"));
  const network = normalizeNetworkFilter(url.searchParams.get("network"));
  const to = normalizeDateFilter(url.searchParams.get("to"));

  return {
    ...(currency ? { currency } : {}),
    ...(from ? { from } : {}),
    ...(network ? { network } : {}),
    ...(to ? { to } : {}),
  };
}

export function hasInvertedRevenueDateRange(filters: RevenueSummaryFilters) {
  return Boolean(filters.from && filters.to && filters.from > filters.to);
}

function normalizeCurrencyFilter(value: string | null) {
  const normalized = value?.trim().toUpperCase();

  return normalized && /^[A-Z]{3}$/.test(normalized) ? normalized : undefined;
}

function normalizeDateFilter(value: string | null) {
  const normalized = value?.trim();

  if (!normalized || !DATE_FILTER_PATTERN.test(normalized)) {
    return undefined;
  }

  const [year, month, day] = normalized.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
    ? normalized
    : undefined;
}

function normalizeNetworkFilter(value: string | null) {
  const normalized = value?.trim().toLowerCase();

  return normalized && SUPPORTED_NETWORKS.has(normalized) ? normalized : undefined;
}
