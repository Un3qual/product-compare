import type { ReactNode } from "react";
import { create, props } from "@stylexjs/stylex";
import { Alert, AlertDescription } from "../../primitives/Alert";
import { Spinner } from "../../primitives/Spinner";

const styles = create({
  body: {
    display: "grid",
    gap: "0.35rem",
    margin: 0,
  },
  title: {
    fontWeight: 700,
  },
  action: {
    marginTop: "0.55rem",
  },
});

type FeedbackKind = "empty" | "error" | "loading" | "success" | "warning";

export type FeedbackStateProps = {
  action?: ReactNode;
  description?: ReactNode;
  kind: FeedbackKind;
  title: string;
};

export function FeedbackState({ action, description, kind, title }: FeedbackStateProps) {
  const role = kind === "error" ? "alert" : "status";

  return (
    <Alert
      data-feedback-kind={kind}
      data-slot="feedback-state"
      role={role}
      variant={kind === "error" ? "destructive" : "default"}
    >
      {kind === "loading" ? <Spinner aria-hidden data-slot="feedback-spinner" /> : null}
      <div>
        <AlertDescription {...props(styles.body)}>
          <strong {...props(styles.title)}>{title}</strong>
          {description ? <span>{description}</span> : null}
        </AlertDescription>
        {action ? <div {...props(styles.action)}>{action}</div> : null}
      </div>
    </Alert>
  );
}
