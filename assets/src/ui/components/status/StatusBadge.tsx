import * as stylex from "@stylexjs/stylex";
import { Badge, type BadgeProps } from "../../primitives/Badge";
import { tokens } from "../../theme/tokens.stylex";

export type StatusTone = "accent" | "danger" | "neutral" | "positive" | "warning";

const styles = stylex.create({
  accent: { backgroundColor: "var(--pc-brand-50)", color: "var(--pc-brand-700)" },
  danger: { backgroundColor: "var(--pc-red-50)", color: "var(--pc-danger)" },
  neutral: {},
  positive: { backgroundColor: tokens.freshnessSoft, color: tokens.freshnessGreen },
  warning: { backgroundColor: "var(--pc-amber-50)", color: tokens.warning },
});

const toneStyles = {
  accent: styles.accent,
  danger: styles.danger,
  neutral: styles.neutral,
  positive: styles.positive,
  warning: styles.warning,
} as const;

export function StatusBadge({
  children,
  "data-slot": dataSlot = "status-badge",
  style,
  tone = "neutral",
  ...badgeProps
}: Omit<BadgeProps, "variant"> & {
  "data-slot"?: string;
  tone?: StatusTone;
}) {
  return (
    <Badge
      {...badgeProps}
      data-component="status-badge"
      data-slot={dataSlot}
      data-tone={tone}
      style={[toneStyles[tone], style]}
      variant="secondary"
    >
      {children}
    </Badge>
  );
}
