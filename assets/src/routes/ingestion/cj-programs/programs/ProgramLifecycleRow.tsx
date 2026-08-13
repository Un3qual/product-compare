import { useEffect, useId, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { useRevalidator } from "react-router-dom";
import { graphql, useFragment, useMutation } from "react-relay";
import type { ProgramLifecycleRow_program$key } from "$generated/ProgramLifecycleRow_program.graphql";
import type { ProgramLifecycleRowUpdateCJProgramMutation } from "$generated/ProgramLifecycleRowUpdateCJProgramMutation.graphql";
import { StatusBadge } from "$ui/components/status/StatusBadge";
import { TableCell, TableHead, TableRow } from "$ui/primitives/Table";
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
  cell: {
    color: tokens.text,
    fontWeight: 400,
    minWidth: "9rem",
    verticalAlign: "top",
  },
  action: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.2rem 0.65rem",
  },
  facts: {
    alignItems: "center",
    color: tokens.textSecondary,
    display: "flex",
    fontSize: "0.84rem",
    flexWrap: "wrap",
    gap: "0.1rem 0.45rem",
    lineHeight: 1.3,
    marginBlock: "0.15rem 0",
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
  lifecycle: { display: "grid", gap: "0.25rem", justifyItems: "start" },
  programName: { display: "block", fontSize: "1rem", fontWeight: 750, lineHeight: 1.25 },
  requiredAction: { fontWeight: 600, margin: 0 },
  warnings: {
    color: tokens.textSecondary,
    display: "grid",
    fontSize: "0.82rem",
    gap: "0.15rem",
    lineHeight: 1.3,
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
        <TableHead scope="row" style={styles.cell}>
          <strong {...props(styles.programName)}>{programName}</strong>
          <p {...props(styles.facts)}>
            <span>CJ Affiliate</span>
            <span>Advertiser ID {program.advertiserId}</span>
            <span>{formatFeedCount(program.feedCount)}</span>
          </p>
        </TableHead>
        <TableCell style={styles.cell}>
          <div {...props(styles.lifecycle)}>
            {stageLabel ? <StatusBadge>{stageLabel}</StatusBadge> : null}
            <CJProgramWarnings programName={programName} warnings={warnings} />
          </div>
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
              size="sm"
              type="button"
              variant="link"
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
