import { Fragment } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import { Button } from "../../ui/primitives/button";
import { TextField } from "../../ui/primitives/text-field";
import { tokens } from "../../ui/theme/tokens.stylex";
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

const styles = create({
  form: {
    alignItems: "end",
    backgroundColor: tokens.surfaceMuted,
    borderRadius: "var(--radius-4)",
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 1fr))",
    padding: "1.25rem"
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

export interface OfferDiscoveryProductContext {
  brand: {
    name: string;
  } | null;
  id: string;
  name: string;
  slug: string;
}

export function OfferDiscoveryFilterForm({ filters }: { filters: OfferDiscoveryFilters }) {
  return (
    <form
      action="/offers"
      aria-label="Offer discovery filters"
      key={offerDiscoveryFilterFormKey(filters)}
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
          {SORT_OPTIONS.map((option) => (
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

function offerDiscoveryFilterFormKey(filters: OfferDiscoveryFilters) {
  return JSON.stringify([
    filters.productId,
    filters.merchantId,
    filters.activeOnly,
    filters.first,
    filters.sort
  ]);
}

export function OfferDiscoveryFilterSummary({
  filters,
  selectedProduct = null
}: {
  filters: OfferDiscoveryFilters;
  selectedProduct?: OfferDiscoveryProductContext | null;
}) {
  return (
    <section aria-label="Active offer filters" {...props(styles.summary)}>
      <dl {...props(styles.summaryList)}>
        {offerDiscoveryFilterSummaryItems(filters, selectedProduct).map(({ label, value }) => (
          <Fragment key={label}>
            <dt>{label}</dt>
            <dd {...props(styles.summaryValue)}>{value}</dd>
          </Fragment>
        ))}
      </dl>
      <div {...props(styles.actions)}>
        {selectedProduct ? (
          <Link to={`/products/${encodeURIComponent(selectedProduct.slug)}`}>
            View product details
          </Link>
        ) : null}
        {hasNonDefaultOfferFilters(filters) ? (
          <Link to={offerDiscoveryResetPath(filters)}>Reset filters</Link>
        ) : null}
        {filters.merchantId ? (
          <Link to={clearMerchantFilterPath(filters)}>Clear merchant filter</Link>
        ) : null}
      </div>
    </section>
  );
}

function offerDiscoveryFilterSummaryItems(
  filters: OfferDiscoveryFilters,
  selectedProduct: OfferDiscoveryProductContext | null
) {
  return [
    ...selectedProductSummaryItems(filters, selectedProduct),
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

function selectedProductSummaryItems(
  filters: OfferDiscoveryFilters,
  selectedProduct: OfferDiscoveryProductContext | null
) {
  if (!selectedProduct) {
    return [
      {
        label: "Product ID",
        value: filters.productId ?? "Not selected"
      }
    ];
  }

  return [
    {
      label: "Product",
      value: selectedProduct.name
    },
    ...(selectedProduct.brand
      ? [
          {
            label: "Brand",
            value: selectedProduct.brand.name
          }
        ]
      : [])
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
