import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";
import type { ComponentProps } from "react";
import { tokens } from "../theme/tokens.stylex";
import { customClassName } from "./utils.stylex";

const styles = stylex.create({
  group: {
    display: "flex",
    flexDirection: "column",
    gap: "0.625rem",
  },
  indicator: {
    backgroundColor: tokens.actionAccent,
    borderRadius: "9999px",
    height: "0.5rem",
    width: "0.5rem",
  },
  item: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderColor: tokens.borderEmphasized,
    borderRadius: "9999px",
    borderStyle: "solid",
    borderWidth: "1px",
    boxShadow: {
      ":focus-visible": "0 0 0 3px color-mix(in srgb, var(--pc-action-accent) 35%, transparent)",
      default: "0 1px 2px rgb(33 31 28 / 0.08)",
    },
    cursor: { ":disabled": "not-allowed", default: "pointer" },
    display: "inline-flex",
    flexShrink: 0,
    height: "1.125rem",
    justifyContent: "center",
    opacity: { ":disabled": 0.55, default: 1 },
    padding: 0,
    width: "1.125rem",
  },
  itemChecked: { borderColor: tokens.actionAccent },
});

export function RadioGroup({
  className,
  style,
  ...groupProps
}: Omit<ComponentProps<typeof RadioGroupPrimitive>, "className"> & {
  className?: string;
}) {
  return (
    <RadioGroupPrimitive
      {...stylex.props(styles.group, customClassName(className), style as StyleXStyles)}
      data-slot="radio-group"
      {...groupProps}
    />
  );
}

export function RadioGroupItem({
  className,
  ...itemProps
}: Omit<ComponentProps<typeof RadioPrimitive.Root>, "className"> & {
  className?: string;
}) {
  return (
    <RadioPrimitive.Root
      className={(state) =>
        stylex.props(styles.item, state.checked && styles.itemChecked, customClassName(className))
          .className
      }
      data-slot="radio-group-item"
      {...itemProps}
    >
      <RadioPrimitive.Indicator
        {...stylex.props(styles.indicator)}
        data-slot="radio-group-indicator"
      />
    </RadioPrimitive.Root>
  );
}
