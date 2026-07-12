import type { ReactNode } from "react";
import { create, props } from "@stylexjs/stylex";

const styles = create({
  body: {
    display: "grid",
    gap: "0.35rem"
  },
  title: {
    fontWeight: 700
  },
  action: {
    marginTop: "0.55rem"
  }
});

type FeedbackKind = "empty" | "error" | "loading" | "success" | "warning";

export type FeedbackStateProps = {
  action?: ReactNode;
  description?: ReactNode;
  kind: FeedbackKind;
  title: string;
};

export function FeedbackState({
  action,
  description,
  kind,
  title
}: FeedbackStateProps) {
  const role = kind === "error" ? "alert" : "status";

  return (
    <div data-feedback-kind={kind} data-slot="feedback-state" role={role}>
      <div {...props(styles.body)}>
        <span {...props(styles.title)}>{title}</span>
        {description ? <span>{description}</span> : null}
      </div>
      {action ? <div {...props(styles.action)}>{action}</div> : null}
    </div>
  );
}
