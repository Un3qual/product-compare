import type { ComponentPropsWithoutRef } from "react";

export type TextFieldProps = ComponentPropsWithoutRef<"input">;

export function TextField(props: TextFieldProps) {
  return <input data-slot="text-field" {...props} />;
}
