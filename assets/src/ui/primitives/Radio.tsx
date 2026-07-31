import { Radio as RadixRadio, type RadioProps as RadixRadioProps } from "@radix-ui/themes";
import { forwardRef } from "react";

export type RadioProps = RadixRadioProps;

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(props, ref) {
  return <RadixRadio data-slot="radio" ref={ref} {...props} />;
});
