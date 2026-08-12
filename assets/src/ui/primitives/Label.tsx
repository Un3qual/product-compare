import * as stylex from "@stylexjs/stylex";
import type { ComponentProps } from "react";
import { tokens } from "../theme/tokens.stylex";
import type { StyleXPrimitiveProps } from "./stylex-props";

const styles = stylex.create({
  root: {
    color: tokens.textSecondary,
    display: "grid",
    fontSize: "0.9rem",
    fontWeight: 600,
    gap: "0.35rem",
  },
});

export function Label({ style, ...labelProps }: StyleXPrimitiveProps<ComponentProps<"label">>) {
  return (
    <label
      {...stylex.props(styles.root, style)}
      data-slot="label"
      {...labelProps}
    />
  );
}
