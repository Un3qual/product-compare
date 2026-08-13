import { buildComparePathFromSlugs } from "./paths";

const COMPARE_SPEC_MODE_OPTIONS = [
  { label: "Shared specs", mode: "shared" },
  { label: "Differences", mode: "differences" },
  { label: "All specs", mode: "all" },
] as const;

export type CompareSpecModeNavigationMode = (typeof COMPARE_SPEC_MODE_OPTIONS)[number]["mode"];

interface CompareSpecModeNavigationInput {
  readonly selectedSlugs: readonly string[];
  readonly specMode: CompareSpecModeNavigationMode;
}

export function buildCompareSpecModeNavigationData({
  selectedSlugs,
  specMode,
}: CompareSpecModeNavigationInput) {
  return {
    modes: COMPARE_SPEC_MODE_OPTIONS.map(({ label, mode }) => ({
      isCurrent: mode === specMode,
      label,
      mode,
      path: buildComparePathFromSlugs(selectedSlugs, { specMode: mode }),
    })),
  };
}
