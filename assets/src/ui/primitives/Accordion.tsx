import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";
import { ChevronDownIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { tokens } from "../theme/tokens.stylex";
import { customClassName } from "./utils.stylex";

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

export function Accordion(props: ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

export function AccordionItem({
  className,
  style,
  ...itemProps
}: Omit<ComponentProps<typeof AccordionPrimitive.Item>, "className"> & { className?: string }) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      {...stylex.props(styles.item, customClassName(className), style as StyleXStyles)}
      {...itemProps}
    />
  );
}

export function AccordionTrigger({
  children,
  className,
  style,
  ...triggerProps
}: Omit<ComponentProps<typeof AccordionPrimitive.Trigger>, "className"> & { className?: string }) {
  return (
    <AccordionPrimitive.Header {...stylex.props(styles.header)}>
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        {...stylex.props(styles.trigger, customClassName(className), style as StyleXStyles)}
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
  className,
  style,
  ...panelProps
}: Omit<ComponentProps<typeof AccordionPrimitive.Panel>, "className"> & { className?: string }) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      {...stylex.props(styles.panel, customClassName(className), style as StyleXStyles)}
      {...panelProps}
    />
  );
}
