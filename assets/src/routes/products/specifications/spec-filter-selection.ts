import type { CatalogFilters } from "$routes/catalog/filters";
import { catalogBrowseFirstPagePath } from "$routes/catalog/paths";

const STORAGE_KEY = "product-compare:spec-filter-draft";
const STORAGE_VERSION = 1;
const CATALOG_PAGE_SIZE = 12;

export type SpecFilterKind = "boolean" | "enum" | "numeric";
export type SpecFilterMode = "same" | "at_least" | "at_most";

type SpecFilterSelectionBase = {
  attributeId: string;
  code: string;
  displayName: string;
  mode: SpecFilterMode;
};

export type SpecFilterSelection =
  | (SpecFilterSelectionBase & { kind: "boolean"; value: boolean })
  | (SpecFilterSelectionBase & { kind: "enum"; value: string })
  | (SpecFilterSelectionBase & { kind: "numeric"; unitSymbol: string | null; value: string });

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
  const filters = {
    booleans: selections.flatMap((selection) =>
      selection.kind === "boolean"
        ? [{ attributeId: selection.attributeId, value: selection.value }]
        : [],
    ),
    enums: selections.flatMap((selection) =>
      selection.kind === "enum"
        ? [{ attributeId: selection.attributeId, enumOptionId: selection.value }]
        : [],
    ),
    numeric: selections.flatMap(numericCatalogFilter),
    useCaseTaxonIds: [],
  } satisfies CatalogFilters;

  return catalogBrowseFirstPagePath(filters, CATALOG_PAGE_SIZE);
}

function numericCatalogFilter(selection: SpecFilterSelection) {
  if (selection.kind !== "numeric") return [];

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

  if (value.kind === "boolean") return typeof value.value === "boolean";
  if (
    value.kind === "numeric" &&
    value.unitSymbol !== null &&
    typeof value.unitSymbol !== "string"
  ) {
    return false;
  }
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
