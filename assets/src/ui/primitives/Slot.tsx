import { Slot as RadixSlot } from "@radix-ui/react-slot";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";

type SlotProps = ComponentPropsWithoutRef<typeof RadixSlot> & {
  "data-slot"?: string;
};

export const Slot = forwardRef<
  ElementRef<typeof RadixSlot>,
  SlotProps
>(function Slot(props, ref) {
  const { ["data-slot"]: dataSlot = "slot", ...restProps } = props;

  return <RadixSlot data-slot={dataSlot} ref={ref} {...restProps} />;
});
