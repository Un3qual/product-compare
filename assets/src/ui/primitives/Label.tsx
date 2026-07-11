import { Root as LabelPrimitive } from "@radix-ui/react-label";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";

type LabelProps = ComponentPropsWithoutRef<typeof LabelPrimitive> & {
  "data-slot"?: string;
};

export const Label = forwardRef<
  ElementRef<typeof LabelPrimitive>,
  LabelProps
>(function Label(props, ref) {
  const { ["data-slot"]: dataSlot = "label", ...restProps } = props;

  return <LabelPrimitive data-slot={dataSlot} ref={ref} {...restProps} />;
});
