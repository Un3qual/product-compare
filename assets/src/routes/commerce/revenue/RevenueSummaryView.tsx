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
        <ContextRail
          description="Filter recorded attribution by network, currency, or date range."
          label="Revenue controls"
        >
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
          {datePresetLinks.length > 0 ? (
            <ul aria-label="Revenue date presets">
              {datePresetLinks.map((preset) => (
                <li key={preset.label}>
                  <Link to={preset.to}>{preset.label}</Link>
                </li>
              ))}
            </ul>
          ) : null}
          {activeFilters.length === 0 ? (
            <p>Aggregate revenue summary</p>
          ) : (
            <ul aria-label="Active revenue filters">
              {activeFilters.map((filter) => (
                <li key={filter.label}>
                  <span>{filter.label}</span>
                  <span>{filter.value}</span>
                </li>
              ))}
            </ul>
          )}
        </ContextRail>
      }
      label="Revenue report"
    >
      {children}
    </WorkspaceLayout>
  );
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
