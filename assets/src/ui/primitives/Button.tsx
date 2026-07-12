import type { ComponentPropsWithoutRef } from "react";
import { Slot } from "./Slot";

export type ButtonVariant = "ghost" | "soft" | "solid";
export type ButtonTone = "accent" | "danger";

export type ButtonProps = Omit<ComponentPropsWithoutRef<"button">, "color"> & {
  asChild?: boolean;
  size?: "1" | "2" | "3";
  tone?: ButtonTone;
  variant?: ButtonVariant;
};

export function Button({
  asChild = false,
  size = "2",
  tone = "accent",
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
      data-tone={tone}
      data-variant={variant}
      type={asChild ? undefined : (type ?? "button")}
    />
  );
}
