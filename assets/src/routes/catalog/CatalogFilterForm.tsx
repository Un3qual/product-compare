import { useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import { ActiveFilterChips } from "../../ui/components/filters/ActiveFilterChips";
import { Button } from "../../ui/primitives/Button";
import { TextField } from "../../ui/primitives/TextField";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "../../ui/primitives/Collapsible";
import type { BrowseProductsRouteQuery } from "../../__generated__/BrowseProductsRouteQuery.graphql";
import {
  CATALOG_PRODUCT_SORTS,
  MAX_CATALOG_SEARCH_QUERY_LENGTH,
  catalogProductSortFromValue,
  catalogProductSortLabel,
  type CatalogFilterMetadata,
  type CatalogFilters
} from "./filters";
import {
  catalogFiltersWithout,
  catalogFilterSummaryItems
} from "./filter-summary";
import {
  catalogFilterFormInitialTypeState,
  catalogFilterFormTypeSelection,
  hasInitiallyOpenCatalogAdvancedFilters
} from "./catalog-filter-form-state";
import { catalogBrowseFirstPagePath } from "./paths";
import { CatalogAdvancedFilters } from "./CatalogAdvancedFilters";

const BROWSE_PRODUCTS_PAGE_SIZES = [12, 24, 48] as const;
type ProductFilterMetadata = BrowseProductsRouteQuery["response"]["productFilterMetadata"];

const EMPTY_CATALOG_FILTERS: CatalogFilters = {
  useCaseTaxonIds: [],
  numeric: [],
  booleans: [],
  enums: []
};

const styles = create({
  form: {
    display: "grid",
    gap: "1rem",
    minWidth: 0
  },
  primary: {
    display: "grid",
    gap: "0.8rem",
    gridTemplateColumns: "minmax(0, 1fr)"
  },
  advanced: {
    display: "grid",
    gap: "1rem",
    paddingBlockStart: "0.5rem"
  },
  actions: {
    display: "flex",
    justifyContent: "end"
  }
});

export function CatalogFilterForm({
  compareSlugs = [],
  filters,
  metadata,
  pageSize
}: {
  compareSlugs?: readonly string[];
  filters: CatalogFilters;
  metadata: ProductFilterMetadata;
  pageSize: number;
}) {
  const [typeFilterState, setTypeFilterState] = useState(() =>
    catalogFilterFormInitialTypeState(filters)
  );
  const [advancedOpen, setAdvancedOpen] = useState(() =>
    hasInitiallyOpenCatalogAdvancedFilters(filters)
  );

  function handleTypeTaxonIdChange(typeTaxonId: string) {
    setTypeFilterState((previous) => catalogFilterFormTypeSelection(previous, typeTaxonId));
  }

  function handleIncludeTypeDescendantsChange(includeTypeDescendants: boolean) {
    setTypeFilterState((previous) => ({ ...previous, includeTypeDescendants }));
  }

  return (
    <form
      method="get"
      action="/products"
      aria-label="Filter products"
      {...props(styles.form)}
    >
      <div {...props(styles.primary)}>
        <SearchField query={filters.query} />
        <SortField sort={filters.sort} />
        <PageSizeField pageSize={pageSize} />
        <CompareSlugFields compareSlugs={compareSlugs} />
        <ProductTypeField
          metadata={metadata}
          selectedTypeTaxonId={typeFilterState.selectedTypeTaxonId}
          onTypeTaxonIdChange={handleTypeTaxonIdChange}
        />
        <IncludeDescendantsCheckbox
          includeTypeDescendants={typeFilterState.includeTypeDescendants}
          selectedTypeTaxonId={typeFilterState.selectedTypeTaxonId}
          onIncludeTypeDescendantsChange={handleIncludeTypeDescendantsChange}
        />
      </div>
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="soft">Advanced filters</Button>
        </CollapsibleTrigger>
        <CollapsibleContent
          forceMount
          hidden={!advancedOpen}
          {...props(styles.advanced)}
        >
          <CatalogAdvancedFilters filters={filters} metadata={metadata} />
        </CollapsibleContent>
      </Collapsible>
      <div {...props(styles.actions)}>
        <Button type="submit">Apply filters</Button>
      </div>
    </form>
  );
}

function SearchField({ query }: { query?: string }) {
  return (
    <label>
      Search products
      <TextField
        type="search"
        name="q"
        defaultValue={query ?? ""}
        maxLength={MAX_CATALOG_SEARCH_QUERY_LENGTH}
      />
    </label>
  );
}

function SortField({ sort }: { sort?: CatalogFilters["sort"] }) {
  const [selectedSort, setSelectedSort] = useState(sort ?? "ID_ASC");

  return (
    <label>
      Sort products
      <select
        name={selectedSort === "ID_ASC" ? undefined : "sort"}
        value={selectedSort}
        onChange={(event) =>
          setSelectedSort(catalogProductSortFromValue(event.currentTarget.value))
        }
      >
        {CATALOG_PRODUCT_SORTS.map((value) => (
          <option key={value} value={value}>
            {catalogProductSortLabel(value)}
          </option>
        ))}
      </select>
    </label>
  );
}

function CompareSlugFields({ compareSlugs }: { compareSlugs: readonly string[] }) {
  return (
    <>
      {compareSlugs.map((slug) => (
        <input key={slug} type="hidden" name="slug" value={slug} />
      ))}
    </>
  );
}

function PageSizeField({ pageSize }: { pageSize: number }) {
  return (
    <label>
      Products per page
      <select key={pageSize} name="first" defaultValue={String(pageSize)}>
        {BROWSE_PRODUCTS_PAGE_SIZES.map((size) => (
          <option key={size} value={String(size)}>
            {size}
          </option>
        ))}
      </select>
    </label>
  );
}

function ProductTypeField({
  metadata,
  selectedTypeTaxonId,
  onTypeTaxonIdChange
}: {
  metadata: ProductFilterMetadata;
  selectedTypeTaxonId: string;
  onTypeTaxonIdChange: (typeTaxonId: string) => void;
}) {
  return (
    <label>
      Product type
      <select
        name="typeTaxonId"
        value={selectedTypeTaxonId}
        onChange={(event) => onTypeTaxonIdChange(event.currentTarget.value)}
      >
        <option value="">All product types</option>
        {metadata.typeOptions.map((option) => (
          <option key={option.id} value={option.id} disabled={option.disabled && !option.selected}>
            {option.label} ({option.count})
          </option>
        ))}
      </select>
    </label>
  );
}

function IncludeDescendantsCheckbox({
  includeTypeDescendants,
  selectedTypeTaxonId,
  onIncludeTypeDescendantsChange
}: {
  includeTypeDescendants: boolean;
  selectedTypeTaxonId: string;
  onIncludeTypeDescendantsChange: (includeTypeDescendants: boolean) => void;
}) {
  const hasSelectedType = selectedTypeTaxonId !== "";

  return (
    <label>
      <input
        type="checkbox"
        name="includeTypeDescendants"
        value="1"
        checked={hasSelectedType && includeTypeDescendants}
        disabled={!hasSelectedType}
        onChange={(event) => onIncludeTypeDescendantsChange(event.currentTarget.checked)}
      />
      Include subcategories
    </label>
  );
}

export function CatalogActiveFilterSummary({
  compareSlugs = [],
  filters,
  metadata,
  pageSize
}: {
  compareSlugs?: readonly string[];
  filters: CatalogFilters;
  metadata: CatalogFilterMetadata;
  pageSize: number;
}) {
  const summaryItems = catalogFilterSummaryItems(metadata, filters);

  if (summaryItems.length === 0) {
    return null;
  }

  return (
    <section aria-label="Applied product filters">
      <ActiveFilterChips
        items={summaryItems.map((item) => ({
          key: item.key,
          label: item.label,
          removeControl: (
            <Link
              aria-label={`Remove ${item.label}`}
              to={catalogBrowseFirstPagePath(
                catalogFiltersWithout(filters, item.removal),
                pageSize,
                compareSlugs
              )}
            >
              Remove
            </Link>
          )
        }))}
      />
      <Link to={catalogBrowseFirstPagePath(EMPTY_CATALOG_FILTERS, pageSize, compareSlugs)}>
        Clear filters
      </Link>
    </section>
  );
}
