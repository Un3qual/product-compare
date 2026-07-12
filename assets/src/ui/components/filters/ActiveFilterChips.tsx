import type { ReactNode } from "react";
import { create, props } from "@stylexjs/stylex";
import { tokens } from "../../theme/tokens.stylex";

const styles = create({
  list: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    listStyle: "none",
    margin: 0,
    padding: 0
  },
  item: {
    alignItems: "center",
    backgroundColor: tokens.surfaceInteractive,
    borderRadius: "999px",
    display: "flex",
    fontSize: "0.82rem",
    gap: "0.4rem",
    paddingBlock: "0.25rem",
    paddingInline: "0.65rem"
  },
  label: {
    color: tokens.textSecondary,
    fontWeight: 650
  }
});

export type ActiveFilterChip = {
  key: string;
  label: ReactNode;
  removeControl: ReactNode;
};

export function ActiveFilterChips({ items }: { items: readonly ActiveFilterChip[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ul aria-label="Active filters" {...props(styles.list)}>
      {items.map((item) => (
        <li key={item.key} {...props(styles.item)}>
          <span {...props(styles.label)}>{item.label}</span>
          {item.removeControl}
        </li>
      ))}
    </ul>
  );
}
