import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";
import type { ComponentProps } from "react";
import { tokens } from "../theme/tokens.stylex";
import { customClassName } from "./utils.stylex";

const styles = stylex.create({
  root: {
    "::placeholder": { color: tokens.textSubtle },
    "::selection": {
      backgroundColor: tokens.actionAccent,
      color: tokens.textInverted,
    },
    backgroundColor: tokens.surfaceRaised,
    borderColor: {
      ":focus-visible": tokens.actionAccent,
      ":hover": tokens.borderEmphasized,
      default: tokens.border,
    },
    borderRadius: "var(--pc-radius-medium)",
    borderStyle: "solid",
    borderWidth: "1px",
    boxShadow: {
      ":focus-visible": "0 0 0 3px color-mix(in srgb, var(--pc-action-accent) 25%, transparent)",
      default: "0 1px 2px rgb(33 31 28 / 0.05)",
    },
    color: tokens.text,
    cursor: { ":disabled": "not-allowed", default: "auto" },
    display: "flex",
    fontFamily: tokens.fontSans,
    fontSize: "0.9rem",
    lineHeight: "1.25rem",
    minHeight: tokens.controlHeight,
    minWidth: 0,
    opacity: { ":disabled": 0.55, default: 1 },
    paddingBlock: "0.55rem",
    paddingInline: "0.7rem",
    transition: "box-shadow 0.15s, border-color 0.15s",
    width: "100%",
  },
});

export type InputProps = ComponentProps<"input">;

export function Input({ className, style, type, ...inputProps }: InputProps) {
  return (
    <input
      {...stylex.props(styles.root, customClassName(className), style as StyleXStyles)}
      data-slot="input"
      type={type}
      {...inputProps}
    />
  );
}
