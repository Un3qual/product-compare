import type {
  CJProgramStage,
  CJProgramWarningCode,
} from "$generated/ProgramLifecycleRow_program.graphql";
import {
  CJ_PROGRAM_STAGES,
  cjProgramNeedsAttention,
  cjProgramRequiredAction,
} from "./lifecycle-policy";

type StageCounts = Readonly<Record<(typeof CJ_PROGRAM_STAGES)[number]["countKey"], number>>;

type AttentionProgram = {
  readonly advertiserId: string;
  readonly advertiserName: string | null;
  readonly stage: CJProgramStage;
  readonly warningCodes: readonly CJProgramWarningCode[];
};

export function buildCJLifecycleSummary(counts: StageCounts) {
  const stageItems = CJ_PROGRAM_STAGES.map(({ countKey, label }) => ({
    label,
    value: counts[countKey],
  }));

  return [
    { label: "All programs", value: stageItems.reduce((total, item) => total + item.value, 0) },
    ...stageItems,
  ];
}

export function selectCJProgramAttention(programs: readonly AttentionProgram[]) {
  let count = 0;
  let selected: AttentionProgram | null = null;

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
