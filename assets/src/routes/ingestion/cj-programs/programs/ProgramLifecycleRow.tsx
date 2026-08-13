import { useEffect, useId, useState } from "react";
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
  type CJProgramStage,
} from "./lifecycle-policy";
import { formatCJDateTime } from "../formatting";
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
  action: { display: "grid", gap: "0.5rem", justifyItems: "start" },
  title: {
    margin: 0,
  },
  facts: {
    alignItems: "center",
    color: tokens.textSecondary,
    display: "flex",
    flexWrap: "wrap",
    gap: "0.2rem 0.55rem",
    margin: 0,
  },
  controls: {
    alignItems: "end",
    display: "grid",
    gap: "0.65rem",
    gridTemplateColumns: "minmax(10rem, 0.65fr) minmax(16rem, 1fr) auto",
  },
  editor: {
    display: "grid",
    gap: "0.75rem",
  },
  editorCell: {
    backgroundColor: tokens.surfaceRaised,
    verticalAlign: "top",
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
  requiredAction: { margin: 0 },
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
  const [isEditing, setIsEditing] = useState(false);
  const editorId = useId();
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
    <>
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
          {lastChanged ? <time dateTime={program.lastChanged}>{lastChanged}</time> : "Not recorded"}
        </TableCell>
        <TableCell style={styles.cell}>
          <div {...props(styles.action)}>
            <p {...props(styles.requiredAction)}>
              {cjProgramRequiredAction(program.stage, warnings)}
            </p>
            <Button
              aria-controls={editorId}
              aria-expanded={isEditing}
              aria-label={`${isEditing ? "Close editor" : "Edit program"} ${programName}`}
              onClick={() => setIsEditing((open) => !open)}
              type="button"
              variant="secondary"
            >
              {isEditing ? "Close editor" : "Edit program"}
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {isEditing ? (
        <TableRow>
          <TableCell colSpan={4} style={styles.editorCell}>
            <div
              aria-label={`Edit ${programName}`}
              id={editorId}
              role="region"
              {...props(styles.editor)}
            >
              <div {...props(styles.controls)}>
                <Label style={styles.field}>
                  <span {...props(styles.label)}>Stage for {programName}</span>
                  <Select
                    disabled={isUpdateInFlight || !stage}
                    items={stageOptions}
                    onValueChange={(nextStage) => {
                      setStage(
                        CJ_PROGRAM_STAGES.find(({ value }) => value === nextStage)?.value ?? null,
                      );
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
            </div>
          </TableCell>
        </TableRow>
      ) : null}
    </>
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
