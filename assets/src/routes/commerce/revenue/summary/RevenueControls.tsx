import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import { ContextRail } from "$ui/components/layout/ContextRail";
import { Button } from "$ui/primitives/Button";
import { Input } from "$ui/primitives/Input";
import { tokens } from "$ui/theme/tokens.stylex";
import {
  buildRevenueSummaryFilterFormData,
  buildRevenueSummaryControls,
  type RevenueSummaryFilters,
} from "./revenue-summary-data";

type RevenueControlData = ReturnType<typeof buildRevenueSummaryControls>;
type RevenueFilterFormValues = ReturnType<typeof buildRevenueSummaryFilterFormData>["values"];

const LABEL_IDS = {
  currency: "revenue-filter-currency-label",
  from: "revenue-filter-from-label",
  network: "revenue-filter-network-label",
  to: "revenue-filter-to-label",
} as const;

const styles = create({
  band: {
    display: "grid",
    gap: "0.75rem",
  },
  field: {
    display: "grid",
    gap: "0.35rem",
  },
  form: {
    alignItems: "end",
    backgroundColor: tokens.surfaceMuted,
    borderRadius: "var(--pc-radius-large)",
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 1fr))",
    padding: "1rem",
  },
  list: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem 1rem",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  activeFilter: {
    display: "flex",
    gap: "0.35rem",
  },
});

export function RevenueControls({
  activeFilters,
  datePresetLinks,
  filters,
}: {
  activeFilters: RevenueControlData["activeFilters"];
  datePresetLinks: RevenueControlData["datePresetLinks"];
  filters: RevenueSummaryFilters;
}) {
  const filterFormData = buildRevenueSummaryFilterFormData(filters);

  return (
    <section aria-label="Revenue controls" {...props(styles.band)}>
      <ContextRail
        description="Filter recorded attribution by network, currency, or date range."
        label="Revenue controls"
      >
        <RevenueFilterForm key={filterFormData.key} values={filterFormData.values} />
        <RevenueDatePresetList links={datePresetLinks} />
        <RevenueActiveFilterList filters={activeFilters} />
      </ContextRail>
    </section>
  );
}

function RevenueFilterForm({ values }: { values: RevenueFilterFormValues }) {
  return (
    <form aria-label="Revenue filters" method="get" {...props(styles.form)}>
      <div {...props(styles.field)}>
        <span id={LABEL_IDS.network}>Network</span>
        <Input
          aria-labelledby={LABEL_IDS.network}
          autoComplete="off"
          defaultValue={values.network}
          name="network"
          type="text"
        />
      </div>
      <div {...props(styles.field)}>
        <span id={LABEL_IDS.currency}>Currency</span>
        <Input
          aria-labelledby={LABEL_IDS.currency}
          autoComplete="off"
          defaultValue={values.currency}
          maxLength={3}
          name="currency"
          type="text"
        />
      </div>
      <div {...props(styles.field)}>
        <span id={LABEL_IDS.from}>From</span>
        <Input
          aria-labelledby={LABEL_IDS.from}
          defaultValue={values.from}
          name="from"
          type="date"
        />
      </div>
      <div {...props(styles.field)}>
        <span id={LABEL_IDS.to}>To</span>
        <Input aria-labelledby={LABEL_IDS.to} defaultValue={values.to} name="to" type="date" />
      </div>
      <Button type="submit">Apply filters</Button>
      <Link to="/commerce/revenue">Clear filters</Link>
    </form>
  );
}

function RevenueDatePresetList({ links }: { links: RevenueControlData["datePresetLinks"] }) {
  if (links.length === 0) {
    return null;
  }

  return (
    <ul aria-label="Revenue date presets" {...props(styles.list)}>
      {links.map((preset) => (
        <li key={preset.label}>
          <Link to={preset.to}>{preset.label}</Link>
        </li>
      ))}
    </ul>
  );
}

function RevenueActiveFilterList({ filters }: { filters: RevenueControlData["activeFilters"] }) {
  if (filters.length === 0) {
    return <p>Aggregate revenue summary</p>;
  }

  return (
    <ul aria-label="Active revenue filters" {...props(styles.list)}>
      {filters.map((filter) => (
        <li key={filter.label} {...props(styles.activeFilter)}>
          <span>{filter.label}</span>
          <span>{filter.value}</span>
        </li>
      ))}
    </ul>
  );
}
