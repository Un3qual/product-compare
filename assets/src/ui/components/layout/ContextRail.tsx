import { useId, type PropsWithChildren, type ReactNode } from "react";
import { create, props } from "@stylexjs/stylex";
import { tokens } from "../../theme/tokens.stylex";

const styles = create({
  rail: {
    borderBlockStartColor: tokens.borderEmphasized,
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "2px",
    display: "grid",
    gap: tokens.compactGap,
    paddingBlockStart: "1rem",
    position: {
      default: "sticky",
      "@media (max-width: 62rem)": "static",
    },
    top: {
      default: tokens.stickyOffset,
      "@media (max-width: 62rem)": "auto",
    },
  },
  header: {
    display: "grid",
    gap: "0.25rem",
  },
  title: {
    fontSize: "0.82rem",
    letterSpacing: "0.05em",
    margin: 0,
    textTransform: "uppercase",
  },
  description: {
    color: tokens.textSecondary,
    fontSize: "0.9rem",
    lineHeight: 1.5,
    margin: 0,
  },
  content: {
    display: "grid",
    gap: "1rem",
  },
});

export function ContextRail({
  children,
  description,
  label,
}: PropsWithChildren<{
  description?: ReactNode;
  label: string;
}>) {
  const titleId = useId();

  return (
    <aside aria-labelledby={titleId} {...props(styles.rail)}>
      <header {...props(styles.header)}>
        <h2 id={titleId} {...props(styles.title)}>
          {label}
        </h2>
        {description ? <div {...props(styles.description)}>{description}</div> : null}
      </header>
      <div {...props(styles.content)}>{children}</div>
    </aside>
  );
}
