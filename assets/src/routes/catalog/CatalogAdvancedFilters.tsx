import { TextField } from "../../ui/primitives/TextField";
import type { BrowseProductsRouteQuery } from "../../__generated__/BrowseProductsRouteQuery.graphql";
import type { CatalogFilters } from "./filters";
import {
  catalogAdvancedFilterViewData,
  type CatalogAdvancedBooleanRow,
  type CatalogAdvancedEnumRow,
  type CatalogAdvancedNumericRow,
  type CatalogAdvancedUseCaseRow
} from "./catalog-advanced-filter-data";

type ProductFilterMetadata = BrowseProductsRouteQuery["response"]["productFilterMetadata"];

export function CatalogAdvancedFilters({
  filters,
  metadata
}: {
  filters: CatalogFilters;
  metadata: ProductFilterMetadata;
}) {
  const data = catalogAdvancedFilterViewData(filters, metadata);

  return (
    <>
      <UseCaseFiltersFieldset rows={data.useCaseRows} />
      <NumericFiltersFieldset rows={data.numericRows} />
      <BooleanFiltersFieldset rows={data.booleanRows} />
      <EnumFiltersFieldset rows={data.enumRows} />
    </>
  );
}

function UseCaseFiltersFieldset({
  rows
}: {
  rows: readonly CatalogAdvancedUseCaseRow[];
}) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <fieldset>
      <legend>Use cases</legend>
      {rows.map((row) => (
        <label key={row.inputId}>
          <input
            defaultChecked={row.selected}
            disabled={row.disabled}
            id={row.inputId}
            name={row.inputName}
            type="checkbox"
            value={row.value}
          />
          {row.label} ({row.count})
        </label>
      ))}
    </fieldset>
  );
}

function NumericFiltersFieldset({
  rows
}: {
  rows: readonly CatalogAdvancedNumericRow[];
}) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <fieldset>
      <legend>Numeric filters</legend>
      {rows.map((row) => (
        <NumericFilterFields key={row.attributeId} row={row} />
      ))}
    </fieldset>
  );
}

function NumericFilterFields({
  row
}: {
  row: CatalogAdvancedNumericRow;
}) {
  return (
    <div>
      <label htmlFor={row.min.inputId}>
        {row.displayName} minimum
        <TextField
          defaultValue={row.min.defaultValue}
          id={row.min.inputId}
          inputMode="decimal"
          name={row.min.inputName}
        />
      </label>
      <label htmlFor={row.max.inputId}>
        {row.displayName} maximum
        <TextField
          defaultValue={row.max.defaultValue}
          id={row.max.inputId}
          inputMode="decimal"
          name={row.max.inputName}
        />
      </label>
    </div>
  );
}

function BooleanFiltersFieldset({
  rows
}: {
  rows: readonly CatalogAdvancedBooleanRow[];
}) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <fieldset>
      <legend>Boolean filters</legend>
      {rows.map((row) => (
        <BooleanFilterField key={row.attributeId} row={row} />
      ))}
    </fieldset>
  );
}

function BooleanFilterField({
  row
}: {
  row: CatalogAdvancedBooleanRow;
}) {
  return (
    <label>
      {row.displayName}
      <select
        defaultValue={row.defaultValue}
        id={row.inputId}
        name={row.inputName}
      >
        <option value="">Any</option>
        <option value="true">Yes ({row.trueCount})</option>
        <option value="false">No ({row.falseCount})</option>
      </select>
    </label>
  );
}

function EnumFiltersFieldset({
  rows
}: {
  rows: readonly CatalogAdvancedEnumRow[];
}) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <fieldset>
      <legend>Enum filters</legend>
      {rows.map((row) => (
        <EnumFilterFieldset key={row.attributeId} row={row} />
      ))}
    </fieldset>
  );
}

function EnumFilterFieldset({
  row
}: {
  row: CatalogAdvancedEnumRow;
}) {
  return (
    <fieldset>
      <legend>{row.displayName}</legend>
      <label>
        <input
          defaultChecked={row.anyOption.selected}
          id={row.anyOption.inputId}
          name={row.anyOption.inputName}
          type="radio"
          value={row.anyOption.value}
        />
        Any
      </label>
      {row.options.map((option) => (
        <label key={option.inputId}>
          <input
            defaultChecked={option.selected}
            disabled={option.disabled}
            id={option.inputId}
            name={option.inputName}
            type="radio"
            value={option.value}
          />
          {option.label} ({option.count})
        </label>
      ))}
    </fieldset>
  );
}
