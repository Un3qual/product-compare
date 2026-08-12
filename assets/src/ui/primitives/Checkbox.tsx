import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import * as stylex from "@stylexjs/stylex";
import { CheckIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ComponentProps, type Ref } from "react";
import { tokens } from "../theme/tokens.stylex";
import type { StyleXPrimitiveProps } from "./stylex-props";

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
    backgroundColor: "transparent",
    borderWidth: 0,
    boxShadow: {
      ":focus-visible": "0 0 0 3px color-mix(in srgb, var(--pc-action-accent) 35%, transparent)",
      default: null,
    },
    cursor: {
      ":disabled": "not-allowed",
      ":where([aria-disabled=true])": "not-allowed",
      default: "pointer",
    },
    display: "inline-flex",
    flexShrink: 0,
    height: tokens.controlHeight,
    justifyContent: "center",
    opacity: { ":disabled": 0.55, ":where([aria-disabled=true])": 0.55, default: 1 },
    padding: 0,
    width: tokens.controlHeight,
  },
  mark: {
    alignItems: "center",
    backgroundColor: tokens.surfaceRaised,
    borderColor: tokens.borderEmphasized,
    borderRadius: "var(--pc-radius-small)",
    borderStyle: "solid",
    borderWidth: "1px",
    boxShadow: "0 1px 2px rgb(33 31 28 / 0.08)",
    display: "inline-flex",
    height: "1.125rem",
    justifyContent: "center",
    width: "1.125rem",
  },
  markChecked: {
    backgroundColor: tokens.actionAccent,
    borderColor: tokens.actionAccent,
  },
});

export type CheckboxProps = StyleXPrimitiveProps<
  ComponentProps<typeof CheckboxPrimitive.Root>
>;

type CheckboxChangeHandler = NonNullable<CheckboxProps["onCheckedChange"]>;

export function Checkbox({
  checked: controlledChecked,
  defaultChecked = false,
  inputRef,
  onCheckedChange,
  style,
  ...checkboxProps
}: CheckboxProps) {
  const controlled = controlledChecked !== undefined;
  const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const mergedInputRef = useCallback(
    (node: HTMLInputElement | null) => {
      hiddenInputRef.current = node;
      assignRef(inputRef, node);
    },
    [inputRef],
  );
  const handleCheckedChange: CheckboxChangeHandler = (nextChecked, eventDetails) => {
    onCheckedChange?.(nextChecked, eventDetails);

    if (!controlled && !eventDetails.isCanceled) {
      setUncontrolledChecked(nextChecked);
    }
  };

  useEffect(() => {
    const form = hiddenInputRef.current?.form;

    if (!form || controlled) {
      return;
    }

    const handleReset = () => setUncontrolledChecked(defaultChecked);
    form.addEventListener("reset", handleReset);

    return () => form.removeEventListener("reset", handleReset);
  }, [controlled, defaultChecked]);

  return (
    <CheckboxPrimitive.Root
      {...stylex.props(styles.root, style)}
      checked={controlled ? controlledChecked : uncontrolledChecked}
      data-slot="checkbox"
      inputRef={mergedInputRef}
      onCheckedChange={handleCheckedChange}
      render={(rootRenderProps, state) => (
        <span {...rootRenderProps}>
          <span {...stylex.props(styles.mark, state.checked && styles.markChecked)}>
            <CheckboxPrimitive.Indicator
              {...stylex.props(styles.indicator)}
              data-slot="checkbox-indicator"
            >
              <CheckIcon aria-hidden="true" size={14} />
            </CheckboxPrimitive.Indicator>
          </span>
        </span>
      )}
      {...checkboxProps}
    />
  );
}

function assignRef<Value>(ref: Ref<Value> | undefined, value: Value | null): void {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}
