import {
  Action,
  Cancel,
  Content,
  Description,
  Overlay,
  Portal,
  Root,
  Title,
  Trigger,
} from "@radix-ui/react-alert-dialog";
import { create, props } from "@stylexjs/stylex";
import type { ReactElement, ReactNode } from "react";
import { Button } from "../../primitives/Button";
import { tokens } from "../../theme/tokens.stylex";

const styles = create({
  overlay: {
    backgroundColor: "rgba(18, 24, 38, 0.45)",
    inset: 0,
    position: "fixed",
    zIndex: 20,
  },
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
    <Root>
      <Trigger asChild>{trigger}</Trigger>
      <Portal>
        <Overlay {...props(styles.overlay)} />
        <Content {...props(styles.content)}>
          <Title {...props(styles.title)}>{title}</Title>
          <Description {...props(styles.description)}>{description}</Description>
          <div {...props(styles.actions)}>
            <Cancel asChild>
              <Button variant="soft">Cancel</Button>
            </Cancel>
            <Action asChild>
              <Button disabled={disabled} onClick={onConfirm} tone="danger">
                {confirmLabel}
              </Button>
            </Action>
          </div>
        </Content>
      </Portal>
    </Root>
  );
}
