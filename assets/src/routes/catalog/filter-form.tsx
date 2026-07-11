import { useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import { Button } from "../../ui/primitives/button";
import { TextField } from "../../ui/primitives/text-field";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "../../ui/primitives/collapsible";
import type { BrowseProductsRouteQuery } from "../../__generated__/BrowseProductsRouteQuery.graphql";
import {
  CATALOG_PRODUCT_SORTS,
  MAX_CATALOG_SEARCH_QUERY_LENGTH,
  catalogProductSortLabel,
  type CatalogBooleanFilter,
  type CatalogEnumFilter,
  type CatalogFilterMetadata,
  type CatalogFilters,
  type CatalogNumericFilter
} from "./filters";
import {
  catalogFiltersWithout,
  catalogFilterSummaryItems
} from "./filter-summary";
import { catalogBrowseFirstPagePath } from "./paths";

const BROWSE_PRODUCTS_PAGE_SIZES = [12, 24, 48] as const;
type ProductFilterMetadata = BrowseProductsRouteQuery["response"]["productFilterMetadata"];

const EMPTY_CATALOG_FILTERS: CatalogFilters = {
  useCaseTaxonIds: [],
  numeric: [],
  booleans: [],
  enums: []
};

const styles = stylex.create({
  form: {
    backgroundColor: "var(--pc-surface-muted)",
    borderColor: "var(--pc-border-quiet)",
    borderRadius: "var(--radius-4)",
    borderStyle: "solid",
    borderWidth: "1px",
    display: "grid",
    gap: "1rem",
    padding: "1rem"
  },
  primary: {
    alignItems: "end",
    display: "grid",
    gap: "0.8rem",
    gridTemplateColumns: "repeat(auto-fit, minmax(11rem, 1fr))"
  },
  advancedHeader: {
    display: "flex",
    justifyContent: "space-between"
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
  const [selectedTypeTaxonId, setSelectedTypeTaxonId] = useState(filters.typeTaxonId ?? "");
  const [includeTypeDescendants, setIncludeTypeDescendants] = useState(
    Boolean(filters.typeTaxonId && filters.includeTypeDescendants)
  );
  const [advancedOpen, setAdvancedOpen] = useState(true);

  function handleTypeTaxonIdChange(typeTaxonId: string) {
    const hadSelectedTypeTaxon = selectedTypeTaxonId !== "";

    setSelectedTypeTaxonId(typeTaxonId);

    if (typeTaxonId === "") {
      setIncludeTypeDescendants(false);
    } else if (!hadSelectedTypeTaxon) {
      setIncludeTypeDescendants(true);
    }
  }

  return (
    <form
      method="get"
      action="/products"
      aria-label="Filter products"
      {...stylex.props(styles.form)}
    >
      <div {...stylex.props(styles.primary)}>
        <SearchField query={filters.query} />
        <SortField sort={filters.sort} />
        <PageSizeField pageSize={pageSize} />
        <CompareSlugFields compareSlugs={compareSlugs} />
        <ProductTypeField
          metadata={metadata}
          selectedTypeTaxonId={selectedTypeTaxonId}
          onTypeTaxonIdChange={handleTypeTaxonIdChange}
        />
        <IncludeDescendantsCheckbox
          includeTypeDescendants={includeTypeDescendants}
          selectedTypeTaxonId={selectedTypeTaxonId}
          onIncludeTypeDescendantsChange={setIncludeTypeDescendants}
        />
      </div>
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <div {...stylex.props(styles.advancedHeader)}>
          <CollapsibleTrigger asChild>
            <Button variant="soft">Advanced filters</Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent {...stylex.props(styles.advanced)}>
          <UseCaseFiltersFieldset filters={filters} metadata={metadata} />
          <NumericFiltersFieldset filters={filters} metadata={metadata} />
          <BooleanFiltersFieldset filters={filters} metadata={metadata} />
          <EnumFiltersFieldset filters={filters} metadata={metadata} />
        </CollapsibleContent>
      </Collapsible>
      <div {...stylex.props(styles.actions)}>
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
          setSelectedSort(event.currentTarget.value as NonNullable<CatalogFilters["sort"]>)
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

function UseCaseFiltersFieldset({
  filters,
  metadata
}: {
  filters: CatalogFilters;
  metadata: ProductFilterMetadata;
}) {
  if (metadata.useCaseOptions.length === 0) {
    return null;
  }

  return (
    <fieldset>
      <legend>Use cases</legend>
      {metadata.useCaseOptions.map((option) => (
        <label key={option.id}>
          <input
            type="checkbox"
            name="useCaseTaxonId"
            value={option.id}
            defaultChecked={filters.useCaseTaxonIds.includes(option.id) || option.selected}
            disabled={option.disabled && !option.selected}
          />
          {option.label} ({option.count})
        </label>
      ))}
    </fieldset>
  );
}

function NumericFiltersFieldset({
  filters,
  metadata
}: {
  filters: CatalogFilters;
  metadata: ProductFilterMetadata;
}) {
  if (metadata.numericFilters.length === 0) {
    return null;
  }

  return (
    <fieldset>
      <legend>Numeric filters</legend>
      {metadata.numericFilters.map((filter) => (
        <NumericFilterFields
          key={filter.attributeId}
          filter={filter}
          selectedFilter={selectedNumericFilter(filters.numeric, filter.attributeId)}
        />
      ))}
    </fieldset>
  );
}

function NumericFilterFields({
  filter,
  selectedFilter
}: {
  filter: ProductFilterMetadata["numericFilters"][number];
  selectedFilter?: CatalogNumericFilter;
}) {
  const minValue = selectedNumericFieldValue(selectedFilter?.min, filter.selectedMin);
  const maxValue = selectedNumericFieldValue(selectedFilter?.max, filter.selectedMax);

  return (
    <div>
      <label>
        {filter.displayName} minimum
        <TextField
          inputMode="decimal"
          name={`numeric.${filter.attributeId}.min`}
          defaultValue={minValue}
        />
      </label>
      <label>
        {filter.displayName} maximum
        <TextField
          inputMode="decimal"
          name={`numeric.${filter.attributeId}.max`}
          defaultValue={maxValue}
        />
      </label>
    </div>
  );
}

function selectedNumericFieldValue(
  selectedValue: string | undefined,
  metadataValue: string | null | undefined
) {
  return selectedValue ?? metadataValue ?? "";
}

function BooleanFiltersFieldset({
  filters,
  metadata
}: {
  filters: CatalogFilters;
  metadata: ProductFilterMetadata;
}) {
  if (metadata.booleanFilters.length === 0) {
    return null;
  }

  return (
    <fieldset>
      <legend>Boolean filters</legend>
      {metadata.booleanFilters.map((filter) => (
        <BooleanFilterField
          key={filter.attributeId}
          filter={filter}
          selectedFilter={selectedBooleanFilter(filters.booleans, filter.attributeId)}
        />
      ))}
    </fieldset>
  );
}

function BooleanFilterField({
  filter,
  selectedFilter
}: {
  filter: ProductFilterMetadata["booleanFilters"][number];
  selectedFilter?: CatalogBooleanFilter;
}) {
  const selectedValue = selectedFilter?.value ?? filter.selectedValue;

  return (
    <label>
      {filter.displayName}
      <select
        name={`boolean.${filter.attributeId}`}
        defaultValue={typeof selectedValue === "boolean" ? String(selectedValue) : ""}
      >
        <option value="">Any</option>
        <option value="true">Yes ({filter.trueCount})</option>
        <option value="false">No ({filter.falseCount})</option>
      </select>
    </label>
  );
}

function EnumFiltersFieldset({
  filters,
  metadata
}: {
  filters: CatalogFilters;
  metadata: ProductFilterMetadata;
}) {
  if (metadata.enumFilters.length === 0) {
    return null;
  }

  return (
    <fieldset>
      <legend>Enum filters</legend>
      {metadata.enumFilters.map((filter) => (
        <EnumFilterFieldset
          key={filter.attributeId}
          filter={filter}
          selectedOptionId={selectedEnumFilterValue(filters.enums, filter.attributeId)}
        />
      ))}
    </fieldset>
  );
}

function EnumFilterFieldset({
  filter,
  selectedOptionId
}: {
  filter: ProductFilterMetadata["enumFilters"][number];
  selectedOptionId?: string;
}) {
  const effectiveSelectedOptionId =
    selectedOptionId ?? filter.options.find((option) => option.selected)?.id ?? "";

  return (
    <fieldset>
      <legend>{filter.displayName}</legend>
      <label>
        <input
          type="radio"
          name={`enum.${filter.attributeId}`}
          value=""
          defaultChecked={effectiveSelectedOptionId === ""}
        />
        Any
      </label>
      {filter.options.map((option) => (
        <label key={option.id}>
          <input
            type="radio"
            name={`enum.${filter.attributeId}`}
            value={option.id}
            defaultChecked={effectiveSelectedOptionId === option.id}
            disabled={option.disabled && effectiveSelectedOptionId !== option.id}
          />
          {option.label} ({option.count})
        </label>
      ))}
    </fieldset>
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
      <ul aria-label="Active filters">
        {summaryItems.map((item) => (
          <li key={item.key}>
            <Link
              to={catalogBrowseFirstPagePath(
                catalogFiltersWithout(filters, item.removal),
                pageSize,
                compareSlugs
              )}
            >
              Remove {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <Link to={catalogBrowseFirstPagePath(EMPTY_CATALOG_FILTERS, pageSize, compareSlugs)}>
        Clear filters
      </Link>
    </section>
  );
}

function selectedNumericFilter(filters: readonly CatalogNumericFilter[], attributeId: string) {
  return filters.find((filter) => filter.attributeId === attributeId);
}

function selectedBooleanFilter(filters: readonly CatalogBooleanFilter[], attributeId: string) {
  return filters.find((filter) => filter.attributeId === attributeId);
}

function selectedEnumFilterValue(filters: readonly CatalogEnumFilter[], attributeId: string) {
  let selectedOptionId: string | undefined;

  for (const filter of filters) {
    if (filter.attributeId === attributeId) {
      selectedOptionId = filter.enumOptionId;
    }
  }

  return selectedOptionId;
}
