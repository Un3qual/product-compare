import {
  Content as CollapsibleContentPrimitive,
  Root as CollapsibleRootPrimitive,
  Trigger as CollapsibleTriggerPrimitive
} from "@radix-ui/react-collapsible";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";

export const Collapsible = forwardRef<
  ElementRef<typeof CollapsibleRootPrimitive>,
  ComponentPropsWithoutRef<typeof CollapsibleRootPrimitive>
>(function Collapsible(props, ref) {
  return <CollapsibleRootPrimitive data-slot="collapsible" ref={ref} {...props} />;
});

export const CollapsibleTrigger = forwardRef<
  ElementRef<typeof CollapsibleTriggerPrimitive>,
  ComponentPropsWithoutRef<typeof CollapsibleTriggerPrimitive>
>(function CollapsibleTrigger(props, ref) {
  return (
    <CollapsibleTriggerPrimitive
      data-slot="collapsible-trigger"
      ref={ref}
      {...props}
    />
  );
});

export const CollapsibleContent = forwardRef<
  ElementRef<typeof CollapsibleContentPrimitive>,
  ComponentPropsWithoutRef<typeof CollapsibleContentPrimitive>
>(function CollapsibleContent(props, ref) {
  return (
    <CollapsibleContentPrimitive
      data-slot="collapsible-content"
      ref={ref}
      {...props}
    />
  );
});
