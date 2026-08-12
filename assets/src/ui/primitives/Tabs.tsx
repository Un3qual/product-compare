import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";
import { createContext, useContext, type ComponentProps } from "react";
import { tokens } from "../theme/tokens.stylex";
import { customClassName } from "./utils.stylex";

const styles = stylex.create({
  root: { display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: 0 },
  list: {
    alignItems: "center",
    backgroundColor: tokens.surfaceMuted,
    borderRadius: "var(--pc-radius-medium)",
    color: tokens.textSecondary,
    display: "inline-flex",
    justifyContent: "center",
    padding: "0.25rem",
    width: "fit-content",
  },
  listLine: {
    alignItems: "center",
    borderBottomColor: tokens.border,
    borderBottomStyle: "solid",
    borderBottomWidth: "1px",
    display: "inline-flex",
    gap: "0.25rem",
    position: "relative",
    width: "fit-content",
  },
  indicator: {
    backgroundColor: tokens.actionAccent,
    blockSize: "2px",
    inlineSize: "var(--active-tab-width)",
    insetBlockEnd: "0",
    insetInlineStart: "var(--active-tab-left)",
    position: "absolute",
  },
  panel: { flex: 1, minWidth: 0, outline: "none" },
  trigger: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: "var(--pc-radius-medium)",
    borderStyle: "solid",
    borderWidth: "1px",
    color: tokens.textSecondary,
    cursor: "pointer",
    display: "inline-flex",
    fontFamily: tokens.fontSans,
    fontSize: "0.875rem",
    fontWeight: 700,
    justifyContent: "center",
    minHeight: tokens.controlHeight,
    paddingInline: "0.75rem",
    whiteSpace: "nowrap",
  },
  triggerActive: {
    backgroundColor: tokens.surfaceRaised,
    boxShadow: "0 1px 2px rgb(33 31 28 / 0.08)",
    color: tokens.actionAccent,
  },
  triggerLine: {
    borderRadius: 0,
    borderWidth: 0,
    marginBottom: "-1px",
    position: "relative",
  },
  triggerLineActive: { color: tokens.actionAccent },
});

const TabsVariantContext = createContext<"default" | "line">("default");

export function Tabs({
  className,
  style,
  ...rootProps
}: Omit<ComponentProps<typeof TabsPrimitive.Root>, "className"> & { className?: string }) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      {...stylex.props(styles.root, customClassName(className), style as StyleXStyles)}
      {...rootProps}
    />
  );
}

export function TabsList({
  children,
  className,
  style,
  variant = "default",
  ...listProps
}: Omit<ComponentProps<typeof TabsPrimitive.List>, "className"> & {
  className?: string;
  variant?: "default" | "line";
}) {
  return (
    <TabsVariantContext.Provider value={variant}>
      <TabsPrimitive.List
        {...stylex.props(
          variant === "line" ? styles.listLine : styles.list,
          customClassName(className),
          style as StyleXStyles,
        )}
        data-slot="tabs-list"
        data-variant={variant}
        {...listProps}
      >
        {children}
        {variant === "line" ? (
          <TabsPrimitive.Indicator data-slot="tabs-indicator" {...stylex.props(styles.indicator)} />
        ) : null}
      </TabsPrimitive.List>
    </TabsVariantContext.Provider>
  );
}

export function TabsTrigger({
  className,
  style,
  ...tabProps
}: Omit<ComponentProps<typeof TabsPrimitive.Tab>, "className"> & { className?: string }) {
  const variant = useContext(TabsVariantContext);
  return (
    <TabsPrimitive.Tab
      className={(state) =>
        stylex.props(
          styles.trigger,
          variant === "line" && styles.triggerLine,
          state.active && (variant === "line" ? styles.triggerLineActive : styles.triggerActive),
          customClassName(className),
        ).className
      }
      data-slot="tabs-trigger"
      style={style}
      {...tabProps}
    />
  );
}

export function TabsContent({
  className,
  style,
  ...panelProps
}: Omit<ComponentProps<typeof TabsPrimitive.Panel>, "className"> & { className?: string }) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      {...stylex.props(styles.panel, customClassName(className), style as StyleXStyles)}
      {...panelProps}
    />
  );
}
