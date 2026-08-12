import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import * as stylex from "@stylexjs/stylex";
import { XIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { tokens } from "../theme/tokens.stylex";
import type { StyleXPrimitiveProps } from "./stylex-props";

const styles = stylex.create({
  backdrop: {
    backgroundColor: "rgb(18 24 38 / 0.45)",
    inset: 0,
    opacity: 1,
    position: "fixed",
    transition: "opacity 0.15s",
    zIndex: 50,
  },
  backdropHidden: { opacity: 0 },
  close: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: "var(--pc-radius-small)",
    borderWidth: 0,
    color: tokens.text,
    cursor: "pointer",
    display: "flex",
    insetInlineEnd: "1rem",
    justifyContent: "center",
    padding: "0.25rem",
    position: "absolute",
    top: "1rem",
  },
  description: { color: tokens.textSecondary, lineHeight: 1.55, margin: 0 },
  popup: {
    backgroundColor: tokens.surfaceRaised,
    borderColor: tokens.border,
    borderRadius: "var(--pc-radius-large)",
    borderStyle: "solid",
    borderWidth: "1px",
    boxShadow: "var(--pc-shadow-overlay)",
    color: tokens.text,
    display: "grid",
    gap: "1rem",
    left: "50%",
    maxHeight: "calc(100vh - 2rem)",
    maxWidth: "36rem",
    opacity: 1,
    outline: "none",
    overflowY: "auto",
    padding: "1.5rem",
    position: "fixed",
    top: "50%",
    transform: "translate(-50%, -50%) scale(1)",
    transition: "opacity 0.2s, transform 0.2s",
    width: "calc(100vw - 2rem)",
    zIndex: 51,
  },
  popupHidden: { opacity: 0, transform: "translate(-50%, -50%) scale(0.98)" },
  srOnly: {
    clip: "rect(0, 0, 0, 0)",
    height: "1px",
    overflow: "hidden",
    position: "absolute",
    whiteSpace: "nowrap",
    width: "1px",
  },
  title: { fontSize: "1.35rem", fontWeight: 700, margin: 0 },
});

const hidden = (status: string | undefined) => status === "starting" || status === "ending";

export const Dialog = (props: ComponentProps<typeof DialogPrimitive.Root>) => (
  <DialogPrimitive.Root data-slot="dialog" {...props} />
);
export const DialogTrigger = (props: ComponentProps<typeof DialogPrimitive.Trigger>) => (
  <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
);
export const DialogClose = (props: ComponentProps<typeof DialogPrimitive.Close>) => (
  <DialogPrimitive.Close data-slot="dialog-close" {...props} />
);

export function DialogOverlay({
  style,
  ...backdropProps
}: StyleXPrimitiveProps<ComponentProps<typeof DialogPrimitive.Backdrop>>) {
  const backdropStyleProps = (transitionStatus: string | undefined) =>
    stylex.props(styles.backdrop, hidden(transitionStatus) && styles.backdropHidden, style);

  return (
    <DialogPrimitive.Backdrop
      className={(state) => backdropStyleProps(state.transitionStatus).className}
      data-slot="dialog-overlay"
      style={(state) => backdropStyleProps(state.transitionStatus).style}
      {...backdropProps}
    />
  );
}

export function DialogContent({
  children,
  showCloseButton = true,
  style,
  ...popupProps
}: StyleXPrimitiveProps<ComponentProps<typeof DialogPrimitive.Popup>> & {
  showCloseButton?: boolean;
}) {
  const popupStyleProps = (transitionStatus: string | undefined) =>
    stylex.props(styles.popup, hidden(transitionStatus) && styles.popupHidden, style);

  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        className={(state) => popupStyleProps(state.transitionStatus).className}
        data-slot="dialog-content"
        style={(state) => popupStyleProps(state.transitionStatus).style}
        {...popupProps}
      >
        {children}
        {showCloseButton ? (
          <DialogPrimitive.Close {...stylex.props(styles.close)}>
            <XIcon aria-hidden="true" size={16} />
            <span {...stylex.props(styles.srOnly)}>Close</span>
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

export function DialogTitle({
  style,
  ...titleProps
}: StyleXPrimitiveProps<ComponentProps<typeof DialogPrimitive.Title>>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      {...stylex.props(styles.title, style)}
      {...titleProps}
    />
  );
}

export function DialogDescription({
  style,
  ...descriptionProps
}: StyleXPrimitiveProps<ComponentProps<typeof DialogPrimitive.Description>>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      {...stylex.props(styles.description, style)}
      {...descriptionProps}
    />
  );
}
