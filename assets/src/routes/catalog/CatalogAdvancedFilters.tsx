import { Checkbox } from "../../ui/primitives/Checkbox";
import { Radio } from "../../ui/primitives/Radio";
import { Select } from "../../ui/primitives/Select";
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
        <label key={row.id}>
          <Checkbox
            defaultChecked={row.selected}
            disabled={row.disabled}
            id={`catalog-use-case-${row.id}`}
            name="useCaseTaxonId"
            value={row.id}
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
  const minInputId = `catalog-numeric-${row.attributeId}-min`;
  const maxInputId = `catalog-numeric-${row.attributeId}-max`;

  return (
    <div>
      <label htmlFor={minInputId}>
        {row.displayName} minimum
        <TextField
          defaultValue={row.minValue}
          id={minInputId}
          inputMode="decimal"
          name={`numeric.${row.attributeId}.min`}
        />
      </label>
      <label htmlFor={maxInputId}>
        {row.displayName} maximum
        <TextField
          defaultValue={row.maxValue}
          id={maxInputId}
          inputMode="decimal"
          name={`numeric.${row.attributeId}.max`}
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
      <Select
        defaultValue={row.defaultValue}
        id={`catalog-boolean-${row.attributeId}`}
        name={`boolean.${row.attributeId}`}
        options={[
          { label: "Any", value: "" },
          { label: `Yes (${row.trueCount})`, value: "true" },
          { label: `No (${row.falseCount})`, value: "false" }
        ]}
      />
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
  const inputName = `enum.${row.attributeId}`;

  return (
    <fieldset>
      <legend>{row.displayName}</legend>
      <label>
        <Radio
          defaultChecked={row.anySelected}
          id={`catalog-enum-${row.attributeId}-any`}
          name={inputName}
          value=""
        />
        Any
      </label>
      {row.options.map((option) => (
        <label key={option.id}>
          <Radio
            defaultChecked={option.selected}
            disabled={option.disabled}
            id={`catalog-enum-${row.attributeId}-${option.id}`}
            name={inputName}
            value={option.id}
          />
          {option.label} ({option.count})
        </label>
      ))}
    </fieldset>
  );
}
