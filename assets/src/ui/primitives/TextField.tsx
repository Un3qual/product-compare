import { TextField as RadixTextField } from "@radix-ui/themes";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";

export type TextFieldProps = ComponentPropsWithoutRef<typeof RadixTextField.Root>;

export const TextField = forwardRef<ElementRef<typeof RadixTextField.Root>, TextFieldProps>(
  function TextField(props, ref) {
    return <RadixTextField.Root data-slot="text-field" ref={ref} {...props} />;
  },
);
