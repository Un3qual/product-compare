import { useId, type PropsWithChildren, type ReactNode } from "react";
import { create, props } from "@stylexjs/stylex";
import { tokens } from "../../theme/tokens.stylex";

const styles = create({
  page: {
    display: "grid",
    gap: { default: "1.75rem", "@media (max-width: 42rem)": "1.25rem" },
    marginInline: "auto",
    paddingBlock: tokens.routeSpace,
    paddingInline: "clamp(1rem, 3vw, 2rem)",
    width: "100%",
  },
  appWidth: {
    maxWidth: tokens.pageMax,
  },
  readingWidth: {
    maxWidth: tokens.readingMax,
  },
  header: {
    alignItems: "end",
    display: "flex",
    flexWrap: "wrap",
    gap: { default: "1rem 2rem", "@media (max-width: 42rem)": "0.75rem" },
    justifyContent: "space-between",
  },
  heading: {
    display: "grid",
    gap: "0.45rem",
    maxWidth: "48rem",
  },
  eyebrow: {
    color: tokens.actionAccent,
    fontSize: "0.75rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    margin: 0,
    textTransform: "uppercase",
  },
  title: {
    fontSize: tokens.routeTitleSize,
    letterSpacing: "-0.04em",
    lineHeight: 1.04,
    margin: 0,
  },
  description: {
    color: tokens.textSecondary,
    fontSize: { default: "1.05rem", "@media (max-width: 42rem)": "0.98rem" },
    lineHeight: { default: 1.65, "@media (max-width: 42rem)": 1.5 },
    margin: 0,
    maxWidth: "42rem",
  },
  actions: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem",
  },
  content: {
    display: "grid",
    gap: { default: "1.5rem", "@media (max-width: 42rem)": "1.15rem" },
    minWidth: 0,
  },
});

export type PageShellProps = PropsWithChildren<{
  actions?: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  title: string;
  width?: "app" | "reading";
}>;

export function PageShell({
  actions,
  children,
  description,
  eyebrow,
  title,
  width = "app",
}: PageShellProps) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      {...props(styles.page, width === "reading" ? styles.readingWidth : styles.appWidth)}
    >
      <header {...props(styles.header)}>
        <div {...props(styles.heading)}>
          {eyebrow ? <p {...props(styles.eyebrow)}>{eyebrow}</p> : null}
          <h1 id={titleId} {...props(styles.title)}>
            {title}
          </h1>
          {description ? <div {...props(styles.description)}>{description}</div> : null}
        </div>
        {actions ? <div {...props(styles.actions)}>{actions}</div> : null}
      </header>
      <div {...props(styles.content)}>{children}</div>
    </section>
  );
}
