import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";

export const Collapsible = forwardRef<
  ElementRef<typeof CollapsiblePrimitive.Root>,
  ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root>
>(function Collapsible(props, ref) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" ref={ref} {...props} />;
});

export const CollapsibleTrigger = forwardRef<
  ElementRef<typeof CollapsiblePrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger>
>(function CollapsibleTrigger(props, ref) {
  return (
    <CollapsiblePrimitive.Trigger
      data-slot="collapsible-trigger"
      ref={ref}
      {...props}
    />
  );
});

export const CollapsibleContent = forwardRef<
  ElementRef<typeof CollapsiblePrimitive.Content>,
  ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>
>(function CollapsibleContent(props, ref) {
  return (
    <CollapsiblePrimitive.Content
      data-slot="collapsible-content"
      ref={ref}
      {...props}
    />
  );
});
