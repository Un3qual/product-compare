import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";
import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";
import type { ComponentProps } from "react";
import { customClassName } from "./utils.stylex";

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

export function Collapsible(props: ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

export function CollapsibleTrigger({
  className,
  style,
  ...triggerProps
}: Omit<ComponentProps<typeof CollapsiblePrimitive.Trigger>, "className"> & {
  className?: string;
}) {
  return (
    <CollapsiblePrimitive.Trigger
      data-slot="collapsible-trigger"
      {...stylex.props(styles.trigger, customClassName(className), style as StyleXStyles)}
      {...triggerProps}
    />
  );
}

export function CollapsibleContent({
  className,
  style,
  ...panelProps
}: Omit<ComponentProps<typeof CollapsiblePrimitive.Panel>, "className"> & {
  className?: string;
}) {
  return (
    <CollapsiblePrimitive.Panel
      data-slot="collapsible-content"
      {...stylex.props(styles.panel, customClassName(className), style as StyleXStyles)}
      {...panelProps}
    />
  );
}
