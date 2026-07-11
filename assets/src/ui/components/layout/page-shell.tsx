import { useId, type PropsWithChildren, type ReactNode } from "react";
import * as stylex from "@stylexjs/stylex";
import { tokens } from "../../theme/tokens.stylex";

const styles = stylex.create({
  page: {
    display: "grid",
    gap: "1.75rem",
    marginInline: "auto",
    paddingBlock: tokens.routeSpace,
    paddingInline: "clamp(1rem, 3vw, 2rem)",
    width: "100%"
  },
  appWidth: {
    maxWidth: tokens.pageMax
  },
  readingWidth: {
    maxWidth: tokens.readingMax
  },
  header: {
    alignItems: "end",
    display: "flex",
    flexWrap: "wrap",
    gap: "1rem 2rem",
    justifyContent: "space-between"
  },
  heading: {
    display: "grid",
    gap: "0.45rem",
    maxWidth: "48rem"
  },
  eyebrow: {
    color: tokens.actionAccent,
    fontSize: "0.75rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    margin: 0,
    textTransform: "uppercase"
  },
  title: {
    fontSize: "clamp(2rem, 5vw, 3.75rem)",
    letterSpacing: "-0.04em",
    lineHeight: 0.98,
    margin: 0
  },
  description: {
    color: tokens.textSecondary,
    fontSize: "1.05rem",
    lineHeight: 1.65,
    margin: 0,
    maxWidth: "42rem"
  },
  actions: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem"
  },
  content: {
    display: "grid",
    gap: "1.5rem",
    minWidth: 0
  }
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
  width = "app"
}: PageShellProps) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      {...stylex.props(
        styles.page,
        width === "reading" ? styles.readingWidth : styles.appWidth
      )}
    >
      <header {...stylex.props(styles.header)}>
        <div {...stylex.props(styles.heading)}>
          {eyebrow ? <p {...stylex.props(styles.eyebrow)}>{eyebrow}</p> : null}
          <h1 id={titleId} {...stylex.props(styles.title)}>
            {title}
          </h1>
          {description ? (
            <div {...stylex.props(styles.description)}>{description}</div>
          ) : null}
        </div>
        {actions ? <div {...stylex.props(styles.actions)}>{actions}</div> : null}
      </header>
      <div {...stylex.props(styles.content)}>{children}</div>
    </section>
  );
}
