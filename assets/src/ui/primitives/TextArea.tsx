import {
  TextArea as RadixTextArea,
  type TextAreaProps as RadixTextAreaProps,
} from "@radix-ui/themes";
import { forwardRef } from "react";

export type TextAreaProps = RadixTextAreaProps;

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  function TextArea(props, ref) {
    return <RadixTextArea data-slot="text-area" ref={ref} {...props} />;
  },
);
