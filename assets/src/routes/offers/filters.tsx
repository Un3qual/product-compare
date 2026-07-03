import { Fragment } from "react";
import { Link } from "react-router-dom";
import {
  DEFAULT_OFFERS_PAGE_SIZE,
  type OfferDiscoverySort,
  type OfferDiscoveryFilters
} from "./loader";
import { offerDiscoveryPath, offerDiscoveryResetPath } from "./paths";

const SORT_OPTIONS: Array<{ label: string; value: OfferDiscoverySort }> = [
  { label: "Default order", value: "default" },
  { label: "Price: low to high", value: "price_asc" },
  { label: "Price: high to low", value: "price_desc" },
  { label: "Merchant name", value: "merchant_name" }
];

export function OfferDiscoveryFilterForm({ filters }: { filters: OfferDiscoveryFilters }) {
  return (
    <form
      action="/offers"
      aria-label="Offer discovery filters"
      key={offerDiscoveryFilterFormKey(filters)}
      method="get"
    >
      <label>
        Product ID
        <input
          autoComplete="off"
          defaultValue={filters.productId ?? ""}
          name="productId"
          type="text"
        />
      </label>
      <label>
        Merchant ID
        <input
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
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <button type="submit">Apply filters</button>
    </form>
  );
}

function offerDiscoveryFilterFormKey(filters: OfferDiscoveryFilters) {
  return JSON.stringify([
    filters.productId,
    filters.merchantId,
    filters.activeOnly,
    filters.first,
    filters.sort
  ]);
}

export function OfferDiscoveryFilterSummary({ filters }: { filters: OfferDiscoveryFilters }) {
  return (
    <section aria-label="Active offer filters">
      <dl>
        {offerDiscoveryFilterSummaryItems(filters).map(({ label, value }) => (
          <Fragment key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </Fragment>
        ))}
      </dl>
      {hasNonDefaultOfferFilters(filters) ? (
        <p>
          <Link to={offerDiscoveryResetPath(filters)}>Reset filters</Link>
        </p>
      ) : null}
      {filters.merchantId ? (
        <p>
          <Link to={clearMerchantFilterPath(filters)}>Clear merchant filter</Link>
        </p>
      ) : null}
    </section>
  );
}

function offerDiscoveryFilterSummaryItems(filters: OfferDiscoveryFilters) {
  return [
    {
      label: "Product ID",
      value: filters.productId ?? "Not selected"
    },
    ...(filters.merchantId
      ? [
          {
            label: "Merchant ID",
            value: filters.merchantId
          }
        ]
      : []),
    {
      label: "Offer status",
      value: filters.activeOnly ? "Active offers only" : "All offers included"
    },
    {
      label: "Page size",
      value: String(filters.first)
    },
    {
      label: "Sort",
      value: offerDiscoverySortLabel(filters.sort)
    }
  ];
}

function hasNonDefaultOfferFilters(filters: OfferDiscoveryFilters) {
  return Boolean(
    filters.productId ||
      filters.merchantId ||
      filters.after ||
      !filters.activeOnly ||
      filters.first !== DEFAULT_OFFERS_PAGE_SIZE
  );
}

function clearMerchantFilterPath(filters: OfferDiscoveryFilters) {
  return offerDiscoveryPath({ ...filters, merchantId: null }, null);
}

function offerDiscoverySortLabel(sort: OfferDiscoverySort) {
  return SORT_OPTIONS.find((option) => option.value === sort)?.label ?? "Default order";
}
