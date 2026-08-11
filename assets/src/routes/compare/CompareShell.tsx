import type { PropsWithChildren, ReactNode } from "react";
import { PageShell } from "$ui/components/layout/PageShell";

export interface CompareShellProps extends PropsWithChildren {
  actions?: ReactNode;
  title: string;
}

export function CompareShell({ actions, children, title }: CompareShellProps) {
  return (
    <PageShell
      actions={actions}
      description={
        title === "Saved comparisons"
          ? "Return to saved product sets, refine the visible page, or remove comparisons you no longer need."
          : "Review aligned product details, specifications, and current offer signals."
      }
      eyebrow="Decision workspace"
      title={title}
    >
      {children}
    </PageShell>
  );
}
