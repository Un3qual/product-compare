import { TextField as RadixTextField } from "@radix-ui/themes";
import type { ComponentProps } from "react";

export type TextFieldProps = ComponentProps<typeof RadixTextField.Root>;

export function TextField(props: TextFieldProps) {
  return <RadixTextField.Root data-slot="text-field" {...props} />;
}
