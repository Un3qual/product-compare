import * as stylex from "@stylexjs/stylex";
import type { ComponentProps } from "react";
import { tokens } from "../theme/tokens.stylex";
import type { StyleXPrimitiveProps } from "./stylex-props";

type AlertProps = StyleXPrimitiveProps<ComponentProps<"div">> & {
  variant?: "default" | "destructive";
};

const styles = stylex.create({
  root: {
    backgroundColor: tokens.surfaceMuted,
    borderColor: tokens.border,
    borderRadius: "var(--pc-radius-medium)",
    borderStyle: "solid",
    borderWidth: "1px",
    color: tokens.text,
    display: "grid",
    fontSize: "0.9rem",
    gap: "0.35rem",
    paddingBlock: "0.85rem",
    paddingInline: "1rem",
    width: "100%",
  },
  destructive: {
    backgroundColor: "var(--pc-red-50)",
    borderColor: "color-mix(in srgb, var(--pc-danger) 30%, white)",
  },
  description: { color: tokens.textSecondary, display: "grid", gap: "0.25rem" },
  title: { fontWeight: 700 },
});

export function Alert({
  style,
  variant = "default",
  ...alertProps
}: AlertProps) {
  return (
    <div
      {...stylex.props(
        styles.root,
        variant === "destructive" && styles.destructive,
        style,
      )}
      data-slot="alert"
      data-variant={variant}
      role="alert"
      {...alertProps}
    />
  );
}

export function AlertTitle({
  style,
  ...titleProps
}: StyleXPrimitiveProps<ComponentProps<"div">>) {
  return (
    <div
      {...stylex.props(styles.title, style)}
      data-slot="alert-title"
      {...titleProps}
    />
  );
}

export function AlertDescription({
  style,
  ...descriptionProps
}: StyleXPrimitiveProps<ComponentProps<"div">>) {
  return (
    <div
      {...stylex.props(styles.description, style)}
      data-slot="alert-description"
      {...descriptionProps}
    />
  );
}
