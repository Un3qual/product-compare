import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../primitives/AlertDialog";
import { create, props } from "@stylexjs/stylex";
import type { ReactElement, ReactNode } from "react";
import { Button } from "../../primitives/Button";
import { tokens } from "../../theme/tokens.stylex";

const styles = create({
  content: {
    backgroundColor: tokens.surfaceRaised,
    borderColor: tokens.border,
    borderRadius: "var(--pc-radius-large)",
    borderStyle: "solid",
    borderWidth: "1px",
    boxShadow: "var(--pc-shadow-overlay)",
    display: "grid",
    gap: "1rem",
    insetInlineStart: "50%",
    maxHeight: "calc(100vh - 2rem)",
    maxWidth: "36rem",
    overflowY: "auto",
    padding: "1.5rem",
    position: "fixed",
    top: "50%",
    transform: "translate(-50%, -50%)",
    width: "calc(100vw - 2rem)",
    zIndex: 21,
  },
  title: {
    fontSize: "1.35rem",
    fontWeight: 750,
    margin: 0,
  },
  description: {
    color: tokens.textSecondary,
    lineHeight: 1.55,
    margin: 0,
  },
  actions: {
    display: "flex",
    gap: "0.5rem",
    justifyContent: "end",
  },
});

export type DestructiveActionDialogProps = {
  confirmLabel: string;
  description: ReactNode;
  disabled?: boolean;
  onConfirm: () => void;
  title: string;
  trigger: ReactElement;
};

export function DestructiveActionDialog({
  confirmLabel,
  description,
  disabled = false,
  onConfirm,
  title,
  trigger,
}: DestructiveActionDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={trigger} />
      <DestructiveActionDialogContent
        confirmLabel={confirmLabel}
        description={description}
        disabled={disabled}
        onConfirm={onConfirm}
        title={title}
      />
    </AlertDialog>
  );
}

function DestructiveActionDialogContent({
  confirmLabel,
  description,
  disabled,
  onConfirm,
  title,
}: Omit<DestructiveActionDialogProps, "trigger">) {
  return (
    <AlertDialogContent {...props(styles.content)}>
      <AlertDialogTitle {...props(styles.title)}>{title}</AlertDialogTitle>
      <AlertDialogDescription {...props(styles.description)}>{description}</AlertDialogDescription>
      <div {...props(styles.actions)}>
        <AlertDialogCancel render={<Button variant="secondary" />}>Cancel</AlertDialogCancel>
        <AlertDialogAction
          render={<Button disabled={disabled} onClick={onConfirm} variant="destructive" />}
        >
          {confirmLabel}
        </AlertDialogAction>
      </div>
    </AlertDialogContent>
  );
}
