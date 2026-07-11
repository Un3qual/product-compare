import { Suspense } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link, useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import revenueSummaryRouteQuery, {
  type RevenueSummaryRouteQuery
} from "../../../__generated__/RevenueSummaryRouteQuery.graphql";
import { useRoutePreloadedQuery } from "../../../relay/route-preload";
import { ResettableErrorBoundary } from "../../../relay/ResettableErrorBoundary";
import { FeedbackState } from "../../../ui/components/feedback/FeedbackState";
import { ContextRail } from "../../../ui/components/layout/ContextRail";
import { PageShell } from "../../../ui/components/layout/PageShell";
import { WorkspaceLayout } from "../../../ui/components/layout/WorkspaceLayout";
import { Button } from "../../../ui/primitives/Button";
import { TextField } from "../../../ui/primitives/TextField";
import { tokens } from "../../../ui/theme/tokens.stylex";
import { revenueSummaryLoader, type RevenueSummaryLoaderData } from "./loader";

type RevenueSummary = NonNullable<RevenueSummaryRouteQuery["response"]["revenueSummary"]>;
type RevenueSummaryMetric = {
  label: string;
  value: string;
};

const styles = create({
  filters: {
    alignItems: "end",
    backgroundColor: tokens.surfaceMuted,
    borderRadius: "var(--radius-4)",
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 1fr))",
    padding: "1rem"
  },
  metrics: {
    display: "grid",
    gap: "0.75rem",
    gridTemplateColumns: "repeat(auto-fit, minmax(11rem, 1fr))",
    margin: 0
  },
  metric: {
    backgroundColor: tokens.surfaceMuted,
    borderRadius: "var(--radius-3)",
    display: "grid",
    gap: "0.35rem",
    padding: "1rem"
  },
  metricValue: {
    fontSize: "1.2rem",
    fontWeight: 750,
    margin: 0
  }
});

export function RevenueSummaryRoute() {
  const loaderData = useLoaderData<typeof revenueSummaryLoader>() as RevenueSummaryLoaderData;

  return (
    <PageShell
      description="This preview summarizes recorded attribution data. A live conversion provider is not connected for this milestone."
      eyebrow="Commerce analytics"
      title="Revenue reporting preview"
    >
      <WorkspaceLayout
        context={
          <ContextRail
            description="Adjust the report scope without interrupting the metric reading path."
            label="Revenue controls"
          >
            <RevenueSummaryFilterForm
              key={revenueSummaryFilterKey(loaderData.filters)}
              filters={loaderData.filters}
            />
            <RevenueDatePresetLinks filters={loaderData.filters} />
            <ActiveRevenueFilters filters={loaderData.filters} />
          </ContextRail>
        }
        label="Revenue report"
      >
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
            <Suspense fallback={<FeedbackState kind="loading" title="Loading revenue summary..." />}>
              <RevenueSummaryPanel query={loaderData.query} />
            </Suspense>
          </ResettableErrorBoundary>
        )}
      </WorkspaceLayout>
    </PageShell>
  );
}

function RevenueSummaryFilterForm({
  filters
}: {
  filters: RevenueSummaryLoaderData["filters"];
}) {
  return (
    <form method="get" aria-label="Revenue filters" {...props(styles.filters)}>
      <label>
        Network
        <TextField
          autoComplete="off"
          defaultValue={filters.network ?? ""}
          name="network"
          type="text"
        />
      </label>
      <label>
        Currency
        <TextField
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
      <Button type="submit">Apply filters</Button>
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
      <dl {...props(styles.metrics)}>
        {metrics.map((metric) => (
          <div key={metric.label} {...props(styles.metric)}>
            <dt>{metric.label}</dt>
            <dd {...props(styles.metricValue)}>{metric.value}</dd>
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
  const monthStartDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);

  const presets = [
    {
      label: "Last 7 days",
      from: formatDate(shiftDate(baseDate, -6)),
      to: toDate
    },
    {
      label: "Last 30 days",
      from: formatDate(shiftDate(baseDate, -29)),
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

function toDateIsBefore(from: string, to: string) {
  return from > to;
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
