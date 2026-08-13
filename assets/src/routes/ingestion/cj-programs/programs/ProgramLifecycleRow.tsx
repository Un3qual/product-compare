import { useEffect, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { useRevalidator } from "react-router-dom";
import { graphql, useFragment, useMutation } from "react-relay";
import type { ProgramLifecycleRow_program$key } from "$generated/ProgramLifecycleRow_program.graphql";
import type { ProgramLifecycleRowUpdateCJProgramMutation } from "$generated/ProgramLifecycleRowUpdateCJProgramMutation.graphql";
import { StatusBadge } from "$ui/components/status/StatusBadge";
import { TableCell, TableRow } from "$ui/primitives/Table";
import { Button } from "$ui/primitives/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "$ui/primitives/Select";
import { Textarea } from "$ui/primitives/Textarea";
import { Label } from "$ui/primitives/Label";
import { tokens } from "$ui/theme/tokens.stylex";
import {
  CJ_PROGRAM_STAGES,
  cjProgramStageLabel,
  cjProgramWarningCopy,
  editableCJProgramStage,
  formatCJDateTime,
  type CJProgramStage,
} from "../cj-program-data";
import { ProgramFeeds } from "../feeds/ProgramFeeds";

const cjProgramFragment = graphql`
  fragment ProgramLifecycleRow_program on CJProgram {
    id
    advertiserId
    advertiserName
    stage
    note
    lastChanged
    feedCount
    warningCodes
  }
`;

const updateCJProgramMutation = graphql`
  mutation ProgramLifecycleRowUpdateCJProgramMutation($input: UpdateCjProgramInput!) {
    updateCjProgram(input: $input) {
      errors {
        code
        field
        message
      }
    }
  }
`;

const styles = create({
  cell: { minWidth: "9rem", verticalAlign: "top" },
  controlCell: { minWidth: "20rem", verticalAlign: "top" },
  title: {
    margin: 0,
  },
  facts: {
    color: tokens.textSecondary,
    display: "grid",
    gap: "0.35rem",
    margin: 0,
  },
  controls: {
    alignItems: "end",
    display: "grid",
    gap: "0.65rem",
    gridTemplateColumns: "1fr",
  },
  field: {
    display: "grid",
    gap: "0.35rem",
  },
  label: {
    color: tokens.textSecondary,
    fontSize: "0.82rem",
    fontWeight: 600,
  },
  warnings: {
    color: tokens.textSecondary,
    display: "grid",
    gap: "0.25rem",
    margin: 0,
    paddingInlineStart: "1rem",
  },
});

export function ProgramLifecycleRow({
  program: programRef,
}: {
  program: ProgramLifecycleRow_program$key;
}) {
  const program = useFragment(cjProgramFragment, programRef);
  const programName = program.advertiserName ?? program.advertiserId;
  const [stage, setStage] = useState<CJProgramStage | null>(editableCJProgramStage(program.stage));
  const [note, setNote] = useState(program.note ?? "");
  const [feedback, setFeedback] = useState("");
  const revalidator = useRevalidator();
  const [commitUpdate, isUpdateInFlight] =
    useMutation<ProgramLifecycleRowUpdateCJProgramMutation>(updateCJProgramMutation);
  const stageLabel = cjProgramStageLabel(program.stage) ?? program.stage;
  const warnings = program.warningCodes
    .map(cjProgramWarningCopy)
    .filter((warning) => warning !== null);
  const lastChanged = formatCJDateTime(program.lastChanged);
  const stageOptions = [
    ...(stage ? [] : [{ label: "Stage unavailable", value: "" }]),
    ...CJ_PROGRAM_STAGES.map(({ label, value }) => ({ label, value })),
  ];

  useEffect(() => {
    setStage(editableCJProgramStage(program.stage));
    setNote(program.note ?? "");
  }, [program.lastChanged, program.note, program.stage]);

  const handleSave = () => {
    if (!stage) {
      return;
    }

    setFeedback("");
    commitUpdate({
      variables: {
        input: {
          id: program.id,
          stage,
          note: note.trim() || null,
          expectedChangedAt: program.lastChanged,
        },
      },
      onCompleted(response) {
        const payload = response.updateCjProgram;
        const errors = payload.errors;

        if (errors.length > 0) {
          if (errors.some((error) => error.code === "CONFLICT")) {
            revalidator.revalidate();
          }

          setFeedback(errors.map((error) => error.message).join(" "));
          return;
        }

        revalidator.revalidate();
        setFeedback(`${programName} saved.`);
      },
      onError() {
        setFeedback("CJ program could not be updated.");
      },
    });
  };

  return (
    <TableRow aria-busy={isUpdateInFlight}>
      <TableCell style={styles.cell}>
        <h2 {...props(styles.title)}>{programName}</h2>
        <p {...props(styles.facts)}>
          <span>CJ Affiliate</span>
          <span>Advertiser ID {program.advertiserId}</span>
          <span>{formatFeedCount(program.feedCount)}</span>
        </p>
      </TableCell>
      <TableCell style={styles.cell}>
        {stageLabel ? <StatusBadge>{stageLabel}</StatusBadge> : null}
        <CJProgramWarnings programName={programName} warnings={warnings} />
      </TableCell>
      <TableCell style={styles.cell}>
        {lastChanged ? (
          <p {...props(styles.facts)}>
            <span>Last changed</span>
            <time dateTime={program.lastChanged}>{lastChanged}</time>
          </p>
        ) : (
          "Not recorded"
        )}
      </TableCell>
      <TableCell style={styles.cell}>{cjProgramRequiredAction(program.stage, warnings)}</TableCell>
      <TableCell style={styles.controlCell}>
        <div {...props(styles.controls)}>
          <Label style={styles.field}>
            <span {...props(styles.label)}>Stage for {programName}</span>
            <Select
              disabled={isUpdateInFlight || !stage}
              items={stageOptions}
              onValueChange={(nextStage) => {
                setStage(CJ_PROGRAM_STAGES.find(({ value }) => value === nextStage)?.value ?? null);
              }}
              value={stage ?? ""}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stageOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Label>
          <Label style={styles.field}>
            <span {...props(styles.label)}>Note for {programName}</span>
            <Textarea
              disabled={isUpdateInFlight || !stage}
              onChange={(event) => setNote(event.currentTarget.value)}
              value={note}
            />
          </Label>
          <Button
            aria-label={`Save ${programName}`}
            disabled={isUpdateInFlight || !stage}
            onClick={handleSave}
            type="button"
          >
            {isUpdateInFlight ? "Saving..." : "Save"}
          </Button>
        </div>
        {feedback ? <p role="status">{feedback}</p> : null}
        <ProgramFeeds programId={program.id} programName={programName} />
      </TableCell>
    </TableRow>
  );
}

function CJProgramWarnings({
  programName,
  warnings,
}: {
  programName: string;
  warnings: readonly string[];
}) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <ul aria-label={`Warnings for ${programName}`} {...props(styles.warnings)}>
      {warnings.map((warning) => (
        <li key={warning}>{warning}</li>
      ))}
    </ul>
  );
}

function formatFeedCount(feedCount: number | null) {
  if (feedCount === null) {
    return "Feed count unavailable";
  }

  return feedCount === 1 ? "1 feed" : `${feedCount} feeds`;
}

function cjProgramRequiredAction(
  stage: Parameters<typeof cjProgramStageLabel>[0],
  warnings: readonly string[],
) {
  if (warnings.length > 0) {
    return "Review feed warnings";
  }

  switch (stage) {
    case "NEW":
      return "Decide whether to pursue";
    case "CONSIDERING":
      return "Complete program review";
    case "SELECTED":
      return "Submit application";
    case "APPLIED":
      return "Monitor application";
    case "ACCEPTED":
      return "Inspect available feeds";
    case "NOT_PURSUING":
    case "DECLINED":
      return "No action required";
    default:
      return "Review new lifecycle stage";
  }
}
