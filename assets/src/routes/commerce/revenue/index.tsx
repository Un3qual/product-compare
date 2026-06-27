import { Suspense } from "react";
import { Link, useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import revenueSummaryRouteQuery, {
  type RevenueSummaryRouteQuery
} from "../../../__generated__/RevenueSummaryRouteQuery.graphql";
import { useRoutePreloadedQuery } from "../../../relay/route-preload";
import { ResettableErrorBoundary } from "../../../relay/resettable-error-boundary";
import { revenueSummaryLoader, type RevenueSummaryLoaderData } from "./loader";

type RevenueSummary = NonNullable<RevenueSummaryRouteQuery["response"]["revenueSummary"]>;
type RevenueSummaryMetric = {
  label: string;
  value: string;
};

export function RevenueSummaryRoute() {
  const loaderData = useLoaderData<typeof revenueSummaryLoader>() as RevenueSummaryLoaderData;

  return (
    <section>
      <header>
        <h1>Revenue reporting</h1>
      </header>

      <RevenueSummaryFilterForm
        key={revenueSummaryFilterKey(loaderData.filters)}
        filters={loaderData.filters}
      />
      <RevenueDatePresetLinks filters={loaderData.filters} />
      <ActiveRevenueFilters filters={loaderData.filters} />

      {loaderData.status === "error" ? (
        <RevenueSummaryUnavailableFallback />
      ) : loaderData.status === "needsCurrency" ? (
        <RevenueSummaryCurrencyRequiredFallback />
      ) : loaderData.status === "invalidDateRange" ? (
        <RevenueSummaryInvalidDateRangeFallback />
      ) : (
        <ResettableErrorBoundary
          fallback={<RevenueSummaryUnavailableFallback />}
          resetToken={loaderData.query}
        >
          <Suspense fallback={<p role="status">Loading revenue summary...</p>}>
            <RevenueSummaryPanel query={loaderData.query} />
          </Suspense>
        </ResettableErrorBoundary>
      )}
    </section>
  );
}

function RevenueSummaryFilterForm({
  filters
}: {
  filters: RevenueSummaryLoaderData["filters"];
}) {
  return (
    <form method="get" aria-label="Revenue filters">
      <label>
        Network
        <input
          autoComplete="off"
          defaultValue={filters.network ?? ""}
          name="network"
          type="text"
        />
      </label>
      <label>
        Currency
        <input
          autoComplete="off"
          defaultValue={filters.currency ?? ""}
          maxLength={3}
          name="currency"
          type="text"
        />
      </label>
      <label>
        From
        <input defaultValue={filters.from ?? ""} name="from" type="date" />
      </label>
      <label>
        To
        <input defaultValue={filters.to ?? ""} name="to" type="date" />
      </label>
      <button type="submit">Apply filters</button>
      <Link to="/commerce/revenue">Clear filters</Link>
    </form>
  );
}

function RevenueDatePresetLinks({
  filters,
  currentDate = new Date()
}: {
  filters: Pick<RevenueSummaryLoaderData["filters"], "network" | "currency">;
  currentDate?: Date;
}) {
  const datePresets = buildRevenueDatePresetLinks(filters, currentDate);

  if (datePresets.length === 0) {
    return null;
  }

  return (
    <ul aria-label="Revenue date presets">
      {datePresets.map((preset) => (
        <li key={preset.label}>
          <Link to={preset.to}>{preset.label}</Link>
        </li>
      ))}
    </ul>
  );
}

function ActiveRevenueFilters({
  filters
}: {
  filters: RevenueSummaryLoaderData["filters"];
}) {
  const activeFilters = buildActiveFilterItems(filters);

  if (activeFilters.length === 0) {
    return <p>Aggregate revenue summary</p>;
  }

  return (
    <ul aria-label="Active revenue filters">
      {activeFilters.map((filter) => (
        <li key={filter.label}>
          <span>{filter.label}</span>
          <span>{filter.value}</span>
        </li>
      ))}
    </ul>
  );
}

function RevenueSummaryPanel({
  query
}: {
  query: Extract<RevenueSummaryLoaderData, { status: "ready" }>["query"];
}) {
  const queryRef = useRoutePreloadedQuery<RevenueSummaryRouteQuery>(
    revenueSummaryRouteQuery,
    query
  );
  const data = usePreloadedQuery<RevenueSummaryRouteQuery>(
    revenueSummaryRouteQuery,
    queryRef
  );

  if (!data.revenueSummary) {
    return <RevenueSummaryUnavailableFallback />;
  }

  return <RevenueSummaryMetrics summary={data.revenueSummary} />;
}

function RevenueSummaryMetrics({ summary }: { summary: RevenueSummary }) {
  const currency = summary.metrics.currency ?? summary.filters.currency ?? "";
  const metrics = buildRevenueSummaryMetrics(summary, currency);

  return (
    <section aria-labelledby="revenue-summary-heading">
      <h2 id="revenue-summary-heading">Summary</h2>
      {summary.suppression.suppressed ? (
        <p aria-live="polite" role="status">
          Revenue metrics are hidden until at least {summary.suppression.threshold} conversions
          match the current filters.
        </p>
      ) : null}
      <dl>
        {metrics.map((metric) => (
          <div key={metric.label}>
            <dt>{metric.label}</dt>
            <dd>{metric.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function RevenueSummaryUnavailableFallback() {
  return (
    <section role="alert">
      <p>Revenue summary unavailable.</p>
    </section>
  );
}

function RevenueSummaryCurrencyRequiredFallback() {
  return <p role="status">Enter a currency code to load revenue metrics.</p>;
}

function RevenueSummaryInvalidDateRangeFallback() {
  return <p role="status">Enter a start date on or before the end date to load revenue metrics.</p>;
}

function revenueSummaryFilterKey(filters: RevenueSummaryLoaderData["filters"]) {
  return [filters.network, filters.currency, filters.from, filters.to].join("|");
}

function buildActiveFilterItems(filters: RevenueSummaryLoaderData["filters"]) {
  return [
    filters.network ? { label: "Network", value: filters.network } : null,
    filters.currency ? { label: "Currency", value: filters.currency } : null,
    filters.from || filters.to
      ? {
          label: "Date range",
          value: `${filters.from ?? "Any start"} to ${filters.to ?? "Any end"}`
        }
      : null
  ].filter((filter): filter is { label: string; value: string } => filter !== null);
}

type RevenueDatePresetLink = {
  label: string;
  to: string;
};

export function buildRevenueDatePresetLinks(
  filters: Pick<RevenueSummaryLoaderData["filters"], "network" | "currency">,
  currentDate = new Date()
): RevenueDatePresetLink[] {
  const baseDate = toLocalDateOnly(currentDate);
  const toDate = formatDate(baseDate);
  const fromDateMinusDays = (days: number) => formatDate(shiftDate(baseDate, -days));
  const monthStartDate = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), 1));

  const presets = [
    {
      label: "Last 7 days",
      from: fromDateMinusDays(6),
      to: toDate
    },
    {
      label: "Last 30 days",
      from: fromDateMinusDays(29),
      to: toDate
    },
    {
      label: "Month to date",
      from: formatDate(monthStartDate),
      to: toDate
    },
    {
      label: "Clear dates",
      from: null,
      to: null
    }
  ] as const;

  const links: RevenueDatePresetLink[] = [];

  for (const { label, from, to } of presets) {
    if (from && to && toDateIsBefore(from, to)) {
      continue;
    }

    links.push({
      label,
      to: buildRevenueDatePresetSearchPath(filters, from, to)
    });
  }

  return links;
}

function buildRevenueDatePresetSearchPath(
  filters: Pick<RevenueSummaryLoaderData["filters"], "network" | "currency">,
  from: string | null,
  to: string | null
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

function toDateFormat(value: Date) {
  return value.toISOString().slice(0, 10);
}

function toDateIsBefore(from: string, to: string) {
  return from > to;
}

function toLocalDateOnly(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function formatDate(date: Date) {
  return toDateFormat(toLocalDateOnly(date));
}

function shiftDate(baseDate: Date, days: number) {
  return new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
}

function buildRevenueSummaryMetrics(
  summary: RevenueSummary,
  currency: string
): RevenueSummaryMetric[] {
  const suppressed = summary.suppression.suppressed;

  return [
    {
      label: "Clicks",
      value: suppressed ? "Hidden" : formatCount(summary.metrics.clicks)
    },
    {
      label: "Conversions",
      value: suppressed ? "Hidden" : formatCount(summary.metrics.conversions)
    },
    {
      label: "Gross order value",
      value: suppressed ? "Hidden" : formatCurrencyAmount(summary.metrics.grossOrderValue, currency)
    },
    {
      label: "Commission revenue",
      value: suppressed
        ? "Hidden"
        : formatCurrencyAmount(summary.metrics.commissionRevenue, currency)
    },
    {
      label: "Average paid price",
      value: suppressed ? "Hidden" : formatCurrencyAmount(summary.metrics.averagePaidPrice, currency)
    }
  ];
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
