import { useState } from "react";
import { Link } from "react-router-dom";
import type { ProductFilterMetadataQuery } from "../../__generated__/ProductFilterMetadataQuery.graphql";
import {
  catalogFilterSummaryItems,
  hasActiveCatalogFilters,
  type CatalogBooleanFilter,
  type CatalogEnumFilter,
  type CatalogFilterMetadata,
  type CatalogFilters,
  type CatalogNumericFilter
} from "./filters";
import { catalogBrowseFirstPagePath } from "./paths";

const BROWSE_PRODUCTS_PAGE_SIZES = [12, 24, 48] as const;
type ProductFilterMetadata = ProductFilterMetadataQuery["response"]["productFilterMetadata"];

const EMPTY_CATALOG_FILTERS: CatalogFilters = {
  useCaseTaxonIds: [],
  numeric: [],
  booleans: [],
  enums: []
};

export function CatalogFilterForm({
  filters,
  metadata,
  pageSize
}: {
  filters: CatalogFilters;
  metadata: ProductFilterMetadata;
  pageSize: number;
}) {
  const [selectedTypeTaxonId, setSelectedTypeTaxonId] = useState(filters.typeTaxonId ?? "");
  const [includeTypeDescendants, setIncludeTypeDescendants] = useState(
    Boolean(filters.typeTaxonId && filters.includeTypeDescendants)
  );

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
    <form method="get" action="/products" aria-label="Filter products">
      <PageSizeField pageSize={pageSize} />
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
      <UseCaseFiltersFieldset filters={filters} metadata={metadata} />
      <NumericFiltersFieldset filters={filters} metadata={metadata} />
      <BooleanFiltersFieldset filters={filters} metadata={metadata} />
      <EnumFiltersFieldset filters={filters} metadata={metadata} />
      <button type="submit">Apply filters</button>
    </form>
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
        <input
          inputMode="decimal"
          name={`numeric.${filter.attributeId}.min`}
          defaultValue={minValue}
        />
      </label>
      <label>
        {filter.displayName} maximum
        <input
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
  filters,
  metadata,
  pageSize
}: {
  filters: CatalogFilters;
  metadata: CatalogFilterMetadata;
  pageSize: number;
}) {
  if (!hasActiveCatalogFilters(filters)) {
    return null;
  }

  const summaryItems = catalogFilterSummaryItems(metadata, filters);

  return (
    <section aria-label="Applied product filters">
      {summaryItems.length > 0 ? (
        <ul aria-label="Active filters">
          {summaryItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      <Link to={catalogBrowseFirstPagePath(EMPTY_CATALOG_FILTERS, pageSize)}>Clear filters</Link>
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
