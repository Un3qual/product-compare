import { TextField } from "../../ui/primitives/TextField";
import type { BrowseProductsRouteQuery } from "../../__generated__/BrowseProductsRouteQuery.graphql";
import type {
  CatalogBooleanFilter,
  CatalogEnumFilter,
  CatalogFilters,
  CatalogNumericFilter
} from "./filters";

type ProductFilterMetadata = BrowseProductsRouteQuery["response"]["productFilterMetadata"];

export function CatalogAdvancedFilters({
  filters,
  metadata
}: {
  filters: CatalogFilters;
  metadata: ProductFilterMetadata;
}) {
  return (
    <>
      <UseCaseFiltersFieldset filters={filters} metadata={metadata} />
      <NumericFiltersFieldset filters={filters} metadata={metadata} />
      <BooleanFiltersFieldset filters={filters} metadata={metadata} />
      <EnumFiltersFieldset filters={filters} metadata={metadata} />
    </>
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
      {metadata.useCaseOptions.map((option) => {
        const selected = filters.useCaseTaxonIds.includes(option.id) || option.selected;

        return (
          <label key={option.id}>
            <input
              defaultChecked={selected}
              disabled={option.disabled && !selected}
              name="useCaseTaxonId"
              type="checkbox"
              value={option.id}
            />
            {option.label} ({option.count})
          </label>
        );
      })}
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
          filter={filter}
          key={filter.attributeId}
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
  const minInputId = `catalog-numeric-${filter.attributeId}-min`;
  const maxInputId = `catalog-numeric-${filter.attributeId}-max`;

  return (
    <div>
      <label htmlFor={minInputId}>
        {filter.displayName} minimum
        <TextField
          defaultValue={minValue}
          id={minInputId}
          inputMode="decimal"
          name={`numeric.${filter.attributeId}.min`}
        />
      </label>
      <label htmlFor={maxInputId}>
        {filter.displayName} maximum
        <TextField
          defaultValue={maxValue}
          id={maxInputId}
          inputMode="decimal"
          name={`numeric.${filter.attributeId}.max`}
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
          filter={filter}
          key={filter.attributeId}
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
        defaultValue={typeof selectedValue === "boolean" ? String(selectedValue) : ""}
        name={`boolean.${filter.attributeId}`}
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
          filter={filter}
          key={filter.attributeId}
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
          defaultChecked={effectiveSelectedOptionId === ""}
          name={`enum.${filter.attributeId}`}
          type="radio"
          value=""
        />
        Any
      </label>
      {filter.options.map((option) => (
        <label key={option.id}>
          <input
            defaultChecked={effectiveSelectedOptionId === option.id}
            disabled={option.disabled && effectiveSelectedOptionId !== option.id}
            name={`enum.${filter.attributeId}`}
            type="radio"
            value={option.id}
          />
          {option.label} ({option.count})
        </label>
      ))}
    </fieldset>
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
