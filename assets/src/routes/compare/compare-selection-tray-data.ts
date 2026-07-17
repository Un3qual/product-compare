export interface CompareSelectionTrayItem {
  readonly label: string;
  readonly slug: string;
}

export interface CompareSelectionTrayRow extends CompareSelectionTrayItem {
  readonly removePath: string;
}

export type CompareSelectionTrayViewData = {
  readonly rows: readonly CompareSelectionTrayRow[];
  readonly selectionCountCopy: string;
  readonly showOpenAction: boolean;
};

type CompareSelectionTrayViewDataInput = {
  readonly items: readonly CompareSelectionTrayItem[];
  readonly maxProducts: number;
  readonly removePathForIndex: (index: number) => string;
  readonly selectedSlugs: readonly string[];
};

const EMPTY_SELECTION_ROWS: readonly CompareSelectionTrayRow[] = Object.freeze([]);

export function buildCompareSelectionTrayViewData({
  items,
  maxProducts,
  removePathForIndex,
  selectedSlugs
}: CompareSelectionTrayViewDataInput): CompareSelectionTrayViewData {
  const rows =
    selectedSlugs.length === 0
      ? EMPTY_SELECTION_ROWS
      : selectedSlugs.map((slug, index) => ({
          label: items.find((item) => item.slug === slug)?.label ?? slug,
          removePath: removePathForIndex(index),
          slug
        }));

  return {
    rows,
    selectionCountCopy: `${selectedSlugs.length} of ${maxProducts} products selected.`,
    showOpenAction: selectedSlugs.length > 0
  };
}
