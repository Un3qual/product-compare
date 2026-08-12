import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import * as stylex from "@stylexjs/stylex";
import type { ComponentProps } from "react";
import { tokens } from "../theme/tokens.stylex";
import type { StyleXPrimitiveProps } from "./stylex-props";

const styles = stylex.create({
  horizontal: { height: "1px", width: "100%" },
  root: { backgroundColor: tokens.borderQuiet, flexShrink: 0 },
  vertical: { height: "100%", width: "1px" },
});

export function Separator({
  orientation = "horizontal",
  style,
  ...separatorProps
}: StyleXPrimitiveProps<ComponentProps<typeof SeparatorPrimitive>>) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      {...stylex.props(
        styles.root,
        orientation === "vertical" ? styles.vertical : styles.horizontal,
        style,
      )}
      {...separatorProps}
    />
  );
}
