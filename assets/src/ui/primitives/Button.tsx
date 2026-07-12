import type { ComponentPropsWithoutRef } from "react";
import { Slot } from "./Slot";

export type ButtonVariant = "ghost" | "soft" | "solid";

export type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  asChild?: boolean;
  size?: "1" | "2" | "3";
  variant?: ButtonVariant;
};

export function Button({
  asChild = false,
  size = "2",
  type,
  variant = "solid",
  ...buttonProps
}: ButtonProps) {
  const Component = asChild ? Slot : "button";

  return (
    <Component
      {...buttonProps}
      data-size={size}
      data-slot="button"
      data-variant={variant}
      type={asChild ? undefined : (type ?? "button")}
    />
  );
}
