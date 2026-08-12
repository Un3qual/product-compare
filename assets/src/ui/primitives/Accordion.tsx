import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import * as stylex from "@stylexjs/stylex";
import { ChevronDownIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { tokens } from "../theme/tokens.stylex";
import type { StyleXPrimitiveProps } from "./stylex-props";

const styles = stylex.create({
  header: { display: "flex", margin: 0 },
  item: {
    borderBottomColor: tokens.borderQuiet,
    borderBottomStyle: "solid",
    borderBottomWidth: "1px",
  },
  panel: {
    color: tokens.textSecondary,
    lineHeight: 1.6,
    overflow: "hidden",
    paddingBlockEnd: "1rem",
  },
  trigger: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 0,
    color: tokens.text,
    cursor: "pointer",
    display: "flex",
    fontFamily: tokens.fontSans,
    fontWeight: 700,
    justifyContent: "space-between",
    minHeight: tokens.controlHeight,
    paddingInline: 0,
    textAlign: "start",
    width: "100%",
  },
  icon: { flexShrink: 0, transition: "transform 0.2s" },
  iconOpen: { transform: "rotate(180deg)" },
});

export function Accordion({
  style,
  ...rootProps
}: StyleXPrimitiveProps<ComponentProps<typeof AccordionPrimitive.Root>>) {
  return (
    <AccordionPrimitive.Root
      {...stylex.props(style)}
      data-slot="accordion"
      {...rootProps}
    />
  );
}

export function AccordionItem({
  style,
  ...itemProps
}: StyleXPrimitiveProps<ComponentProps<typeof AccordionPrimitive.Item>>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      {...stylex.props(styles.item, style)}
      {...itemProps}
    />
  );
}

export function AccordionTrigger({
  children,
  style,
  ...triggerProps
}: StyleXPrimitiveProps<ComponentProps<typeof AccordionPrimitive.Trigger>>) {
  return (
    <AccordionPrimitive.Header {...stylex.props(styles.header)}>
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        {...stylex.props(styles.trigger, style)}
        render={(renderProps, state) => (
          <button type="button" {...renderProps}>
            {children}
            <ChevronDownIcon
              aria-hidden="true"
              {...stylex.props(styles.icon, state.open && styles.iconOpen)}
              size={16}
            />
          </button>
        )}
        {...triggerProps}
      />
    </AccordionPrimitive.Header>
  );
}

export function AccordionContent({
  style,
  ...panelProps
}: StyleXPrimitiveProps<ComponentProps<typeof AccordionPrimitive.Panel>>) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      {...stylex.props(styles.panel, style)}
      {...panelProps}
    />
  );
}
