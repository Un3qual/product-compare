import * as RadixSelect from "@radix-ui/react-select";
import { create, props } from "@stylexjs/stylex";
import { useEffect, useRef, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";

const EMPTY_VALUE = "__product_compare_empty_select_value__";

export type SelectOption = {
  disabled?: boolean;
  label: ReactNode;
  value: string;
};

import { tokens } from "../theme/tokens.stylex";

type SelectTriggerProps = Pick<
  ComponentPropsWithoutRef<typeof RadixSelect.Trigger>,
  "aria-label" | "aria-labelledby" | "className" | "id"
> & {
  placeholder?: ReactNode;
};

export type SelectProps = Omit<
  ComponentPropsWithoutRef<typeof RadixSelect.Root>,
  "children" | "defaultValue" | "name" | "onValueChange" | "value"
> &
  SelectTriggerProps & {
    defaultValue?: string;
    name?: string;
    onValueChange?: (value: string) => void;
    options: readonly SelectOption[];
    value?: string;
  };

const styles = create({
  content: {
    backgroundColor: tokens.surface,
    borderColor: tokens.borderEmphasized,
    borderRadius: "var(--pc-radius-medium)",
    borderStyle: "solid",
    borderWidth: "1px",
    boxShadow: "var(--pc-shadow-overlay)",
    color: tokens.text,
    maxHeight: "var(--radix-select-content-available-height)",
    minWidth: "var(--radix-select-trigger-width)",
    overflow: "hidden",
    zIndex: 50,
  },
  item: {
    backgroundColor: {
      ":where([data-highlighted])": tokens.surfaceInteractive,
    },
    color: {
      ":where([data-highlighted])": tokens.text,
    },
    cursor: "pointer",
    outline: "none",
    paddingBlock: "0.45rem",
    paddingInline: "0.7rem",
  },
  trigger: {
    alignItems: "center",
    backgroundColor: tokens.surface,
    borderColor: tokens.borderEmphasized,
    borderRadius: "var(--pc-radius-medium)",
    borderStyle: "solid",
    borderWidth: "1px",
    color: tokens.text,
    display: "inline-flex",
    justifyContent: "space-between",
    minHeight: "2.6rem",
    minWidth: "8rem",
    paddingInline: "0.7rem",
  },
  viewport: {
    paddingBlock: "0.25rem",
  },
});

export function Select(selectProps: SelectProps) {
  const {
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    className,
    defaultValue = "",
    disabled,
    form,
    id,
    name,
    onValueChange,
    options,
    placeholder,
    required,
    value,
    ...rootProps
  } = selectProps;
  const controlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const selectedValue = controlled ? value : uncontrolledValue;
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const optionSetKey = options.map((option) => encodeValue(option.value)).join("\u0000");

  useEffect(() => {
    const formElement = hiddenInputRef.current?.form;

    if (!formElement || controlled) {
      return;
    }

    const reset = () => setUncontrolledValue(defaultValue);
    formElement.addEventListener("reset", reset);

    return () => formElement.removeEventListener("reset", reset);
  }, [controlled, defaultValue]);

  function changeValue(nextValue: string) {
    const decodedValue = decodeValue(nextValue);

    if (!controlled) {
      setUncontrolledValue(decodedValue);
    }

    onValueChange?.(decodedValue);
  }

  return (
    <>
      <RadixSelect.Root
        {...rootProps}
        disabled={disabled}
        form={form}
        key={optionSetKey}
        onValueChange={changeValue}
        required={required}
        value={encodeValue(selectedValue)}
      >
        <RadixSelect.Trigger
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          className={[props(styles.trigger).className, className].filter(Boolean).join(" ")}
          data-slot="select"
          id={id}
          value={selectedValue}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon aria-hidden="true">▾</RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content position="popper" {...props(styles.content)}>
            <RadixSelect.Viewport {...props(styles.viewport)}>
              {options.map((option) => (
                <RadixSelect.Item
                  disabled={option.disabled}
                  key={option.value}
                  value={encodeValue(option.value)}
                  {...props(styles.item)}
                >
                  <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
      {name ? (
        <input
          disabled={disabled}
          form={form}
          name={name}
          ref={hiddenInputRef}
          type="hidden"
          value={selectedValue}
        />
      ) : null}
    </>
  );
}

function encodeValue(value: string) {
  return value === "" ? EMPTY_VALUE : value;
}

function decodeValue(value: string) {
  return value === EMPTY_VALUE ? "" : value;
}
