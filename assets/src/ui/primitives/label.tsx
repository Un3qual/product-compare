import * as LabelPrimitive from "@radix-ui/react-label";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";

type LabelProps = ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & {
  "data-slot"?: string;
};

export const Label = forwardRef<
  ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(function Label(props, ref) {
  const { ["data-slot"]: dataSlot = "label", ...restProps } = props;

  return <LabelPrimitive.Root data-slot={dataSlot} ref={ref} {...restProps} />;
});
