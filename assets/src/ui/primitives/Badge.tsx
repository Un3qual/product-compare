import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";
import type { ComponentProps } from "react";
import { tokens } from "../theme/tokens.stylex";
import type { StyleXPrimitiveProps } from "./stylex-props";

const styles = stylex.create({
  base: {
    alignSelf: "start",
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: "999px",
    borderStyle: "solid",
    borderWidth: "1px",
    display: "inline-flex",
    flexShrink: 0,
    fontSize: "0.76rem",
    fontWeight: 700,
    gap: "0.25rem",
    lineHeight: 1.4,
    paddingBlock: "0.18rem",
    paddingInline: "0.55rem",
    whiteSpace: "nowrap",
    width: "fit-content",
  },
  default: { backgroundColor: tokens.actionAccent, color: tokens.textInverted },
  destructive: { backgroundColor: "var(--pc-red-50)", color: "var(--pc-danger)" },
  outline: { borderColor: tokens.border, color: tokens.text },
  secondary: { backgroundColor: tokens.surfaceMuted, color: tokens.textSecondary },
});

export type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const variants: Record<BadgeVariant, StyleXStyles> = {
  default: styles.default,
  destructive: styles.destructive,
  outline: styles.outline,
  secondary: styles.secondary,
};

export type BadgeProps = StyleXPrimitiveProps<ComponentProps<"span">> & {
  variant?: BadgeVariant;
};

export function Badge({ style, variant = "default", ...badgeProps }: BadgeProps) {
  return (
    <span
      {...stylex.props(styles.base, variants[variant], style)}
      data-slot="badge"
      data-variant={variant}
      {...badgeProps}
    />
  );
}
