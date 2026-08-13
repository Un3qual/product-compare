import type { ReactNode } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import { SummaryStrip } from "$ui/components/data/SummaryStrip";
import { ContextRail } from "$ui/components/layout/ContextRail";
import { WorkspaceLayout } from "$ui/components/layout/WorkspaceLayout";
import { Button } from "$ui/primitives/Button";
import { Input } from "$ui/primitives/Input";
import { tokens } from "$ui/theme/tokens.stylex";
import {
  buildRevenueSummaryFilterFormData,
  buildRevenueSummaryMetrics,
  buildRevenueSummaryControls,
  type RevenueSummaryFilters,
} from "./revenue-summary-view-data";

type RevenueControls = ReturnType<typeof buildRevenueSummaryControls>;
type RevenueFilterFormValues = ReturnType<typeof buildRevenueSummaryFilterFormData>["values"];
type RevenueMetrics = ReturnType<typeof buildRevenueSummaryMetrics>;

const REVENUE_FILTER_LABEL_IDS = {
  currency: "revenue-filter-currency-label",
  from: "revenue-filter-from-label",
  network: "revenue-filter-network-label",
  to: "revenue-filter-to-label",
} as const;

const styles = create({
  filterField: {
    display: "grid",
    gap: "0.35rem",
  },
  filters: {
    alignItems: "end",
    backgroundColor: tokens.surfaceMuted,
    borderRadius: "var(--pc-radius-large)",
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 1fr))",
    padding: "1rem",
  },
});

export function RevenueSummaryView({
  activeFilters,
  children,
  datePresetLinks,
  filters,
}: {
  activeFilters: RevenueControls["activeFilters"];
  children: ReactNode;
  datePresetLinks: RevenueControls["datePresetLinks"];
  filters: RevenueSummaryFilters;
}) {
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
  filters,
}: {
  activeFilters: RevenueControls["activeFilters"];
  datePresetLinks: RevenueControls["datePresetLinks"];
  filters: RevenueSummaryFilters;
}) {
  const filterFormData = buildRevenueSummaryFilterFormData(filters);

  return (
    <ContextRail
      description="Filter recorded attribution by network, currency, or date range."
      label="Revenue controls"
    >
      <RevenueSummaryFilterForm key={filterFormData.key} values={filterFormData.values} />
      <RevenueDatePresetList links={datePresetLinks} />
      <RevenueActiveFilterList filters={activeFilters} />
    </ContextRail>
  );
}

function RevenueSummaryFilterForm({
  values,
}: {
  values: RevenueFilterFormValues;
}) {
  return (
    <form method="get" aria-label="Revenue filters" {...props(styles.filters)}>
      <div {...props(styles.filterField)}>
        <span id={REVENUE_FILTER_LABEL_IDS.network}>Network</span>
        <Input
          aria-labelledby={REVENUE_FILTER_LABEL_IDS.network}
          autoComplete="off"
          defaultValue={values.network}
          name="network"
          type="text"
        />
      </div>
      <div {...props(styles.filterField)}>
        <span id={REVENUE_FILTER_LABEL_IDS.currency}>Currency</span>
        <Input
          aria-labelledby={REVENUE_FILTER_LABEL_IDS.currency}
          autoComplete="off"
          defaultValue={values.currency}
          maxLength={3}
          name="currency"
          type="text"
        />
      </div>
      <div {...props(styles.filterField)}>
        <span id={REVENUE_FILTER_LABEL_IDS.from}>From</span>
        <Input
          aria-labelledby={REVENUE_FILTER_LABEL_IDS.from}
          defaultValue={values.from}
          name="from"
          type="date"
        />
      </div>
      <div {...props(styles.filterField)}>
        <span id={REVENUE_FILTER_LABEL_IDS.to}>To</span>
        <Input
          aria-labelledby={REVENUE_FILTER_LABEL_IDS.to}
          defaultValue={values.to}
          name="to"
          type="date"
        />
      </div>
      <Button type="submit">Apply filters</Button>
      <Link to="/commerce/revenue">Clear filters</Link>
    </form>
  );
}

function RevenueDatePresetList({
  links,
}: {
  links: RevenueControls["datePresetLinks"];
}) {
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
  filters,
}: {
  filters: RevenueControls["activeFilters"];
}) {
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

export function RevenueSummaryMetrics({
  metrics,
}: {
  metrics: RevenueMetrics;
}) {
  return <SummaryStrip items={metrics} label="Summary" />;
}
