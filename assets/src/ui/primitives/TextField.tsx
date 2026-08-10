import { TextField as RadixTextField } from "@radix-ui/themes";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { MINIMUM_TOUCH_TARGET } from "./Button";

export type TextFieldProps = ComponentPropsWithoutRef<typeof RadixTextField.Root>;

export const TextField = forwardRef<ElementRef<typeof RadixTextField.Root>, TextFieldProps>(
  function TextField({ style, ...props }, ref) {
    return (
      <RadixTextField.Root
        data-focus-ring="visible"
        data-slot="text-field"
        ref={ref}
        style={{ ...style, minHeight: MINIMUM_TOUCH_TARGET }}
        {...props}
      />
    );
  },
);
