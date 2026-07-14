import { Fragment } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import { Button } from "../../ui/primitives/Button";
import { TextField } from "../../ui/primitives/TextField";
import { tokens } from "../../ui/theme/tokens.stylex";
import {
  getOfferDiscoveryFilterData,
  OFFER_DISCOVERY_SORT_OPTIONS,
  type OfferDiscoveryFilters,
  type OfferDiscoveryProductContext
} from "./offer-discovery-filter-data";
import { offerDiscoveryResetPath } from "./paths";

export type { OfferDiscoveryProductContext } from "./offer-discovery-filter-data";

const styles = create({
  form: {
    display: "grid",
    gap: "0.85rem",
    gridTemplateColumns: "minmax(0, 1fr)"
  },
  summary: {
    borderBlockEndColor: tokens.borderQuiet,
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
    display: "grid",
    gap: "0.75rem",
    paddingBlockEnd: "1rem"
  },
  summaryList: {
    display: "grid",
    gap: "0.5rem 1.5rem",
    gridTemplateColumns: "max-content minmax(0, 1fr)",
    margin: 0
  },
  summaryValue: {
    color: tokens.textSecondary,
    margin: 0
  },
  actions: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "1rem"
  }
});

export function OfferDiscoveryFilterForm({ filters }: { filters: OfferDiscoveryFilters }) {
  const { formKey } = getOfferDiscoveryFilterData(filters);

  return (
    <form
      action="/offers"
      aria-label="Offer discovery filters"
      key={formKey}
      method="get"
      {...props(styles.form)}
    >
      <label>
        Product ID
        <TextField
          autoComplete="off"
          defaultValue={filters.productId ?? ""}
          name="productId"
          type="text"
        />
      </label>
      <label>
        Merchant ID
        <TextField
          autoComplete="off"
          defaultValue={filters.merchantId ?? ""}
          name="merchantId"
          type="text"
        />
      </label>
      <label>
        <input
          defaultChecked={!filters.activeOnly}
          name="activeOnly"
          type="checkbox"
          value="false"
        />
        Include inactive offers
      </label>
      <label>
        Page size
        <input
          autoComplete="off"
          defaultValue={String(filters.first)}
          min={1}
          name="first"
          type="number"
        />
      </label>
      <label>
        Sort
        <select defaultValue={filters.sort} name="sort">
          {OFFER_DISCOVERY_SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit">Apply filters</Button>
    </form>
  );
}

export function OfferDiscoveryFilterSummary({
  filters,
  selectedProduct = null
}: {
  filters: OfferDiscoveryFilters;
  selectedProduct?: OfferDiscoveryProductContext | null;
}) {
  const filterData = getOfferDiscoveryFilterData(filters, selectedProduct);

  return (
    <section aria-label="Active offer filters" {...props(styles.summary)}>
      <dl {...props(styles.summaryList)}>
        {filterData.summaryItems.map(({ label, value }) => (
          <Fragment key={label}>
            <dt>{label}</dt>
            <dd {...props(styles.summaryValue)}>{value}</dd>
          </Fragment>
        ))}
      </dl>
      <div {...props(styles.actions)}>
        {filterData.productDetailsPath ? (
          <Link to={filterData.productDetailsPath}>
            View product details
          </Link>
        ) : null}
        {filterData.showReset ? (
          <Link to={offerDiscoveryResetPath(filters)}>Reset filters</Link>
        ) : null}
        {filterData.clearMerchantFilterPath ? (
          <Link to={filterData.clearMerchantFilterPath}>Clear merchant filter</Link>
        ) : null}
      </div>
    </section>
  );
}
