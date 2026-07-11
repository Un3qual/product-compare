import { Callout } from "@radix-ui/themes";
import type { ReactNode } from "react";
import * as stylex from "@stylexjs/stylex";

const styles = stylex.create({
  root: {
    alignItems: "start"
  },
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

const colors = {
  empty: "gray",
  error: "red",
  loading: "blue",
  success: "green",
  warning: "amber"
} as const;

export function FeedbackState({
  action,
  description,
  kind,
  title
}: FeedbackStateProps) {
  const role = kind === "error" ? "alert" : "status";

  return (
    <Callout.Root
      {...stylex.props(styles.root)}
      color={colors[kind]}
      data-feedback-kind={kind}
      role={role}
      size="2"
      variant="surface"
    >
      <Callout.Text {...stylex.props(styles.body)}>
        <span {...stylex.props(styles.title)}>{title}</span>
        {description ? <span>{description}</span> : null}
      </Callout.Text>
      {action ? <div {...stylex.props(styles.action)}>{action}</div> : null}
    </Callout.Root>
  );
}
