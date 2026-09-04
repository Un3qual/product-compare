import { create, props } from "@stylexjs/stylex";
import { useId } from "react";
import { Link } from "react-router";
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

const styles = create({
  band: {
    backgroundColor: tokens.surfaceMuted,
    borderColor: tokens.borderQuiet,
    borderRadius: "var(--pc-radius-large)",
    borderStyle: "solid",
    borderWidth: "1px",
    display: "grid",
    gap: "0.65rem",
    maxWidth: "100%",
    minWidth: 0,
    padding: "0.75rem",
  },
  field: {
    display: "grid",
    gap: "0.35rem",
  },
  form: {
    alignItems: "end",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.6rem",
  },
  textField: {
    width: "8rem",
  },
  dateField: {
    width: "9.5rem",
  },
  supporting: {
    alignItems: "baseline",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.4rem 1rem",
  },
  list: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.35rem 0.85rem",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  activeFilter: {
    display: "flex",
    gap: "0.35rem",
  },
  secondary: {
    color: tokens.textSecondary,
    fontSize: "0.8rem",
    margin: 0,
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
      <RevenueFilterForm key={filterFormData.key} values={filterFormData.values} />
      <div {...props(styles.supporting)}>
        <RevenueDatePresetList links={datePresetLinks} />
        <RevenueActiveFilterList filters={activeFilters} />
      </div>
    </section>
  );
}

function RevenueFilterForm({ values }: { values: RevenueFilterFormValues }) {
  const labelPrefix = useId();
  const labelIds = {
    currency: `${labelPrefix}-currency`,
    from: `${labelPrefix}-from`,
    network: `${labelPrefix}-network`,
    to: `${labelPrefix}-to`,
  };

  return (
    <form aria-label="Revenue filters" method="get" {...props(styles.form)}>
      <div {...props(styles.field, styles.textField)}>
        <span id={labelIds.network}>Network</span>
        <Input
          aria-labelledby={labelIds.network}
          autoComplete="off"
          defaultValue={values.network}
          name="network"
          type="text"
        />
      </div>
      <div {...props(styles.field, styles.textField)}>
        <span id={labelIds.currency}>Currency</span>
        <Input
          aria-labelledby={labelIds.currency}
          autoComplete="off"
          defaultValue={values.currency}
          maxLength={3}
          name="currency"
          type="text"
        />
      </div>
      <div {...props(styles.field, styles.dateField)}>
        <span id={labelIds.from}>From</span>
        <Input aria-labelledby={labelIds.from} defaultValue={values.from} name="from" type="date" />
      </div>
      <div {...props(styles.field, styles.dateField)}>
        <span id={labelIds.to}>To</span>
        <Input aria-labelledby={labelIds.to} defaultValue={values.to} name="to" type="date" />
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
    return <p {...props(styles.secondary)}>Aggregate revenue summary</p>;
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
