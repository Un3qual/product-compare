import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";
import type { ComponentProps } from "react";
import { tokens } from "../theme/tokens.stylex";
import { customClassName } from "./utils.stylex";

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
  className,
  style,
  variant = "default",
  ...alertProps
}: ComponentProps<"div"> & { variant?: "default" | "destructive" }) {
  return (
    <div
      {...stylex.props(
        styles.root,
        variant === "destructive" && styles.destructive,
        customClassName(className),
        style as StyleXStyles,
      )}
      data-slot="alert"
      data-variant={variant}
      role="alert"
      {...alertProps}
    />
  );
}

export function AlertTitle({ className, style, ...titleProps }: ComponentProps<"div">) {
  return (
    <div
      {...stylex.props(styles.title, customClassName(className), style as StyleXStyles)}
      data-slot="alert-title"
      {...titleProps}
    />
  );
}

export function AlertDescription({ className, style, ...descriptionProps }: ComponentProps<"div">) {
  return (
    <div
      {...stylex.props(styles.description, customClassName(className), style as StyleXStyles)}
      data-slot="alert-description"
      {...descriptionProps}
    />
  );
}
