import { create, props } from "@stylexjs/stylex";
import { useNavigate } from "react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "$ui/primitives/Tabs";
import { tokens } from "$ui/theme/tokens.stylex";
import type { CompareProductSummary, CompareSpecMode } from "../compare-route-data";
import { buildComparePathFromSlugs } from "../paths";
import { SpecificationMatrix } from "./SpecificationMatrix";

const COMPARE_SPEC_MODE_OPTIONS = [
  { label: "Shared specs", mode: "shared" },
  { label: "Differences", mode: "differences" },
  { label: "All specs", mode: "all" },
] as const;

const styles = create({
  boundary: {
    display: "grid",
    gap: "0.75rem",
  },
  tabList: {
    borderBlockEndColor: tokens.borderQuiet,
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
    display: "flex",
    gap: "0.25rem",
    overflowX: "auto",
  },
  tab: {
    borderBlockEndColor: "transparent",
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "2px",
    color: tokens.textSecondary,
    fontWeight: 650,
    paddingBlock: "0.65rem",
    paddingInline: "0.9rem",
    textDecoration: "none",
  },
  tabActive: {
    borderBlockEndColor: tokens.actionAccent,
    color: tokens.text,
  },
});

export function ComparisonModeTabs({
  products,
  selectedSlugs,
  specMode,
}: {
  products: CompareProductSummary[];
  selectedSlugs: readonly string[];
  specMode: CompareSpecMode;
}) {
  const navigation = buildCompareSpecModeNavigationData({ selectedSlugs, specMode });
  const navigate = useNavigate();

  return (
    <section aria-label="Specification comparison" {...props(styles.boundary)}>
      <Tabs value={specMode}>
        <TabsList aria-label="Specification views" variant="line" style={styles.tabList}>
          {navigation.modes.map((item) => (
            <TabsTrigger
              key={item.mode}
              nativeButton={false}
              render={
                <a
                  aria-current={item.isCurrent ? "page" : undefined}
                  href={item.path}
                  onClick={(event) => {
                    if (
                      event.defaultPrevented ||
                      event.button !== 0 ||
                      event.altKey ||
                      event.ctrlKey ||
                      event.metaKey ||
                      event.shiftKey
                    ) {
                      return;
                    }

                    event.preventDefault();
                    navigate(item.path);
                  }}
                  {...props(styles.tab, item.isCurrent ? styles.tabActive : null)}
                />
              }
              value={item.mode}
            >
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {navigation.modes.map((item) => (
          <TabsContent keepMounted hidden={!item.isCurrent} key={item.mode} value={item.mode}>
            {item.isCurrent ? (
              <SpecificationMatrix products={products} specMode={specMode} />
            ) : null}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}

export function buildCompareSpecModeNavigationData({
  selectedSlugs,
  specMode,
}: {
  readonly selectedSlugs: readonly string[];
  readonly specMode: CompareSpecMode;
}) {
  return {
    modes: COMPARE_SPEC_MODE_OPTIONS.map(({ label, mode }) => ({
      isCurrent: mode === specMode,
      label,
      mode,
      path: buildComparePathFromSlugs(selectedSlugs, { specMode: mode }),
    })),
  };
}
