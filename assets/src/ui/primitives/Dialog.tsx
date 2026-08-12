import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";
import { XIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { tokens } from "../theme/tokens.stylex";
import { customClassName } from "./utils.stylex";

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

export function DialogOverlay(props: ComponentProps<typeof DialogPrimitive.Backdrop>) {
  return (
    <DialogPrimitive.Backdrop
      className={(state) =>
        stylex.props(styles.backdrop, hidden(state.transitionStatus) && styles.backdropHidden)
          .className
      }
      data-slot="dialog-overlay"
      {...props}
    />
  );
}

export function DialogContent({
  children,
  className,
  showCloseButton = true,
  style,
  ...popupProps
}: Omit<ComponentProps<typeof DialogPrimitive.Popup>, "className"> & {
  className?: string;
  showCloseButton?: boolean;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        className={(state) =>
          stylex.props(
            styles.popup,
            hidden(state.transitionStatus) && styles.popupHidden,
            customClassName(className),
          ).className
        }
        data-slot="dialog-content"
        style={style}
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
  className,
  style,
  ...titleProps
}: Omit<ComponentProps<typeof DialogPrimitive.Title>, "className"> & { className?: string }) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      {...stylex.props(styles.title, customClassName(className), style as StyleXStyles)}
      {...titleProps}
    />
  );
}

export function DialogDescription({
  className,
  style,
  ...descriptionProps
}: Omit<ComponentProps<typeof DialogPrimitive.Description>, "className"> & { className?: string }) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      {...stylex.props(styles.description, customClassName(className), style as StyleXStyles)}
      {...descriptionProps}
    />
  );
}
