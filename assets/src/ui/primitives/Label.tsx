import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";
import type { ComponentProps } from "react";
import { tokens } from "../theme/tokens.stylex";
import { customClassName } from "./utils.stylex";

const styles = stylex.create({
  root: {
    color: tokens.textSecondary,
    display: "grid",
    fontSize: "0.9rem",
    fontWeight: 600,
    gap: "0.35rem",
  },
});

export function Label({ className, style, ...labelProps }: ComponentProps<"label">) {
  return (
    <label
      {...stylex.props(styles.root, customClassName(className), style as StyleXStyles)}
      data-slot="label"
      {...labelProps}
    />
  );
}
