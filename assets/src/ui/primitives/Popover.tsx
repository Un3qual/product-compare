import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import * as stylex from "@stylexjs/stylex";
import type { ComponentProps } from "react";
import { tokens } from "../theme/tokens.stylex";
import { customClassName } from "./utils.stylex";

const styles = stylex.create({
  popup: {
    backgroundColor: tokens.surfaceRaised,
    borderColor: tokens.borderEmphasized,
    borderRadius: "var(--pc-radius-medium)",
    borderStyle: "solid",
    borderWidth: "1px",
    boxShadow: "var(--pc-shadow-overlay)",
    color: tokens.text,
    opacity: 1,
    outline: "none",
    padding: "0.7rem",
    transform: "scale(1)",
    transformOrigin: "var(--transform-origin)",
    transition: "opacity 0.15s ease-in-out, transform 0.15s ease-in-out",
    width: "18rem",
    zIndex: 50,
  },
  popupHidden: { opacity: 0, transform: "scale(0.98)" },
});

const hidden = (status: string | undefined) => status === "ending";

export function Popover(props: ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

export function PopoverTrigger(props: ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

export function PopoverContent({
  align = "center",
  alignOffset,
  children,
  className,
  collisionPadding,
  side = "bottom",
  sideOffset = 4,
  style,
  ...popupProps
}: Omit<ComponentProps<typeof PopoverPrimitive.Popup>, "className"> & {
  align?: "start" | "center" | "end";
  alignOffset?: number;
  className?: string;
  collisionPadding?: number;
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
}) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        collisionPadding={collisionPadding}
        side={side}
        sideOffset={sideOffset}
      >
        <PopoverPrimitive.Popup
          className={(state) =>
            stylex.props(
              styles.popup,
              hidden(state.transitionStatus) && styles.popupHidden,
              customClassName(className),
            ).className
          }
          data-slot="popover-content"
          style={style}
          {...popupProps}
        >
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}
