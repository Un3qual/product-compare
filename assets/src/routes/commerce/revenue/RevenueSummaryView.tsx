import type { ReactElement, ReactNode } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import { SummaryStrip } from "../../../ui/components/data/SummaryStrip";
import { ContextRail } from "../../../ui/components/layout/ContextRail";
import { WorkspaceLayout } from "../../../ui/components/layout/WorkspaceLayout";
import { Button } from "../../../ui/primitives/Button";
import { TextField } from "../../../ui/primitives/TextField";
import { tokens } from "../../../ui/theme/tokens.stylex";
import type { RevenueSummaryLoaderData } from "./loader";

export type RevenueActiveFilter = { label: string; value: string };
export type RevenueDatePresetLink = { label: string; to: string };
export type RevenueSummaryMetric = { label: string; value: string };

type RevenueFilters = RevenueSummaryLoaderData["filters"];

const REVENUE_FILTER_IDS = {
  currency: "revenue-filter-currency",
  from: "revenue-filter-from",
  network: "revenue-filter-network",
  to: "revenue-filter-to"
} as const;

const styles = create({
  filters: {
    alignItems: "end",
    backgroundColor: tokens.surfaceMuted,
    borderRadius: "var(--pc-radius-large)",
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 1fr))",
    padding: "1rem"
  }
});

export function RevenueSummaryView({
  activeFilters,
  children,
  datePresetLinks,
  filters
}: {
  activeFilters: readonly RevenueActiveFilter[];
  children: ReactNode;
  datePresetLinks: readonly RevenueDatePresetLink[];
  filters: RevenueSummaryLoaderData["filters"];
}): ReactElement {
  return (
    <WorkspaceLayout
      context={
        <RevenueSummaryControls
          activeFilters={activeFilters}
          datePresetLinks={datePresetLinks}
          filters={filters}
        />
      }
      label="Revenue report"
    >
      {children}
    </WorkspaceLayout>
  );
}

function RevenueSummaryControls({
  activeFilters,
  datePresetLinks,
  filters
}: {
  activeFilters: readonly RevenueActiveFilter[];
  datePresetLinks: readonly RevenueDatePresetLink[];
  filters: RevenueFilters;
}): ReactElement {
  return (
    <ContextRail
      description="Filter recorded attribution by network, currency, or date range."
      label="Revenue controls"
    >
      <RevenueSummaryFilterForm key={revenueSummaryFilterKey(filters)} filters={filters} />
      <RevenueDatePresetList links={datePresetLinks} />
      <RevenueActiveFilterList filters={activeFilters} />
    </ContextRail>
  );
}

function RevenueSummaryFilterForm({ filters }: { filters: RevenueFilters }): ReactElement {
  return (
    <form method="get" aria-label="Revenue filters" {...props(styles.filters)}>
      <label htmlFor={REVENUE_FILTER_IDS.network}>
        Network
        <TextField
          autoComplete="off"
          defaultValue={filters.network ?? ""}
          id={REVENUE_FILTER_IDS.network}
          name="network"
          type="text"
        />
      </label>
      <label htmlFor={REVENUE_FILTER_IDS.currency}>
        Currency
        <TextField
          autoComplete="off"
          defaultValue={filters.currency ?? ""}
          id={REVENUE_FILTER_IDS.currency}
          maxLength={3}
          name="currency"
          type="text"
        />
      </label>
      <label htmlFor={REVENUE_FILTER_IDS.from}>
        From
        <input
          defaultValue={filters.from ?? ""}
          id={REVENUE_FILTER_IDS.from}
          name="from"
          type="date"
        />
      </label>
      <label htmlFor={REVENUE_FILTER_IDS.to}>
        To
        <input
          defaultValue={filters.to ?? ""}
          id={REVENUE_FILTER_IDS.to}
          name="to"
          type="date"
        />
      </label>
      <Button type="submit">Apply filters</Button>
      <Link to="/commerce/revenue">Clear filters</Link>
    </form>
  );
}

function RevenueDatePresetList({
  links
}: {
  links: readonly RevenueDatePresetLink[];
}): ReactElement | null {
  if (links.length === 0) {
    return null;
  }

  return (
    <ul aria-label="Revenue date presets">
      {links.map((preset) => (
        <li key={preset.label}>
          <Link to={preset.to}>{preset.label}</Link>
        </li>
      ))}
    </ul>
  );
}

function RevenueActiveFilterList({
  filters
}: {
  filters: readonly RevenueActiveFilter[];
}): ReactElement {
  if (filters.length === 0) {
    return <p>Aggregate revenue summary</p>;
  }

  return (
    <ul aria-label="Active revenue filters">
      {filters.map((filter) => (
        <li key={filter.label}>
          <span>{filter.label}</span>
          <span>{filter.value}</span>
        </li>
      ))}
    </ul>
  );
}

function revenueSummaryFilterKey(filters: RevenueFilters) {
  return [filters.network, filters.currency, filters.from, filters.to].join("|");
}

export function RevenueSummaryMetrics({
  metrics,
  suppression
}: {
  metrics: readonly RevenueSummaryMetric[];
  suppression: { suppressed: boolean; threshold: number };
}): ReactElement {
  return (
    <>
      {suppression.suppressed ? (
        <p aria-live="polite" role="status">
          Revenue metrics are hidden until at least {suppression.threshold} conversions match the
          current filters.
        </p>
      ) : null}
      <SummaryStrip items={metrics} label="Summary" />
    </>
  );
}
