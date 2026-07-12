import { Root as SeparatorPrimitive } from "@radix-ui/react-separator";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";

type SeparatorProps = ComponentPropsWithoutRef<typeof SeparatorPrimitive> & {
  "data-slot"?: string;
};

export const Separator = forwardRef<
  ElementRef<typeof SeparatorPrimitive>,
  SeparatorProps
>(function Separator(props, ref) {
  const { ["data-slot"]: dataSlot = "separator", ...restProps } = props;

  return <SeparatorPrimitive data-slot={dataSlot} ref={ref} {...restProps} />;
});
