import { buildComparePathFromSlugs } from "./paths";

export type CompareSpecModeNavigationMode = "shared" | "differences" | "all";

interface CompareSpecModeNavigationInput {
  readonly selectedSlugs: readonly string[];
  readonly specMode: CompareSpecModeNavigationMode;
}

interface CompareSpecModeNavigationItem {
  readonly isCurrent: boolean;
  readonly label: string;
  readonly mode: CompareSpecModeNavigationMode;
  readonly path: string;
}

const COMPARE_SPEC_MODE_OPTIONS: ReadonlyArray<{
  readonly label: string;
  readonly mode: CompareSpecModeNavigationMode;
}> = [
  { label: "Shared specs", mode: "shared" },
  { label: "Differences", mode: "differences" },
  { label: "All specs", mode: "all" }
];

export function buildCompareSpecModeNavigationData({
  selectedSlugs,
  specMode
}: CompareSpecModeNavigationInput): {
  readonly modes: readonly CompareSpecModeNavigationItem[];
} {
  return {
    modes: COMPARE_SPEC_MODE_OPTIONS.map(({ label, mode }) => ({
      isCurrent: mode === specMode,
      label,
      mode,
      path: buildComparePathFromSlugs(selectedSlugs, { specMode: mode })
    }))
  };
}
