import type { ReactNode } from "react";
import * as stylex from "@stylexjs/stylex";
import { tokens } from "../../theme/tokens.stylex";

const styles = stylex.create({
  root: {
    display: "grid",
    gap: "0.35rem"
  },
  title: {
    fontSize: "1.25rem",
    letterSpacing: "-0.02em",
    lineHeight: 1.2,
    margin: 0
  },
  description: {
    color: tokens.textSecondary,
    lineHeight: 1.55,
    margin: 0,
    maxWidth: "44rem"
  }
});

export function SectionHeading({
  description,
  title
}: {
  description?: ReactNode;
  title: ReactNode;
}) {
  return (
    <header {...stylex.props(styles.root)}>
      <h2 {...stylex.props(styles.title)}>{title}</h2>
      {description ? (
        <div {...stylex.props(styles.description)}>{description}</div>
      ) : null}
    </header>
  );
}
