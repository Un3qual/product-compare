import * as stylex from "@stylexjs/stylex";
import { LoaderCircleIcon } from "lucide-react";
import type { ComponentProps } from "react";
import type { StyleXPrimitiveProps } from "./stylex-props";

const spin = stylex.keyframes({
  from: { transform: "rotate(0deg)" },
  to: { transform: "rotate(360deg)" },
});

const styles = stylex.create({
  root: {
    animationDuration: "1s",
    animationIterationCount: "infinite",
    animationName: spin,
    animationTimingFunction: "linear",
    flexShrink: 0,
    height: "1rem",
    width: "1rem",
  },
});

export function Spinner({
  style,
  ...spinnerProps
}: StyleXPrimitiveProps<ComponentProps<typeof LoaderCircleIcon>>) {
  return (
    <LoaderCircleIcon
      aria-label="Loading"
      {...stylex.props(styles.root, style)}
      data-slot="spinner"
      role="status"
      {...spinnerProps}
    />
  );
}
