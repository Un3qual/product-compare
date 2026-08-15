import type { CJProgramsRouteQuery } from "$generated/CJProgramsRouteQuery.graphql";
import {
  CJ_PROGRAM_STAGES,
  cjProgramNeedsAttention,
  cjProgramRequiredAction,
} from "./lifecycle-policy";

export function buildCJLifecycleSummary(
  counts: CJProgramsRouteQuery["response"]["cjProgramStageCounts"],
) {
  const stageItems = CJ_PROGRAM_STAGES.map(({ countKey, label }) => ({
    label,
    value: counts[countKey],
  }));

  return [
    { label: "All programs", value: stageItems.reduce((total, item) => total + item.value, 0) },
    ...stageItems,
  ];
}

export function selectCJProgramAttention(
  programs: readonly CJProgramsRouteQuery["response"]["cjPrograms"]["edges"][number]["node"][],
) {
  let count = 0;
  let selected: CJProgramsRouteQuery["response"]["cjPrograms"]["edges"][number]["node"] | null =
    null;

  for (const program of programs) {
    if (!cjProgramNeedsAttention(program.stage, program.warningCodes)) continue;

    count += 1;
    if (
      selected === null ||
      (selected.warningCodes.length === 0 && program.warningCodes.length > 0)
    ) {
      selected = program;
    }
  }

  return {
    count,
    program: selected
      ? { advertiserId: selected.advertiserId, advertiserName: selected.advertiserName }
      : null,
    requiredAction: selected
      ? cjProgramRequiredAction(selected.stage, selected.warningCodes)
      : null,
  };
}
