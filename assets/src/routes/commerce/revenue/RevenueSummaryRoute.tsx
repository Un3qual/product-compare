import { Suspense, useEffect, useState } from "react";
import { useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import revenueSummaryRouteQuery, {
  type RevenueSummaryRouteQuery
} from "../../../__generated__/RevenueSummaryRouteQuery.graphql";
import { useRoutePreloadedQuery } from "../../../relay/route-preload";
import { ResettableErrorBoundary } from "../../../relay/ResettableErrorBoundary";
import { FeedbackState } from "../../../ui/components/feedback/FeedbackState";
import { PageShell } from "../../../ui/components/layout/PageShell";
import { revenueSummaryLoader, type RevenueSummaryLoaderData } from "./loader";
import {
  RevenueSummaryMetrics,
  RevenueSummaryView,
  type RevenueDatePresetLink,
  type RevenueSummaryMetric
} from "./RevenueSummaryView";

type RevenueSummary = NonNullable<RevenueSummaryRouteQuery["response"]["revenueSummary"]>;

export function RevenueSummaryRoute() {
  const loaderData = useLoaderData<typeof revenueSummaryLoader>() as RevenueSummaryLoaderData;
  const activeFilters = buildActiveFilterItems(loaderData.filters);
  const datePresetLinks = buildRevenueDatePresetLinks(
    loaderData.filters,
    useHydratedLocalDate()
  );

  return (
    <PageShell
      description="This preview summarizes recorded attribution data. A live conversion provider is not connected for this milestone."
      eyebrow="Commerce analytics"
      title="Revenue reporting preview"
    >
      <RevenueSummaryView
        activeFilters={activeFilters}
        datePresetLinks={datePresetLinks}
        filters={loaderData.filters}
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
      </RevenueSummaryView>
    </PageShell>
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

  return (
    <RevenueSummaryMetrics
      metrics={buildRevenueSummaryMetrics(
        data.revenueSummary,
        data.revenueSummary.metrics.currency ?? data.revenueSummary.filters.currency ?? ""
      )}
      suppression={data.revenueSummary.suppression}
    />
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

export function buildRevenueDatePresetLinks(
  filters: Pick<RevenueSummaryLoaderData["filters"], "network" | "currency">,
  currentDate: Date | null = new Date()
): RevenueDatePresetLink[] {
  if (currentDate === null) {
    return [
      {
        label: "Clear dates",
        to: buildRevenueDatePresetSearchPath(filters, null, null)
      }
    ];
  }

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

function useHydratedLocalDate() {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  return currentDate;
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
