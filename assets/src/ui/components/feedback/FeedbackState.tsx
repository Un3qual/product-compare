import type { ReactNode } from "react";
import { Callout, Spinner } from "@radix-ui/themes";
import { create, props } from "@stylexjs/stylex";

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

const kindColor = {
  empty: "gray",
  error: "red",
  loading: "indigo",
  success: "green",
  warning: "amber",
} as const;

export type FeedbackStateProps = {
  action?: ReactNode;
  description?: ReactNode;
  kind: FeedbackKind;
  title: string;
};

export function FeedbackState({ action, description, kind, title }: FeedbackStateProps) {
  const role = kind === "error" ? "alert" : "status";

  return (
    <Callout.Root
      color={kindColor[kind]}
      data-feedback-kind={kind}
      data-slot="feedback-state"
      role={role}
      variant="surface"
    >
      {kind === "loading" ? (
        <Callout.Icon>
          <Spinner aria-hidden data-slot="feedback-spinner" />
        </Callout.Icon>
      ) : null}
      <div>
        <Callout.Text {...props(styles.body)}>
          <strong {...props(styles.title)}>{title}</strong>
          {description ? <span>{description}</span> : null}
        </Callout.Text>
        {action ? <div {...props(styles.action)}>{action}</div> : null}
      </div>
    </Callout.Root>
  );
}
