import type { BrowseRouteQuery } from "$generated/BrowseRouteQuery.graphql";
import type { CatalogFilters } from "./filter-state";

type ProductFilterMetadata = BrowseRouteQuery["response"]["productFilterMetadata"];
type NumericFilterMetadata = ProductFilterMetadata["numericFilters"][number];
type BooleanFilterMetadata = ProductFilterMetadata["booleanFilters"][number];

export type CatalogAdvancedFilterSelections = {
  booleans: ReadonlyArray<CatalogFilters["booleans"][number]>;
  enums: ReadonlyArray<CatalogFilters["enums"][number]>;
  numeric: ReadonlyArray<CatalogFilters["numeric"][number]>;
  useCaseTaxonIds: readonly string[];
};
export type CatalogAdvancedFilterMetadata = Pick<
  ProductFilterMetadata,
  "booleanFilters" | "enumFilters" | "numericFilters" | "useCaseOptions"
>;

export interface CatalogAdvancedFilterViewData {
  useCaseRows: readonly CatalogAdvancedUseCaseRow[];
  numericRows: readonly CatalogAdvancedNumericRow[];
  booleanRows: readonly CatalogAdvancedBooleanRow[];
  enumRows: readonly CatalogAdvancedEnumRow[];
}

export interface CatalogAdvancedUseCaseRow {
  id: string;
  label: string;
  count: number;
  selected: boolean;
  disabled: boolean;
}

export interface CatalogAdvancedNumericRow {
  attributeId: string;
  displayName: string;
  minValue: string;
  maxValue: string;
}

export interface CatalogAdvancedBooleanRow {
  attributeId: string;
  displayName: string;
  defaultValue: "" | "true" | "false";
  trueCount: number;
  falseCount: number;
}

export interface CatalogAdvancedEnumOptionRow {
  id: string;
  label: string;
  count: number;
  selected: boolean;
  disabled: boolean;
}

export interface CatalogAdvancedEnumRow {
  attributeId: string;
  displayName: string;
  anySelected: boolean;
  options: readonly CatalogAdvancedEnumOptionRow[];
}

export function catalogAdvancedFilterViewData(
  selections: CatalogAdvancedFilterSelections,
  metadata: CatalogAdvancedFilterMetadata,
): CatalogAdvancedFilterViewData {
  return {
    useCaseRows: metadata.useCaseOptions.map((option) => {
      const selected = selections.useCaseTaxonIds.includes(option.id) || option.selected;

      return {
        id: option.id,
        label: option.label,
        count: option.count,
        selected,
        disabled: option.disabled && !selected,
      };
    }),
    numericRows: metadata.numericFilters.map((filter) =>
      catalogAdvancedNumericRow(selections.numeric, filter),
    ),
    booleanRows: metadata.booleanFilters.map((filter) => {
      const selected = selectedBooleanFilter(selections.booleans, filter.attributeId);
      const value = selected?.value ?? filter.selectedValue;

      return {
        attributeId: filter.attributeId,
        displayName: filter.displayName,
        defaultValue: booleanDefaultValue(value),
        trueCount: filter.trueCount,
        falseCount: filter.falseCount,
      };
    }),
    enumRows: metadata.enumFilters.map((filter) => {
      const selectedOptionId = selectedEnumOptionId(selections.enums, filter.attributeId);
      const effectiveSelectedOptionId =
        selectedOptionId ?? filter.options.find((option) => option.selected)?.id ?? "";

      return {
        attributeId: filter.attributeId,
        displayName: filter.displayName,
        anySelected: effectiveSelectedOptionId === "",
        options: filter.options.map((option) => {
          const selected = effectiveSelectedOptionId === option.id;

          return {
            id: option.id,
            label: option.label,
            count: option.count,
            selected,
            disabled: option.disabled && !selected,
          };
        }),
      };
    }),
  };
}

function catalogAdvancedNumericRow(
  selections: CatalogAdvancedFilterSelections["numeric"],
  filter: NumericFilterMetadata,
): CatalogAdvancedNumericRow {
  const selected = selectedNumericFilter(selections, filter.attributeId);

  return {
    attributeId: filter.attributeId,
    displayName: filter.displayName,
    minValue: selectedNumericFieldValue(selected?.min, filter.selectedMin),
    maxValue: selectedNumericFieldValue(selected?.max, filter.selectedMax),
  };
}

function selectedNumericFieldValue(
  selectedValue: CatalogAdvancedFilterSelections["numeric"][number]["min"],
  metadataValue: NumericFilterMetadata["selectedMin"],
) {
  return selectedValue ?? metadataValue ?? "";
}

function selectedNumericFilter(
  filters: CatalogAdvancedFilterSelections["numeric"],
  attributeId: string,
) {
  return filters.find((filter) => filter.attributeId === attributeId);
}

function selectedBooleanFilter(
  filters: CatalogAdvancedFilterSelections["booleans"],
  attributeId: string,
) {
  return filters.find((filter) => filter.attributeId === attributeId);
}

function selectedEnumOptionId(
  filters: CatalogAdvancedFilterSelections["enums"],
  attributeId: string,
) {
  let selectedOptionId: string | undefined;

  for (const filter of filters) {
    if (filter.attributeId === attributeId) {
      selectedOptionId = filter.enumOptionId;
    }
  }

  return selectedOptionId;
}

function booleanDefaultValue(
  value:
    | CatalogAdvancedFilterSelections["booleans"][number]["value"]
    | BooleanFilterMetadata["selectedValue"],
): CatalogAdvancedBooleanRow["defaultValue"] {
  if (typeof value !== "boolean") {
    return "";
  }

  return value ? "true" : "false";
}
