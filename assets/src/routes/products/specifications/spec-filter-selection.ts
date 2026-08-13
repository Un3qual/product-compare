import type { CatalogFilters } from "$routes/catalog/filters";
import { catalogBrowseFirstPagePath } from "$routes/catalog/paths";

const STORAGE_KEY = "product-compare:spec-filter-draft";
const STORAGE_VERSION = 1;
const CATALOG_PAGE_SIZE = 12;

export type SpecFilterKind = "boolean" | "enum" | "numeric";
export type SpecFilterMode = "same" | "at_least" | "at_most";

export type SpecFilterSelection = {
  attributeId: string;
  code: string;
  displayName: string;
  kind: SpecFilterKind;
  mode: SpecFilterMode;
  unitSymbol?: string;
  value: boolean | string;
};

export function readSpecFilterDraft(storage: Storage, productId: string): SpecFilterSelection[] {
  const value = storage.getItem(STORAGE_KEY);
  if (!value) return [];

  try {
    const draft = JSON.parse(value) as unknown;
    return validDraft(draft, productId) ? draft.selections : [];
  } catch {
    return [];
  }
}

export function writeSpecFilterDraft(
  storage: Storage,
  productId: string,
  selections: readonly SpecFilterSelection[],
) {
  storage.setItem(STORAGE_KEY, JSON.stringify({ productId, selections, version: STORAGE_VERSION }));
}

export function catalogPathForSpecSelections(selections: readonly SpecFilterSelection[]) {
  const filters: CatalogFilters = {
    booleans: selections.flatMap((selection) =>
      selection.kind === "boolean" && typeof selection.value === "boolean"
        ? [{ attributeId: selection.attributeId, value: selection.value }]
        : [],
    ),
    enums: selections.flatMap((selection) =>
      selection.kind === "enum" && typeof selection.value === "string"
        ? [{ attributeId: selection.attributeId, enumOptionId: selection.value }]
        : [],
    ),
    numeric: selections.flatMap(numericCatalogFilter),
    useCaseTaxonIds: [],
  };

  return catalogBrowseFirstPagePath(filters, CATALOG_PAGE_SIZE);
}

function numericCatalogFilter(selection: SpecFilterSelection) {
  if (selection.kind !== "numeric" || typeof selection.value !== "string") return [];

  const bound = selection.value;
  const filter =
    selection.mode === "same"
      ? { attributeId: selection.attributeId, max: bound, min: bound }
      : selection.mode === "at_least"
        ? { attributeId: selection.attributeId, min: bound }
        : { attributeId: selection.attributeId, max: bound };

  return [filter];
}

function validDraft(
  value: unknown,
  productId: string,
): value is { productId: string; selections: SpecFilterSelection[]; version: 1 } {
  if (!isRecord(value)) return false;
  if (value.version !== STORAGE_VERSION || value.productId !== productId) return false;
  return Array.isArray(value.selections) && value.selections.every(validSelection);
}

function validSelection(value: unknown): value is SpecFilterSelection {
  if (!isRecord(value)) return false;
  if (!nonBlankString(value.attributeId) || !nonBlankString(value.code)) return false;
  if (!nonBlankString(value.displayName) || !validKind(value.kind) || !validMode(value.mode)) {
    return false;
  }

  if (value.unitSymbol !== undefined && typeof value.unitSymbol !== "string") return false;
  if (value.kind === "boolean") return typeof value.value === "boolean";
  return nonBlankString(value.value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonBlankString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function validKind(value: unknown): value is SpecFilterKind {
  return value === "boolean" || value === "enum" || value === "numeric";
}

function validMode(value: unknown): value is SpecFilterMode {
  return value === "same" || value === "at_least" || value === "at_most";
}
