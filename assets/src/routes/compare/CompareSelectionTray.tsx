import { useId } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import { Button } from "../../ui/primitives/Button";
import { tokens } from "../../ui/theme/tokens.stylex";

const styles = create({
  tray: {
    backgroundColor: tokens.surfaceMuted,
    borderColor: tokens.borderQuiet,
    borderRadius: "var(--radius-4)",
    borderStyle: "solid",
    borderWidth: "1px",
    display: "grid",
    gap: "0.85rem",
    padding: "1.15rem"
  },
  header: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem",
    justifyContent: "space-between"
  },
  title: {
    fontSize: "1rem",
    margin: 0
  },
  status: {
    color: tokens.textSecondary,
    margin: 0
  },
  list: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.55rem",
    listStyle: "none",
    margin: 0,
    padding: 0
  },
  item: {
    alignItems: "center",
    backgroundColor: tokens.surfaceRaised,
    borderRadius: "var(--radius-3)",
    display: "flex",
    gap: "0.55rem",
    padding: "0.4rem 0.55rem"
  }
});

interface CompareSelectionTrayItem {
  label: string;
  slug: string;
}

export function CompareSelectionTray({
  items,
  maxProducts,
  openComparePath,
  removePathForIndex,
  selectedSlugs,
  title = "Selected products"
}: {
  selectedSlugs: readonly string[];
  items: readonly CompareSelectionTrayItem[];
  maxProducts: number;
  openComparePath: string;
  removePathForIndex: (index: number) => string;
  title?: string;
}) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} {...props(styles.tray)}>
      <div {...props(styles.header)}>
        <div>
          <h2 id={titleId} {...props(styles.title)}>{title}</h2>
          <p aria-live="polite" role="status" {...props(styles.status)}>
            {selectedSlugs.length} of {maxProducts} products selected.
          </p>
        </div>
        {selectedSlugs.length > 0 ? (
          <Button asChild variant="solid">
            <Link to={openComparePath}>Open comparison</Link>
          </Button>
        ) : null}
      </div>
      <SelectionItems
        items={items}
        removePathForIndex={removePathForIndex}
        selectedSlugs={selectedSlugs}
      />
    </section>
  );
}

function SelectionItems({
  items,
  removePathForIndex,
  selectedSlugs
}: {
  items: readonly CompareSelectionTrayItem[];
  removePathForIndex: (index: number) => string;
  selectedSlugs: readonly string[];
}) {
  return (
    <ul {...props(styles.list)}>
      {selectedSlugs.map((slug, index) => {
        const label = items.find((item) => item.slug === slug)?.label ?? slug;

        return (
          <li key={slug} {...props(styles.item)}>
            <span>{label}</span>{" "}
            <Button asChild size="1" variant="ghost">
              <Link to={removePathForIndex(index)}>Remove {label} from selection</Link>
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
