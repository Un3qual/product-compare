import { useId, type ReactNode } from "react";
import { create, props } from "@stylexjs/stylex";
import { tokens } from "../../theme/tokens.stylex";

const styles = create({
  root: {
    borderBlockColor: tokens.borderQuiet,
    borderBlockStyle: "solid",
    borderBlockWidth: "1px",
    display: "grid",
    gap: "0.75rem",
    paddingBlock: "1rem",
  },
  title: {
    fontSize: "0.82rem",
    letterSpacing: "0.05em",
    margin: 0,
    textTransform: "uppercase",
  },
  metrics: {
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: "repeat(auto-fit, minmax(9rem, 1fr))",
    margin: 0,
  },
  metric: {
    display: "grid",
    gap: "0.25rem",
  },
  label: {
    color: tokens.textSecondary,
    fontSize: "0.8rem",
    fontWeight: 600,
  },
  value: {
    fontSize: "1.15rem",
    fontWeight: 750,
    margin: 0,
  },
});

export type SummaryStripItem = {
  label: ReactNode;
  value: ReactNode;
};

export function SummaryStrip({
  items,
  label,
}: {
  items: readonly SummaryStripItem[];
  label: string;
}) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} {...props(styles.root)}>
      <h2 id={titleId} {...props(styles.title)}>
        {label}
      </h2>
      <dl {...props(styles.metrics)}>
        {items.map((item, index) => (
          <div key={index} {...props(styles.metric)}>
            <dt {...props(styles.label)}>{item.label}</dt>
            <dd {...props(styles.value)}>{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
