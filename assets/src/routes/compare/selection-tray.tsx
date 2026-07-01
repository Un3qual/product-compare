import { useId } from "react";
import { Link } from "react-router-dom";

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
    <section aria-labelledby={titleId}>
      <h2 id={titleId}>{title}</h2>
      <p>
        {selectedSlugs.length} of {maxProducts} products selected.
      </p>
      {selectedSlugs.length > 0 ? <Link to={openComparePath}>Open comparison</Link> : null}
      <ul>
        {selectedSlugs.map((slug, index) => {
          const label = items.find((item) => item.slug === slug)?.label ?? slug;

          return (
            <li key={`${slug}-${index}`}>
              <span>{label}</span>{" "}
              <Link to={removePathForIndex(index)}>Remove {label} from selection</Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
