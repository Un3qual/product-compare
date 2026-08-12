import type { PropsWithChildren, ReactNode } from "react";
import { create, props } from "@stylexjs/stylex";
import { tokens } from "../../theme/tokens.stylex";

const styles = create({
  layout: {
    alignItems: "start",
    display: "grid",
    gap: tokens.workspaceGap,
    gridTemplateAreas: {
      default: '"workspace context"',
      "@media (max-width: 62rem)": '"workspace" "context"',
    },
    gridTemplateColumns: {
      default: `minmax(0, 1fr) ${tokens.contextRailWidth}`,
      "@media (max-width: 62rem)": "minmax(0, 1fr)",
    },
    minWidth: 0,
  },
  workspace: {
    gridArea: "workspace",
    minWidth: 0,
  },
  context: {
    gridArea: "context",
    minWidth: 0,
  },
});

export function WorkspaceLayout({
  children,
  context,
  label,
}: PropsWithChildren<{
  context?: ReactNode;
  label: string;
}>) {
  return (
    <div {...props(styles.layout)}>
      <section aria-label={label} {...props(styles.workspace)}>
        {children}
      </section>
      {context ? <div {...props(styles.context)}>{context}</div> : null}
    </div>
  );
}
