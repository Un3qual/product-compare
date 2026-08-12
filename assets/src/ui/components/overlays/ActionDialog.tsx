import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../../primitives/Dialog";
import type { PropsWithChildren, ReactElement, ReactNode } from "react";
import { create, props } from "@stylexjs/stylex";
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
    justifyContent: "end",
  },
});

export function ActionDialog({
  children,
  description,
  onOpenChange,
  open,
  title,
  trigger,
}: PropsWithChildren<{
  description?: ReactNode;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  title: string;
  trigger: ReactElement;
}>) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogTrigger render={trigger} />
      <DialogContent showCloseButton={false} {...props(styles.content)}>
        <DialogTitle {...props(styles.title)}>{title}</DialogTitle>
        {description ? (
          <DialogDescription {...props(styles.description)}>{description}</DialogDescription>
        ) : null}
        {children}
        <div {...props(styles.actions)}>
          <DialogClose render={<Button variant="secondary" />}>Close</DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
