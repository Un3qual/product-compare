import {
  Checkbox as RadixCheckbox,
  type CheckboxProps as RadixCheckboxProps,
} from "@radix-ui/themes";
import { forwardRef } from "react";

export type CheckboxProps = RadixCheckboxProps;

export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox(props, ref) {
  return <RadixCheckbox data-slot="checkbox" ref={ref} {...props} />;
});
