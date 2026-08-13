import { create, props } from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { Button } from "$ui/primitives/Button";
import { tokens } from "$ui/theme/tokens.stylex";
import type { CompareProductSummary, CompareSpecMode } from "../compare-route-data";
import { CompareProductPickerBoundary } from "../CompareProductPickerBoundary";
import { CompareSelectionTray } from "../CompareSelectionTray";
import { ShareComparisonControl } from "../ShareComparisonControl";
import { buildComparePathAfterRemovingSlugIndex, buildComparePathFromSlugs } from "../paths";

const styles = create({
  toolbar: {
    backgroundColor: tokens.surfaceMuted,
    borderColor: tokens.borderQuiet,
    borderRadius: "var(--pc-radius-large)",
    borderStyle: "solid",
    borderWidth: "1px",
    display: "grid",
    gap: "1rem",
    marginBlockEnd: tokens.workspaceGap,
    padding: {
      default: "1.25rem",
      "@media (max-width: 30rem)": "1rem",
    },
  },
  header: {
    alignItems: "start",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.85rem",
    justifyContent: "space-between",
  },
  heading: {
    display: "grid",
    gap: "0.25rem",
  },
  title: {
    fontSize: "1.1rem",
    margin: 0,
  },
  description: {
    color: tokens.textSecondary,
    margin: 0,
  },
  actions: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.65rem",
  },
  status: {
    color: tokens.textSecondary,
    margin: 0,
    minHeight: "1.25rem",
  },
});

export function ComparisonToolbar({
  authDialog,
  maxProducts,
  onSave,
  products,
  saveInFlight,
  saveMessage,
  selectedSlugs,
  specMode,
}: {
  authDialog: ReactNode;
  maxProducts: number;
  onSave: () => void;
  products: readonly CompareProductSummary[];
  saveInFlight: boolean;
  saveMessage: string | null;
  selectedSlugs: readonly string[];
  specMode: CompareSpecMode;
}) {
  return (
    <section aria-label="Comparison controls" {...props(styles.toolbar)}>
      <div {...props(styles.header)}>
        <div {...props(styles.heading)}>
          <h2 {...props(styles.title)}>Comparison controls</h2>
          <p {...props(styles.description)}>
            Save, share, remove, or add products without leaving the comparison.
          </p>
        </div>
        <div {...props(styles.actions)}>
          <Button disabled={saveInFlight} onClick={onSave} type="button">
            {saveInFlight ? "Saving comparison..." : "Save comparison"}
          </Button>
          <ShareComparisonControl products={products} />
        </div>
      </div>
      {authDialog}
      <p
        aria-label="Save comparison status"
        aria-live="polite"
        role="status"
        {...props(styles.status)}
      >
        {saveMessage ?? ""}
      </p>
      <CompareSelectionTray
        items={products.map((product) => ({ label: product.name, slug: product.slug }))}
        maxProducts={maxProducts}
        openComparePath={buildComparePathFromSlugs(selectedSlugs, { specMode })}
        removePathForIndex={(index) =>
          buildComparePathAfterRemovingSlugIndex(selectedSlugs, index, { specMode })
        }
        selectedSlugs={selectedSlugs}
      />
      {selectedSlugs.length < maxProducts ? (
        <CompareProductPickerBoundary
          heading="Add another product"
          specMode={specMode}
          selectedSlugs={selectedSlugs}
        />
      ) : null}
    </section>
  );
}
