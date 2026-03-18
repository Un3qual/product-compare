import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";

type SeparatorProps = ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> & {
  "data-slot"?: string;
};

export const Separator = forwardRef<
  ElementRef<typeof SeparatorPrimitive.Root>,
  SeparatorProps
>(function Separator(props, ref) {
  const { ["data-slot"]: dataSlot = "separator", ...restProps } = props;

  return <SeparatorPrimitive.Root data-slot={dataSlot} ref={ref} {...restProps} />;
});
