import { useId, type PropsWithChildren } from "react";
import { create, props } from "@stylexjs/stylex";
import { tokens } from "../../theme/tokens.stylex";

const styles = create({
  root: {
    backgroundColor: tokens.surfaceMuted,
    borderColor: tokens.borderQuiet,
    borderRadius: "var(--radius-3)",
    borderStyle: "solid",
    borderWidth: "1px",
    display: "grid",
    gap: "0.85rem",
    padding: "1rem"
  },
  title: {
    fontSize: "0.82rem",
    letterSpacing: "0.05em",
    margin: 0,
    textTransform: "uppercase"
  },
  content: {
    display: "grid",
    gap: "0.85rem"
  }
});

export function FilterBar({ children, label }: PropsWithChildren<{ label: string }>) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} {...props(styles.root)}>
      <h2 id={titleId} {...props(styles.title)}>
        {label}
      </h2>
      <div {...props(styles.content)}>{children}</div>
    </section>
  );
}
