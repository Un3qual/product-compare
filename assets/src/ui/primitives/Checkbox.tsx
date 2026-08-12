import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import * as stylex from "@stylexjs/stylex";
import { CheckIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { tokens } from "../theme/tokens.stylex";
import { customClassName } from "./utils.stylex";

const styles = stylex.create({
  indicator: {
    alignItems: "center",
    color: tokens.textInverted,
    display: "flex",
    height: "100%",
    justifyContent: "center",
    width: "100%",
  },
  root: {
    alignItems: "center",
    backgroundColor: tokens.surfaceRaised,
    borderColor: tokens.borderEmphasized,
    borderRadius: "var(--pc-radius-small)",
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
  rootChecked: {
    backgroundColor: tokens.actionAccent,
    borderColor: tokens.actionAccent,
  },
});

export type CheckboxProps = Omit<ComponentProps<typeof CheckboxPrimitive.Root>, "className"> & {
  className?: string;
};

export function Checkbox({ className, ...checkboxProps }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      className={(state) =>
        stylex.props(styles.root, state.checked && styles.rootChecked, customClassName(className))
          .className
      }
      data-slot="checkbox"
      {...checkboxProps}
    >
      <CheckboxPrimitive.Indicator
        {...stylex.props(styles.indicator)}
        data-slot="checkbox-indicator"
      >
        <CheckIcon aria-hidden="true" size={14} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
