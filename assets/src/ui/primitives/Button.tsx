import { useRender } from "@base-ui/react";
import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";
import { isValidElement, type ComponentProps } from "react";
import { tokens } from "../theme/tokens.stylex";
import { customClassName } from "./utils.stylex";

const styles = stylex.create({
  base: {
    alignItems: "center",
    borderRadius: "var(--pc-radius-medium)",
    borderStyle: "solid",
    borderWidth: 0,
    cursor: { ":disabled": "not-allowed", default: "pointer" },
    display: "inline-flex",
    flexShrink: 0,
    fontFamily: tokens.fontSans,
    fontSize: "0.875rem",
    fontWeight: 700,
    gap: "0.5rem",
    justifyContent: "center",
    lineHeight: 1,
    opacity: { ":disabled": 0.55, default: 1 },
    pointerEvents: { ":disabled": "none", default: null },
    textDecoration: "none",
    transition: "color 0.15s, background-color 0.15s, box-shadow 0.15s, border-color 0.15s",
    whiteSpace: "nowrap",
  },
  default: {
    backgroundColor: {
      ":hover": tokens.actionAccentHover,
      default: tokens.actionAccent,
    },
    boxShadow: "0 1px 2px rgb(33 31 28 / 0.08)",
    color: tokens.textInverted,
  },
  destructive: {
    backgroundColor: {
      ":hover": "color-mix(in srgb, var(--pc-danger) 85%, black)",
      default: "var(--pc-danger)",
    },
    color: tokens.textInverted,
  },
  focusable: {
    boxShadow: {
      ":focus-visible": "0 0 0 3px color-mix(in srgb, var(--pc-action-accent) 35%, transparent)",
      default: null,
    },
  },
  ghost: {
    backgroundColor: {
      ":hover": "var(--pc-brand-100)",
      default: "transparent",
    },
    color: {
      ":hover": "var(--pc-brand-700)",
      default: tokens.textSecondary,
    },
  },
  link: {
    backgroundColor: "transparent",
    color: tokens.actionAccent,
    textDecorationLine: { ":hover": "underline", default: "none" },
    textUnderlineOffset: "0.2em",
  },
  outline: {
    backgroundColor: {
      ":hover": tokens.surfaceInteractive,
      default: tokens.surfaceRaised,
    },
    borderColor: tokens.border,
    borderWidth: "1px",
    color: tokens.text,
  },
  secondary: {
    backgroundColor: {
      ":hover": "var(--pc-brand-100)",
      default: tokens.surfaceInteractive,
    },
    borderColor: "var(--pc-brand-100)",
    borderWidth: "1px",
    color: "var(--pc-brand-700)",
  },
  sizeDefault: { minHeight: tokens.controlHeight, paddingInline: "0.9rem" },
  sizeIcon: {
    height: tokens.controlHeight,
    paddingInline: 0,
    width: tokens.controlHeight,
  },
  sizeIconLg: {
    height: "3rem",
    paddingInline: 0,
    width: "3rem",
  },
  sizeIconSm: {
    height: tokens.controlHeight,
    paddingInline: 0,
    width: tokens.controlHeight,
  },
  sizeLg: { minHeight: "3rem", paddingInline: "1.1rem" },
  sizeSm: {
    fontSize: "0.82rem",
    minHeight: tokens.controlHeight,
    paddingInline: "0.65rem",
  },
});

export type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
export type ButtonSize = "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";

const variantStyles: Record<ButtonVariant, StyleXStyles> = {
  default: styles.default,
  destructive: styles.destructive,
  ghost: styles.ghost,
  link: styles.link,
  outline: styles.outline,
  secondary: styles.secondary,
};

const sizeStyles: Record<ButtonSize, StyleXStyles> = {
  default: styles.sizeDefault,
  icon: styles.sizeIcon,
  "icon-lg": styles.sizeIconLg,
  "icon-sm": styles.sizeIconSm,
  lg: styles.sizeLg,
  sm: styles.sizeSm,
};

export interface ButtonProps extends Omit<ComponentProps<"button">, "className"> {
  className?: string;
  render?: useRender.RenderProp;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

export const MINIMUM_TOUCH_TARGET = "44px";

export function Button({
  className,
  render,
  size = "default",
  style,
  type,
  variant = "default",
  ...buttonProps
}: ButtonProps) {
  const rendersNativeButton =
    render === undefined || (isValidElement(render) && render.type === "button");

  return useRender({
    defaultTagName: "button",
    props: {
      ...stylex.props(
        styles.base,
        styles.focusable,
        variantStyles[variant],
        sizeStyles[size],
        customClassName(className),
        style as StyleXStyles,
      ),
      "data-size": size,
      "data-slot": "button",
      "data-variant": variant,
      ...(rendersNativeButton || type !== undefined ? { type: type ?? "button" } : null),
      ...buttonProps,
    },
    render,
  });
}
