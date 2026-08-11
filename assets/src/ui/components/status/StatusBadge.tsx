import { Badge, type BadgeProps } from "@radix-ui/themes";

export type StatusTone = "accent" | "danger" | "neutral" | "positive" | "warning";

const toneColor = {
  accent: "indigo",
  danger: "red",
  neutral: "gray",
  positive: "green",
  warning: "amber",
} as const;

export function StatusBadge({
  children,
  "data-slot": dataSlot = "status-badge",
  tone = "neutral",
  ...badgeProps
}: Omit<BadgeProps, "color" | "radius" | "variant"> & {
  "data-slot"?: string;
  tone?: StatusTone;
}) {
  return (
    <Badge
      {...badgeProps}
      color={toneColor[tone]}
      data-component="status-badge"
      data-slot={dataSlot}
      data-tone={tone}
      radius="full"
      variant="soft"
    >
      {children}
    </Badge>
  );
}
