export interface CatalogAdvancedFilterSelections {
  useCaseTaxonIds: readonly string[];
  numeric: readonly CatalogAdvancedNumericSelection[];
  booleans: readonly CatalogAdvancedBooleanSelection[];
  enums: readonly CatalogAdvancedEnumSelection[];
}

export interface CatalogAdvancedNumericSelection {
  attributeId: string;
  min?: string;
  max?: string;
}

export interface CatalogAdvancedBooleanSelection {
  attributeId: string;
  value: boolean;
}

export interface CatalogAdvancedEnumSelection {
  attributeId: string;
  enumOptionId: string;
}

export interface CatalogAdvancedFilterOptionMetadata {
  id: string;
  label: string;
  count: number;
  selected: boolean;
  disabled: boolean;
}

export interface CatalogAdvancedFilterMetadata {
  useCaseOptions: readonly CatalogAdvancedFilterOptionMetadata[];
  numericFilters: readonly CatalogAdvancedNumericFilterMetadata[];
  booleanFilters: readonly CatalogAdvancedBooleanFilterMetadata[];
  enumFilters: readonly CatalogAdvancedEnumFilterMetadata[];
}

export interface CatalogAdvancedNumericFilterMetadata {
  attributeId: string;
  displayName: string;
  selectedMin?: string | null;
  selectedMax?: string | null;
}

export interface CatalogAdvancedBooleanFilterMetadata {
  attributeId: string;
  displayName: string;
  trueCount: number;
  falseCount: number;
  selectedValue?: boolean | null;
}

export interface CatalogAdvancedEnumFilterMetadata {
  attributeId: string;
  displayName: string;
  options: readonly CatalogAdvancedFilterOptionMetadata[];
}

export interface CatalogAdvancedFilterViewData {
  useCaseRows: readonly CatalogAdvancedUseCaseRow[];
  numericRows: readonly CatalogAdvancedNumericRow[];
  booleanRows: readonly CatalogAdvancedBooleanRow[];
  enumRows: readonly CatalogAdvancedEnumRow[];
}

export interface CatalogAdvancedUseCaseRow {
  inputId: string;
  inputName: "useCaseTaxonId";
  value: string;
  label: string;
  count: number;
  selected: boolean;
  disabled: boolean;
}

export interface CatalogAdvancedTextInputRow {
  inputId: string;
  inputName: string;
  defaultValue: string;
}

export interface CatalogAdvancedNumericRow {
  attributeId: string;
  displayName: string;
  min: CatalogAdvancedTextInputRow;
  max: CatalogAdvancedTextInputRow;
}

export interface CatalogAdvancedBooleanRow {
  attributeId: string;
  displayName: string;
  inputId: string;
  inputName: string;
  defaultValue: "" | "true" | "false";
  trueCount: number;
  falseCount: number;
}

export interface CatalogAdvancedEnumOptionRow {
  inputId: string;
  inputName: string;
  value: string;
  label: string;
  count: number;
  selected: boolean;
  disabled: boolean;
}

export interface CatalogAdvancedEnumRow {
  attributeId: string;
  displayName: string;
  inputName: string;
  anyOption: CatalogAdvancedEnumOptionRow;
  options: readonly CatalogAdvancedEnumOptionRow[];
}

export function catalogAdvancedFilterViewData(
  selections: CatalogAdvancedFilterSelections,
  metadata: CatalogAdvancedFilterMetadata
): CatalogAdvancedFilterViewData {
  return {
    useCaseRows: metadata.useCaseOptions.map((option) => {
      const selected = selections.useCaseTaxonIds.includes(option.id) || option.selected;

      return {
        inputId: `catalog-use-case-${option.id}`,
        inputName: "useCaseTaxonId",
        value: option.id,
        label: option.label,
        count: option.count,
        selected,
        disabled: option.disabled && !selected
      };
    }),
    numericRows: metadata.numericFilters.map((filter) =>
      catalogAdvancedNumericRow(selections.numeric, filter)
    ),
    booleanRows: metadata.booleanFilters.map((filter) => {
      const selected = selectedBooleanFilter(selections.booleans, filter.attributeId);
      const value = selected?.value ?? filter.selectedValue;

      return {
        attributeId: filter.attributeId,
        displayName: filter.displayName,
        inputId: `catalog-boolean-${filter.attributeId}`,
        inputName: `boolean.${filter.attributeId}`,
        defaultValue: booleanDefaultValue(value),
        trueCount: filter.trueCount,
        falseCount: filter.falseCount
      };
    }),
    enumRows: metadata.enumFilters.map((filter) => {
      const selectedOptionId = selectedEnumOptionId(selections.enums, filter.attributeId);
      const effectiveSelectedOptionId =
        selectedOptionId ?? filter.options.find((option) => option.selected)?.id ?? "";
      const inputName = `enum.${filter.attributeId}`;

      return {
        attributeId: filter.attributeId,
        displayName: filter.displayName,
        inputName,
        anyOption: {
          inputId: `catalog-enum-${filter.attributeId}-any`,
          inputName,
          value: "",
          label: "Any",
          count: 0,
          selected: effectiveSelectedOptionId === "",
          disabled: false
        },
        options: filter.options.map((option) => {
          const selected = effectiveSelectedOptionId === option.id;

          return {
            inputId: `catalog-enum-${filter.attributeId}-${option.id}`,
            inputName,
            value: option.id,
            label: option.label,
            count: option.count,
            selected,
            disabled: option.disabled && !selected
          };
        })
      };
    })
  };
}

function catalogAdvancedNumericRow(
  selections: readonly CatalogAdvancedNumericSelection[],
  filter: CatalogAdvancedNumericFilterMetadata
): CatalogAdvancedNumericRow {
  const selected = selectedNumericFilter(selections, filter.attributeId);

  return {
    attributeId: filter.attributeId,
    displayName: filter.displayName,
    min: {
      inputId: `catalog-numeric-${filter.attributeId}-min`,
      inputName: `numeric.${filter.attributeId}.min`,
      defaultValue: selectedNumericFieldValue(selected?.min, filter.selectedMin)
    },
    max: {
      inputId: `catalog-numeric-${filter.attributeId}-max`,
      inputName: `numeric.${filter.attributeId}.max`,
      defaultValue: selectedNumericFieldValue(selected?.max, filter.selectedMax)
    }
  };
}

function selectedNumericFieldValue(
  selectedValue: string | undefined,
  metadataValue: string | null | undefined
) {
  return selectedValue ?? metadataValue ?? "";
}

function selectedNumericFilter(
  filters: readonly CatalogAdvancedNumericSelection[],
  attributeId: string
) {
  return filters.find((filter) => filter.attributeId === attributeId);
}

function selectedBooleanFilter(
  filters: readonly CatalogAdvancedBooleanSelection[],
  attributeId: string
) {
  return filters.find((filter) => filter.attributeId === attributeId);
}

function selectedEnumOptionId(
  filters: readonly CatalogAdvancedEnumSelection[],
  attributeId: string
) {
  let selectedOptionId: string | undefined;

  for (const filter of filters) {
    if (filter.attributeId === attributeId) {
      selectedOptionId = filter.enumOptionId;
    }
  }

  return selectedOptionId;
}

function booleanDefaultValue(value: boolean | null | undefined): CatalogAdvancedBooleanRow["defaultValue"] {
  if (typeof value !== "boolean") {
    return "";
  }

  return value ? "true" : "false";
}
