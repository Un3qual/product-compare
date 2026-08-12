import { Checkbox } from "$ui/primitives/Checkbox";
import { RadioGroup, RadioGroupItem } from "$ui/primitives/RadioGroup";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "$ui/primitives/Select";
import { Input } from "$ui/primitives/Input";
import type { BrowseRouteQuery } from "$generated/BrowseRouteQuery.graphql";
import type { CatalogFilters } from "./filters";
import {
  catalogAdvancedFilterViewData,
  type CatalogAdvancedBooleanRow,
  type CatalogAdvancedEnumRow,
  type CatalogAdvancedNumericRow,
  type CatalogAdvancedUseCaseRow,
} from "./catalog-advanced-filter-data";

type ProductFilterMetadata = BrowseRouteQuery["response"]["productFilterMetadata"];

export function CatalogAdvancedFilters({
  filters,
  metadata,
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

function UseCaseFiltersFieldset({ rows }: { rows: readonly CatalogAdvancedUseCaseRow[] }) {
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

function NumericFiltersFieldset({ rows }: { rows: readonly CatalogAdvancedNumericRow[] }) {
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

function NumericFilterFields({ row }: { row: CatalogAdvancedNumericRow }) {
  const minInputId = `catalog-numeric-${row.attributeId}-min`;
  const maxInputId = `catalog-numeric-${row.attributeId}-max`;

  return (
    <div>
      <label htmlFor={minInputId}>
        {row.displayName} minimum
        <Input
          defaultValue={row.minValue}
          id={minInputId}
          inputMode="decimal"
          name={`numeric.${row.attributeId}.min`}
        />
      </label>
      <label htmlFor={maxInputId}>
        {row.displayName} maximum
        <Input
          defaultValue={row.maxValue}
          id={maxInputId}
          inputMode="decimal"
          name={`numeric.${row.attributeId}.max`}
        />
      </label>
    </div>
  );
}

function BooleanFiltersFieldset({ rows }: { rows: readonly CatalogAdvancedBooleanRow[] }) {
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

function BooleanFilterField({ row }: { row: CatalogAdvancedBooleanRow }) {
  const options = [
    { label: "Any", value: "" },
    { label: `Yes (${row.trueCount})`, value: "true" },
    { label: `No (${row.falseCount})`, value: "false" },
  ];

  return (
    <label>
      {row.displayName}
      <Select defaultValue={row.defaultValue} items={options} name={`boolean.${row.attributeId}`}>
        <SelectTrigger id={`catalog-boolean-${row.attributeId}`}>
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
    </label>
  );
}

function EnumFiltersFieldset({ rows }: { rows: readonly CatalogAdvancedEnumRow[] }) {
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

function EnumFilterFieldset({ row }: { row: CatalogAdvancedEnumRow }) {
  const inputName = `enum.${row.attributeId}`;
  const defaultValue = row.anySelected
    ? ""
    : (row.options.find((option) => option.selected)?.id ?? "");

  return (
    <fieldset>
      <legend>{row.displayName}</legend>
      <RadioGroup defaultValue={defaultValue} name={inputName}>
        <label>
          <RadioGroupItem id={`catalog-enum-${row.attributeId}-any`} value="" />
          Any
        </label>
        {row.options.map((option) => (
          <label key={option.id}>
            <RadioGroupItem
              disabled={option.disabled}
              id={`catalog-enum-${row.attributeId}-${option.id}`}
              value={option.id}
            />
            {option.label} ({option.count})
          </label>
        ))}
      </RadioGroup>
    </fieldset>
  );
}
