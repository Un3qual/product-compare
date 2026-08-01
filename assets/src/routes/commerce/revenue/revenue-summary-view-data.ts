export type RevenueSummaryFilters = {
  currency?: string | null;
  from?: string | null;
  network?: string | null;
  to?: string | null;
};

export type RevenueActiveFilter = { label: string; value: string };
export type RevenueDatePresetLink = { label: string; to: string };
export type RevenueSummaryMetric = { label: string; value: string };
export type RevenueSummaryFilterFormValues = {
  currency: string;
  from: string;
  network: string;
  to: string;
};

type RevenueSummaryMetricSource = {
  metrics: {
    averagePaidPrice?: string | null;
    clicks?: number | null;
    commissionRevenue?: string | null;
    conversions?: number | null;
    grossOrderValue?: string | null;
  };
};

export function buildRevenueSummaryFilterFormData(filters: RevenueSummaryFilters) {
  const values: RevenueSummaryFilterFormValues = {
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

function revenueFilterFormValue(value: string | null | undefined) {
  return value ?? "";
}

export function buildRevenueSummaryControls(
  filters: RevenueSummaryFilters,
  currentDate: Date | null = new Date(),
): {
  activeFilters: RevenueActiveFilter[];
  datePresetLinks: RevenueDatePresetLink[];
} {
  return {
    activeFilters: buildActiveFilterItems(filters),
    datePresetLinks: buildRevenueDatePresetLinks(filters, currentDate),
  };
}

export function buildRevenueDatePresetLinks(
  filters: Pick<RevenueSummaryFilters, "network" | "currency">,
  currentDate: Date | null = new Date(),
): RevenueDatePresetLink[] {
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
  const links: RevenueDatePresetLink[] = [];

  for (const { label, from, to } of presets) {
    if (from && to && from > to) {
      continue;
    }

    links.push({
      label,
      to: buildRevenueDatePresetSearchPath(filters, from, to),
    });
  }

  return links;
}

export function buildRevenueSummaryMetrics(
  summary: RevenueSummaryMetricSource,
  currency: string,
): RevenueSummaryMetric[] {
  return [
    {
      label: "Clicks",
      value: formatCount(summary.metrics.clicks),
    },
    {
      label: "Conversions",
      value: formatCount(summary.metrics.conversions),
    },
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
  ];
}

function buildActiveFilterItems(filters: RevenueSummaryFilters): RevenueActiveFilter[] {
  return [
    filters.network ? { label: "Network", value: filters.network } : null,
    filters.currency ? { label: "Currency", value: filters.currency } : null,
    filters.from || filters.to
      ? {
          label: "Date range",
          value: `${filters.from ?? "Any start"} to ${filters.to ?? "Any end"}`,
        }
      : null,
  ].filter((filter): filter is RevenueActiveFilter => filter !== null);
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

function formatCount(value: number | null | undefined) {
  return value === null || value === undefined ? "Not available" : String(value);
}

function formatCurrencyAmount(value: string | null | undefined, currency: string) {
  if (value === null || value === undefined) {
    return "Not available";
  }

  return currency ? `${value} ${currency}` : value;
}
