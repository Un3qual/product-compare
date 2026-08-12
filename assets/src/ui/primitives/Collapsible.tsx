import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";
import * as stylex from "@stylexjs/stylex";
import type { ComponentProps } from "react";
import type { StyleXPrimitiveProps } from "./stylex-props";

const styles = stylex.create({
  panel: {
    overflow: "hidden",
    transition: "height 0.2s ease-in-out",
  },
  trigger: {
    alignItems: "center",
    background: "none",
    borderWidth: 0,
    color: "inherit",
    cursor: "pointer",
    display: "inline-flex",
    font: "inherit",
    gap: "0.25rem",
    padding: 0,
  },
});

export function Collapsible({
  style,
  ...rootProps
}: StyleXPrimitiveProps<ComponentProps<typeof CollapsiblePrimitive.Root>>) {
  return (
    <CollapsiblePrimitive.Root
      {...stylex.props(style)}
      data-slot="collapsible"
      {...rootProps}
    />
  );
}

export function CollapsibleTrigger({
  style,
  ...triggerProps
}: StyleXPrimitiveProps<ComponentProps<typeof CollapsiblePrimitive.Trigger>>) {
  return (
    <CollapsiblePrimitive.Trigger
      data-slot="collapsible-trigger"
      {...stylex.props(styles.trigger, style)}
      {...triggerProps}
    />
  );
}

export function CollapsibleContent({
  style,
  ...panelProps
}: StyleXPrimitiveProps<ComponentProps<typeof CollapsiblePrimitive.Panel>>) {
  return (
    <CollapsiblePrimitive.Panel
      data-slot="collapsible-content"
      {...stylex.props(styles.panel, style)}
      {...panelProps}
    />
  );
}
