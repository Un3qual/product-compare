import { Badge, type BadgeProps } from "@radix-ui/themes";
import type { PropsWithChildren } from "react";

export type StatusTone = "accent" | "danger" | "neutral" | "positive" | "warning";

const colors: Record<StatusTone, BadgeProps["color"]> = {
  accent: "indigo",
  danger: "red",
  neutral: "gray",
  positive: "green",
  warning: "amber"
};

export function StatusBadge({
  children,
  tone = "neutral"
}: PropsWithChildren<{ tone?: StatusTone }>) {
  return (
    <Badge color={colors[tone]} data-slot="status-badge" highContrast variant="soft">
      {children}
    </Badge>
  );
}
