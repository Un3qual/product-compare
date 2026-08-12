import { useId, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import { StatusBadge } from "$ui/components/status/StatusBadge";
import { Button } from "$ui/primitives/Button";
import { Checkbox } from "$ui/primitives/Checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "$ui/primitives/Collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "$ui/primitives/Select";
import { Input } from "$ui/primitives/Input";
import { Label } from "$ui/primitives/Label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "$ui/primitives/Dialog";
import { tokens } from "$ui/theme/tokens.stylex";
import {
  getOfferDiscoveryFilterData,
  OFFER_DISCOVERY_SORT_OPTIONS,
  type OfferDiscoveryFilters,
  type OfferDiscoveryProductContext,
} from "./offer-discovery-filter-data";
import { offerDiscoveryResetPath } from "./paths";

export type { OfferDiscoveryProductContext } from "./offer-discovery-filter-data";

const styles = create({
  form: {
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: "minmax(0, 1fr)",
  },
  summary: {
    borderBlockEndColor: tokens.borderQuiet,
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
    display: "grid",
    gap: "0.8rem",
    paddingBlockEnd: "1rem",
  },
  summaryHeader: {
    alignItems: "start",
    display: "flex",
    gap: "1rem",
    justifyContent: "space-between",
  },
  summaryIdentity: {
    display: "grid",
    gap: "0.25rem",
  },
  eyebrow: {
    color: tokens.textSecondary,
    fontSize: "0.75rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    margin: 0,
    textTransform: "uppercase",
  },
  summaryTitle: {
    fontSize: "1.35rem",
    letterSpacing: "-0.025em",
    margin: 0,
  },
  summaryDescription: {
    color: tokens.textSecondary,
    lineHeight: 1.5,
    margin: 0,
  },
  actions: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "1rem",
  },
  advanced: {
    borderBlockStartColor: tokens.borderQuiet,
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "1px",
    paddingBlockStart: "0.25rem",
  },
  advancedFields: {
    display: "grid",
    gap: "0.85rem",
    paddingBlock: "0.5rem 0.25rem",
  },
  advancedFieldsClosed: {
    display: "none",
  },
  mobileRefine: {
    display: { default: "none", "@media (max-width: 62rem)": "block" },
    paddingBlockStart: "0.25rem",
  },
  mobileRefineButton: { width: "100%" },
  dialogContent: {
    maxWidth: "32rem",
  },
});

export function OfferDiscoveryFilterForm({ filters }: { filters: OfferDiscoveryFilters }) {
  const { formKey } = getOfferDiscoveryFilterData(filters);

  return <OfferDiscoveryFilterFields filters={filters} key={formKey} />;
}

function OfferDiscoveryFilterFields({ filters }: { filters: OfferDiscoveryFilters }) {
  const [advancedOpen, setAdvancedOpen] = useState(filters.merchantId !== null);
  const fieldPrefix = useId();
  const pageSizeId = `${fieldPrefix}-page-size`;
  const sortId = `${fieldPrefix}-sort`;
  const productId = `${fieldPrefix}-product-id`;
  const merchantId = `${fieldPrefix}-merchant-id`;

  return (
    <form
      action="/offers"
      aria-label="Offer discovery filters"
      method="get"
      {...props(styles.form)}
    >
      <label>
        <Checkbox defaultChecked={!filters.activeOnly} name="activeOnly" value="false" />
        Include inactive offers
      </label>
      <Label htmlFor={pageSizeId}>
        Page size
        <Input
          autoComplete="off"
          defaultValue={String(filters.first)}
          id={pageSizeId}
          min={1}
          name="first"
          type="number"
        />
      </Label>
      <Label htmlFor={sortId}>
        Sort
        <Select defaultValue={filters.sort} items={OFFER_DISCOVERY_SORT_OPTIONS} name="sort">
          <SelectTrigger id={sortId}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OFFER_DISCOVERY_SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Label>
      <Collapsible onOpenChange={setAdvancedOpen} open={advancedOpen} style={styles.advanced}>
        <CollapsibleTrigger render={<Button variant="link" />}>Advanced filters</CollapsibleTrigger>
        <CollapsibleContent
          keepMounted
          hidden={!advancedOpen}
          style={advancedOpen ? styles.advancedFields : styles.advancedFieldsClosed}
        >
          <Label htmlFor={productId}>
            Product ID
            <Input
              autoComplete="off"
              defaultValue={filters.productId ?? ""}
              id={productId}
              name="productId"
              type="text"
            />
          </Label>
          <Label htmlFor={merchantId}>
            Merchant ID
            <Input
              autoComplete="off"
              defaultValue={filters.merchantId ?? ""}
              id={merchantId}
              name="merchantId"
              type="text"
            />
          </Label>
        </CollapsibleContent>
      </Collapsible>
      <Button type="submit">Apply filters</Button>
    </form>
  );
}

export function MobileOfferDiscoveryFilters({ filters }: { filters: OfferDiscoveryFilters }) {
  return (
    <div data-slot="mobile-offer-refinement" {...props(styles.mobileRefine)}>
      <Dialog>
        <DialogTrigger render={<Button style={styles.mobileRefineButton} variant="secondary" />}>
          Refine offers
        </DialogTrigger>
        <DialogContent style={styles.dialogContent}>
          <DialogTitle>Refine offers</DialogTitle>
          <DialogDescription>
            Adjust availability, page size, ordering, and advanced product or merchant references.
          </DialogDescription>
          <OfferDiscoveryFilterForm filters={filters} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function OfferDiscoveryFilterSummary({
  filters,
  selectedProduct = null,
}: {
  filters: OfferDiscoveryFilters;
  selectedProduct?: OfferDiscoveryProductContext | null;
}) {
  const filterData = getOfferDiscoveryFilterData(filters, selectedProduct);

  return (
    <section aria-label="Active offer filters" data-slot="offer-scope" {...props(styles.summary)}>
      <header {...props(styles.summaryHeader)}>
        <div {...props(styles.summaryIdentity)}>
          <p {...props(styles.eyebrow)}>{filterData.scopeEyebrow}</p>
          <h2 {...props(styles.summaryTitle)}>{filterData.scopeTitle}</h2>
        </div>
        <StatusBadge tone={filterData.scopeBadge.tone}>{filterData.scopeBadge.label}</StatusBadge>
      </header>
      <p {...props(styles.summaryDescription)}>{filterData.scopeDescription}</p>
      <div {...props(styles.actions)}>
        {filterData.productDetailsPath ? (
          <Link to={filterData.productDetailsPath}>View product details</Link>
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
