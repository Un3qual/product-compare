import { useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router";
import { ActiveFilterChips } from "$ui/components/filters/ActiveFilterChips";
import { Button } from "$ui/primitives/Button";
import { Checkbox } from "$ui/primitives/Checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "$ui/primitives/Select";
import { Input } from "$ui/primitives/Input";
import { Label } from "$ui/primitives/Label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "$ui/primitives/Collapsible";
import type { BrowseRouteQuery } from "$generated/BrowseRouteQuery.graphql";
import {
  CATALOG_PRODUCT_SORTS,
  MAX_CATALOG_SEARCH_QUERY_LENGTH,
  catalogProductSortFromValue,
  catalogProductSortLabel,
  catalogProductSortParam,
  type CatalogFilterMetadata,
  type CatalogFilters,
  type CatalogProductSort,
} from "./filter-state";
import { catalogFiltersWithout, catalogFilterSummaryItems } from "./filter-summary";
import {
  catalogFilterFormInitialTypeState,
  catalogFilterFormTypeSelection,
  hasInitiallyOpenCatalogAdvancedFilters,
} from "./catalog-filter-form-state";
import { catalogBrowseFirstPagePath } from "../paths";
import { CatalogAdvancedFilters } from "./CatalogAdvancedFilters";

const BROWSE_PRODUCTS_PAGE_SIZES = [12, 24, 48] as const;
type ProductFilterMetadata = BrowseRouteQuery["response"]["productFilterMetadata"];

const EMPTY_CATALOG_FILTERS = {
  useCaseTaxonIds: [],
  numeric: [],
  booleans: [],
  enums: [],
} satisfies CatalogFilters;

const styles = create({
  form: {
    display: "grid",
    gap: "1rem",
    minWidth: 0,
  },
  primary: {
    display: "grid",
    gap: "0.8rem",
    gridTemplateColumns: "minmax(0, 1fr)",
  },
  advanced: {
    display: "grid",
    gap: "1rem",
    paddingBlockStart: "0.5rem",
  },
  actions: {
    display: "flex",
    justifyContent: "end",
  },
});

export function CatalogFilterForm({
  compareSlugs = [],
  filters,
  metadata,
  pageSize,
}: {
  compareSlugs?: readonly string[];
  filters: CatalogFilters;
  metadata: ProductFilterMetadata;
  pageSize: number;
}) {
  const [typeFilterState, setTypeFilterState] = useState(() =>
    catalogFilterFormInitialTypeState(filters),
  );
  const [advancedOpen, setAdvancedOpen] = useState(() =>
    hasInitiallyOpenCatalogAdvancedFilters(filters),
  );
  const [query, setQuery] = useState(filters.query ?? "");
  const [explicitSort, setExplicitSort] = useState<CatalogProductSort | undefined>(() =>
    catalogProductSortParam(filters),
  );
  const sort: CatalogProductSort =
    explicitSort ?? (hasCatalogSearchQuery(query) ? "RELEVANCE" : "ID_ASC");

  function handleTypeTaxonIdChange(typeTaxonId: string) {
    setTypeFilterState((previous) => catalogFilterFormTypeSelection(previous, typeTaxonId));
  }

  function handleIncludeTypeDescendantsChange(includeTypeDescendants: boolean) {
    setTypeFilterState((previous) => ({ ...previous, includeTypeDescendants }));
  }

  function handleQueryChange(nextQuery: string) {
    const hasQuery = hasCatalogSearchQuery(nextQuery);

    setQuery(nextQuery);

    if (!hasQuery) {
      setExplicitSort((previous) => (previous === "RELEVANCE" ? undefined : previous));
    }
  }

  return (
    <form method="get" action="/products" aria-label="Filter products" {...props(styles.form)}>
      <div {...props(styles.primary)}>
        <SearchField query={query} onQueryChange={handleQueryChange} />
        <SortField query={query} sort={sort} onSortChange={setExplicitSort} />
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
        <CollapsibleTrigger render={<Button variant="link" />}>Advanced filters</CollapsibleTrigger>
        <CollapsibleContent keepMounted hidden={!advancedOpen} style={styles.advanced}>
          <CatalogAdvancedFilters filters={filters} metadata={metadata} />
        </CollapsibleContent>
      </Collapsible>
      <div {...props(styles.actions)}>
        <Button type="submit">Apply filters</Button>
      </div>
    </form>
  );
}

function SearchField({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (query: string) => void;
}) {
  return (
    <Label>
      Search products
      <Input
        type="search"
        name="q"
        value={query}
        onChange={(event) => onQueryChange(event.currentTarget.value)}
        maxLength={MAX_CATALOG_SEARCH_QUERY_LENGTH}
      />
    </Label>
  );
}

function SortField({
  query,
  sort,
  onSortChange,
}: {
  query: string;
  sort: CatalogProductSort;
  onSortChange: (sort: CatalogProductSort) => void;
}) {
  const hasQuery = hasCatalogSearchQuery(query);
  const availableSorts = hasQuery
    ? CATALOG_PRODUCT_SORTS
    : CATALOG_PRODUCT_SORTS.filter((value) => value !== "RELEVANCE");
  const sortParam = catalogProductSortParam({
    query: hasQuery ? query : undefined,
    sort,
  });
  const options = availableSorts.map((value) => ({
    label: catalogProductSortLabel(value),
    value,
  }));

  return (
    <Label>
      Sort products
      <Select
        items={options}
        name={sortParam ? "sort" : undefined}
        onValueChange={(value) => onSortChange(catalogProductSortFromValue(value ?? ""))}
        value={sort}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Label>
  );
}

function hasCatalogSearchQuery(query: string) {
  return query.trim() !== "";
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
  const options = BROWSE_PRODUCTS_PAGE_SIZES.map((size) => ({
    label: String(size),
    value: String(size),
  }));

  return (
    <Label>
      Products per page
      <Select items={options} key={pageSize} name="first" defaultValue={String(pageSize)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Label>
  );
}

function ProductTypeField({
  metadata,
  selectedTypeTaxonId,
  onTypeTaxonIdChange,
}: {
  metadata: ProductFilterMetadata;
  selectedTypeTaxonId: string;
  onTypeTaxonIdChange: (typeTaxonId: string) => void;
}) {
  const options = [
    { disabled: false, label: "All product types", value: "" },
    ...metadata.typeOptions.map((option) => ({
      disabled: option.disabled && !option.selected,
      label: `${option.label} (${option.count})`,
      value: option.id,
    })),
  ];

  return (
    <Label>
      Product type
      <Select
        items={options}
        name="typeTaxonId"
        onValueChange={(value) => onTypeTaxonIdChange(value ?? "")}
        value={selectedTypeTaxonId}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem disabled={option.disabled} key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Label>
  );
}

function IncludeDescendantsCheckbox({
  includeTypeDescendants,
  selectedTypeTaxonId,
  onIncludeTypeDescendantsChange,
}: {
  includeTypeDescendants: boolean;
  selectedTypeTaxonId: string;
  onIncludeTypeDescendantsChange: (includeTypeDescendants: boolean) => void;
}) {
  const hasSelectedType = selectedTypeTaxonId !== "";

  return (
    <label>
      <Checkbox
        name="includeTypeDescendants"
        value="1"
        checked={hasSelectedType && includeTypeDescendants}
        disabled={!hasSelectedType}
        onCheckedChange={(checked) => onIncludeTypeDescendantsChange(checked === true)}
      />
      Include subcategories
    </label>
  );
}

export function CatalogActiveFilterSummary({
  compareSlugs = [],
  filters,
  metadata,
  pageSize,
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
                compareSlugs,
              )}
            >
              Remove
            </Link>
          ),
        }))}
      />
      <Link to={catalogBrowseFirstPagePath(EMPTY_CATALOG_FILTERS, pageSize, compareSlugs)}>
        Clear filters
      </Link>
    </section>
  );
}
