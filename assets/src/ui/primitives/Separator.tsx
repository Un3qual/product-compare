import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";
import type { ComponentProps } from "react";
import { tokens } from "../theme/tokens.stylex";
import { customClassName } from "./utils.stylex";

const styles = stylex.create({
  horizontal: { height: "1px", width: "100%" },
  root: { backgroundColor: tokens.borderQuiet, flexShrink: 0 },
  vertical: { height: "100%", width: "1px" },
});

export function Separator({
  className,
  orientation = "horizontal",
  style,
  ...separatorProps
}: Omit<ComponentProps<typeof SeparatorPrimitive>, "className"> & {
  className?: string;
}) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      {...stylex.props(
        styles.root,
        orientation === "vertical" ? styles.vertical : styles.horizontal,
        customClassName(className),
        style as StyleXStyles,
      )}
      {...separatorProps}
    />
  );
}
