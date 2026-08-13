import { useEffect, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import type { ProductDetailRouteQuery } from "$generated/ProductDetailRouteQuery.graphql";
import { Checkbox } from "$ui/primitives/Checkbox";
import { Button } from "$ui/primitives/Button";
import { tokens } from "$ui/theme/tokens.stylex";
import { SpecificationFilterDrawer } from "./SpecificationFilterDrawer";
import {
  catalogPathForSpecSelections,
  readSpecFilterDraft,
  reconcileSpecFilterSelections,
  writeSpecFilterDraft,
  type SpecFilterSelection,
} from "./spec-filter-selection";

export type ProductSpecification = NonNullable<
  ProductDetailRouteQuery["response"]["product"]
>["currentAttributes"][number];

const styles = create({
  section: { display: "grid", gap: "1rem" },
  header: {
    alignItems: "end",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem 1.5rem",
    justifyContent: "space-between",
  },
  heading: { fontSize: "1.4rem", letterSpacing: "-0.025em", margin: 0 },
  guidance: { color: tokens.textSecondary, margin: 0 },
  groups: { display: "grid", gap: "1.5rem" },
  group: { display: "grid", gap: "0.75rem" },
  groupTitle: {
    color: tokens.textSecondary,
    fontSize: "0.85rem",
    letterSpacing: "0.06em",
    margin: 0,
    textTransform: "uppercase",
  },
  list: {
    borderBlockStartColor: tokens.borderQuiet,
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "1px",
    margin: 0,
  },
  row: {
    alignItems: "center",
    borderBlockEndColor: tokens.borderQuiet,
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
    display: "grid",
    gap: "0.75rem",
    gridTemplateColumns: {
      default: "minmax(10rem, 0.8fr) minmax(0, 1.2fr) auto",
      "@media (max-width: 42rem)": "minmax(0, 1fr) auto",
    },
    minHeight: tokens.controlHeight,
    paddingBlock: "0.55rem",
  },
  term: { color: tokens.textSecondary, fontWeight: 600 },
  value: {
    margin: 0,
    minWidth: 0,
  },
  selectLabel: {
    alignItems: "center",
    display: "flex",
    gap: "0.35rem",
    minHeight: tokens.controlHeight,
  },
  selectText: { fontSize: "0.85rem", fontWeight: 700 },
  mobileSpan: { gridColumn: { default: "auto", "@media (max-width: 42rem)": "1 / 2" } },
});

export function ProductSpecifications({
  attributes,
  productId,
  selectedCompareSlugs,
}: {
  attributes: readonly ProductSpecification[];
  productId: string;
  selectedCompareSlugs: readonly string[];
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selections, setSelections] = useState<SpecFilterSelection[]>([]);

  useEffect(() => {
    const storage = availableSessionStorage();
    if (!storage) {
      setSelections([]);
      return;
    }

    const currentSelections = attributes.flatMap((attribute) => {
      const selection = selectionFromAttribute(attribute);
      return selection ? [selection] : [];
    });
    const restored = readSpecFilterDraft(storage, productId);
    const reconciled = reconcileSpecFilterSelections(restored, currentSelections);

    setSelections(reconciled);
    writeSpecFilterDraft(storage, productId, reconciled);
  }, [attributes, productId]);

  const updateSelections = (nextSelections: SpecFilterSelection[]) => {
    setSelections(nextSelections);
    const storage = availableSessionStorage();
    if (storage) writeSpecFilterDraft(storage, productId, nextSelections);
    if (nextSelections.length === 0) setDrawerOpen(false);
  };

  const { groupedAttributes, ungroupedAttributes } = groupProductSpecifications(attributes);

  return (
    <section aria-label="Specifications" {...props(styles.section)}>
      <div {...props(styles.header)}>
        <div>
          <h2 {...props(styles.heading)}>Specifications</h2>
          <p {...props(styles.guidance)}>
            Select one or more filterable specs to find products that match them all.
          </p>
        </div>
        {selections.length > 0 ? (
          <Button onClick={() => setDrawerOpen(true)} variant="secondary">
            Edit {selections.length} selected {selections.length === 1 ? "spec" : "specs"}
          </Button>
        ) : null}
      </div>

      {attributes.length === 0 ? (
        <p>No product attributes available yet.</p>
      ) : (
        <div {...props(styles.groups)}>
          {groupedAttributes.map((group) => (
            <section key={group.key} {...props(styles.group)}>
              <h3 {...props(styles.groupTitle)}>{group.label}</h3>
              <SpecificationList
                attributes={group.attributes}
                onSelectionChange={(attribute, selected) => {
                  const next = selectionsAfterToggle(selections, attribute, selected);
                  updateSelections(next);
                  if (selected) setDrawerOpen(true);
                }}
                selections={selections}
              />
            </section>
          ))}
          {ungroupedAttributes.length > 0 ? (
            <SpecificationList
              attributes={ungroupedAttributes}
              onSelectionChange={(attribute, selected) => {
                const next = selectionsAfterToggle(selections, attribute, selected);
                updateSelections(next);
                if (selected) setDrawerOpen(true);
              }}
              selections={selections}
            />
          ) : null}
        </div>
      )}

      <SpecificationFilterDrawer
        matchingHref={catalogPathForSpecSelections(selections, selectedCompareSlugs)}
        onOpenChange={setDrawerOpen}
        onSelectionsChange={updateSelections}
        open={drawerOpen && selections.length > 0}
        selections={selections}
      />
    </section>
  );
}

function availableSessionStorage() {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function SpecificationList({
  attributes,
  onSelectionChange,
  selections,
}: {
  attributes: readonly ProductSpecification[];
  onSelectionChange(attribute: ProductSpecification, selected: boolean): void;
  selections: readonly SpecFilterSelection[];
}) {
  return (
    <dl {...props(styles.list)}>
      {attributes.map((attribute) => {
        const filterSelection = selectionFromAttribute(attribute);
        const selected = selections.some(
          (selection) => selection.attributeId === filterSelection?.attributeId,
        );

        return (
          <div key={attribute.code} {...props(styles.row)}>
            <dt {...props(styles.term)}>{attribute.displayName}</dt>
            <dd {...props(styles.value, styles.mobileSpan)}>{attribute.valueText}</dd>
            {filterSelection ? (
              <label {...props(styles.selectLabel)}>
                <Checkbox
                  aria-label={`Select ${attribute.displayName}`}
                  checked={selected}
                  onCheckedChange={(checked) => onSelectionChange(attribute, checked)}
                />
                <span {...props(styles.selectText)}>Filter</span>
              </label>
            ) : null}
          </div>
        );
      })}
    </dl>
  );
}

export function groupProductSpecifications(attributes: readonly ProductSpecification[]) {
  const groups = new Map<
    string,
    { attributes: ProductSpecification[]; key: string; label: string }
  >();
  const ungroupedAttributes: ProductSpecification[] = [];

  for (const attribute of attributes) {
    const label = attribute.groupLabel?.trim();
    if (!label) {
      ungroupedAttributes.push(attribute);
      continue;
    }

    const key = label.toLowerCase();
    const group = groups.get(key);
    if (group) group.attributes.push(attribute);
    else groups.set(key, { attributes: [attribute], key, label });
  }

  return { groupedAttributes: Array.from(groups.values()), ungroupedAttributes };
}

function selectionsAfterToggle(
  selections: readonly SpecFilterSelection[],
  attribute: ProductSpecification,
  selected: boolean,
) {
  const candidate = selectionFromAttribute(attribute);
  if (!candidate) return [...selections];

  const withoutCandidate = selections.filter(
    (selection) => selection.attributeId !== candidate.attributeId,
  );
  return selected ? [...withoutCandidate, candidate] : withoutCandidate;
}

function selectionFromAttribute(attribute: ProductSpecification): SpecFilterSelection | null {
  if (!attribute.attributeId) return null;

  const shared = {
    attributeId: attribute.attributeId,
    code: attribute.code,
    displayName: attribute.displayName,
    mode: "same" as const,
  };

  if (attribute.dataType === "enum" && attribute.enumOptionId) {
    return { ...shared, kind: "enum", value: attribute.enumOptionId };
  }

  if (attribute.dataType === "bool" && attribute.booleanValue !== null) {
    return { ...shared, kind: "boolean", value: attribute.booleanValue };
  }

  if (attribute.dataType === "numeric" && attribute.numericValue) {
    return {
      ...shared,
      kind: "numeric",
      unitSymbol: attribute.unitSymbol,
      value: attribute.numericValue,
    };
  }

  return null;
}
