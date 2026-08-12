import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";
import * as stylex from "@stylexjs/stylex";
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
  title: { fontSize: "1.35rem", fontWeight: 700, margin: 0 },
});

const hidden = (status: string | undefined) => status === "starting" || status === "ending";

export const AlertDialog = (props: ComponentProps<typeof AlertDialogPrimitive.Root>) => (
  <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
);
export const AlertDialogTrigger = (props: ComponentProps<typeof AlertDialogPrimitive.Trigger>) => (
  <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
);
export const AlertDialogAction = (props: ComponentProps<typeof AlertDialogPrimitive.Close>) => (
  <AlertDialogPrimitive.Close data-slot="alert-dialog-action" {...props} />
);
export const AlertDialogCancel = (props: ComponentProps<typeof AlertDialogPrimitive.Close>) => (
  <AlertDialogPrimitive.Close data-slot="alert-dialog-cancel" {...props} />
);

export function AlertDialogContent({
  children,
  style,
  ...popupProps
}: StyleXPrimitiveProps<ComponentProps<typeof AlertDialogPrimitive.Popup>>) {
  const popupStyleProps = (transitionStatus: string | undefined) =>
    stylex.props(styles.popup, hidden(transitionStatus) && styles.popupHidden, style);

  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Backdrop
        className={(state) =>
          stylex.props(styles.backdrop, hidden(state.transitionStatus) && styles.backdropHidden)
            .className
        }
        data-slot="alert-dialog-overlay"
      />
      <AlertDialogPrimitive.Popup
        className={(state) => popupStyleProps(state.transitionStatus).className}
        data-slot="alert-dialog-content"
        style={(state) => popupStyleProps(state.transitionStatus).style}
        {...popupProps}
      >
        {children}
      </AlertDialogPrimitive.Popup>
    </AlertDialogPrimitive.Portal>
  );
}

export function AlertDialogTitle({
  style,
  ...titleProps
}: StyleXPrimitiveProps<ComponentProps<typeof AlertDialogPrimitive.Title>>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      {...stylex.props(styles.title, style)}
      {...titleProps}
    />
  );
}

export function AlertDialogDescription({
  style,
  ...descriptionProps
}: StyleXPrimitiveProps<ComponentProps<typeof AlertDialogPrimitive.Description>>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      {...stylex.props(styles.description, style)}
      {...descriptionProps}
    />
  );
}
