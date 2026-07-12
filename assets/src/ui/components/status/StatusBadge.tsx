import type { PropsWithChildren } from "react";

export type StatusTone = "accent" | "danger" | "neutral" | "positive" | "warning";

export function StatusBadge({
  children,
  tone = "neutral"
}: PropsWithChildren<{ tone?: StatusTone }>) {
  return (
    <span data-slot="status-badge" data-tone={tone}>
      {children}
    </span>
  );
}
