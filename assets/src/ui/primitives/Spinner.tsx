import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";
import { LoaderCircleIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { customClassName } from "./utils.stylex";

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
  className,
  style,
  ...spinnerProps
}: ComponentProps<typeof LoaderCircleIcon>) {
  return (
    <LoaderCircleIcon
      aria-label="Loading"
      {...stylex.props(styles.root, customClassName(className), style as StyleXStyles)}
      data-slot="spinner"
      role="status"
      {...spinnerProps}
    />
  );
}
