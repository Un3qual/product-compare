import { Select as SelectPrimitive } from "@base-ui/react/select";
import type { SelectRootProps } from "@base-ui/react/select";
import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { tokens } from "../theme/tokens.stylex";
import { customClassName } from "./utils.stylex";

const styles = stylex.create({
  groupLabel: {
    color: tokens.textSubtle,
    fontSize: "0.75rem",
    paddingBlock: "0.375rem",
    paddingInline: "0.5rem",
  },
  icon: {
    color: tokens.textSubtle,
    flexShrink: 0,
    height: "1rem",
    pointerEvents: "none",
    width: "1rem",
  },
  item: {
    alignItems: "center",
    backgroundColor: {
      ":hover": tokens.surfaceInteractive,
      ":where([data-highlighted])": tokens.surfaceInteractive,
      default: "transparent",
    },
    borderRadius: "var(--pc-radius-small)",
    color: tokens.text,
    cursor: "default",
    display: "flex",
    fontSize: "0.875rem",
    gap: "0.5rem",
    minHeight: "2.25rem",
    paddingBlock: "0.375rem",
    paddingInlineEnd: "2rem",
    paddingInlineStart: "0.5rem",
    position: "relative",
    userSelect: "none",
  },
  itemIndicator: {
    alignItems: "center",
    display: "flex",
    insetInlineEnd: "0.5rem",
    justifyContent: "center",
    position: "absolute",
  },
  popup: {
    backgroundColor: tokens.surfaceRaised,
    borderColor: tokens.borderEmphasized,
    borderRadius: "var(--pc-radius-medium)",
    borderStyle: "solid",
    borderWidth: "1px",
    boxShadow: "var(--pc-shadow-overlay)",
    color: tokens.text,
    maxHeight: "var(--available-height)",
    minWidth: "var(--anchor-width)",
    opacity: 1,
    outline: "none",
    overflowY: "auto",
    padding: "0.25rem",
    transformOrigin: "var(--transform-origin)",
    transition: "opacity 0.15s ease-in-out, transform 0.15s ease-in-out",
    zIndex: 50,
  },
  popupHidden: { opacity: 0, transform: "scale(0.98)" },
  separator: {
    backgroundColor: tokens.borderQuiet,
    height: "1px",
    marginBlock: "0.25rem",
    marginInline: "-0.25rem",
  },
  trigger: {
    alignItems: "center",
    backgroundColor: tokens.surfaceRaised,
    borderColor: {
      ":focus-visible": tokens.actionAccent,
      ":hover": tokens.borderEmphasized,
      default: tokens.border,
    },
    borderRadius: "var(--pc-radius-medium)",
    borderStyle: "solid",
    borderWidth: "1px",
    boxShadow: {
      ":focus-visible": "0 0 0 3px color-mix(in srgb, var(--pc-action-accent) 25%, transparent)",
      default: "0 1px 2px rgb(33 31 28 / 0.05)",
    },
    color: tokens.text,
    cursor: { ":disabled": "not-allowed", default: "pointer" },
    display: "flex",
    fontFamily: tokens.fontSans,
    fontSize: "0.9rem",
    gap: "0.5rem",
    justifyContent: "space-between",
    minHeight: tokens.controlHeight,
    minWidth: "8rem",
    opacity: { ":disabled": 0.55, default: 1 },
    paddingInline: "0.7rem",
    transition: "box-shadow 0.15s, border-color 0.15s",
    width: "fit-content",
  },
  value: {
    overflow: "hidden",
    textAlign: "start",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
});

const hidden = (status: string | undefined) => status === "starting" || status === "ending";

export function Select<Value, Multiple extends boolean | undefined = false>(
  props: SelectRootProps<Value, Multiple>,
) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

export function SelectGroup(props: ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

export function SelectValue({
  className,
  style,
  ...valueProps
}: Omit<ComponentProps<typeof SelectPrimitive.Value>, "className"> & {
  className?: string;
}) {
  return (
    <SelectPrimitive.Value
      {...stylex.props(styles.value, customClassName(className), style as StyleXStyles)}
      data-slot="select-value"
      {...valueProps}
    />
  );
}

export function SelectTrigger({
  children,
  className,
  style,
  ...triggerProps
}: Omit<ComponentProps<typeof SelectPrimitive.Trigger>, "className" | "render"> & {
  className?: string;
}) {
  return (
    <SelectPrimitive.Trigger
      {...stylex.props(styles.trigger, customClassName(className), style as StyleXStyles)}
      data-slot="select-trigger"
      render={(triggerRenderProps, state) => (
        <button
          {...triggerRenderProps}
          value={Array.isArray(state.value) ? state.value.join(",") : String(state.value ?? "")}
        />
      )}
      {...triggerProps}
    >
      {children}
      <SelectPrimitive.Icon {...stylex.props(styles.icon)}>
        <ChevronDownIcon aria-hidden="true" size={16} />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({
  alignItemWithTrigger = false,
  children,
  className,
  sideOffset = 4,
  style,
  ...popupProps
}: Omit<ComponentProps<typeof SelectPrimitive.Popup>, "className"> & {
  alignItemWithTrigger?: boolean;
  className?: string;
  sideOffset?: number;
}) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        alignItemWithTrigger={alignItemWithTrigger}
        side="bottom"
        sideOffset={sideOffset}
      >
        <SelectPrimitive.Popup
          className={(state) =>
            stylex.props(
              styles.popup,
              hidden(state.transitionStatus) && styles.popupHidden,
              customClassName(className),
            ).className
          }
          data-slot="select-content"
          style={style}
          {...popupProps}
        >
          {children}
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

export function SelectLabel({
  className,
  style,
  ...labelProps
}: Omit<ComponentProps<typeof SelectPrimitive.GroupLabel>, "className"> & {
  className?: string;
}) {
  return (
    <SelectPrimitive.GroupLabel
      {...stylex.props(styles.groupLabel, customClassName(className), style as StyleXStyles)}
      data-slot="select-label"
      {...labelProps}
    />
  );
}

export function SelectItem({
  children,
  className,
  style,
  ...itemProps
}: Omit<ComponentProps<typeof SelectPrimitive.Item>, "className"> & {
  className?: string;
}) {
  return (
    <SelectPrimitive.Item
      {...stylex.props(styles.item, customClassName(className), style as StyleXStyles)}
      data-slot="select-item"
      {...itemProps}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator {...stylex.props(styles.itemIndicator)}>
        <CheckIcon aria-hidden="true" size={16} />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

export function SelectSeparator({
  className,
  style,
  ...separatorProps
}: Omit<ComponentProps<typeof SelectPrimitive.Separator>, "className"> & {
  className?: string;
}) {
  return (
    <SelectPrimitive.Separator
      {...stylex.props(styles.separator, customClassName(className), style as StyleXStyles)}
      data-slot="select-separator"
      {...separatorProps}
    />
  );
}
