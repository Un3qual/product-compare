import { create, props } from "@stylexjs/stylex";
import { XIcon } from "lucide-react";
import { Button } from "$ui/primitives/Button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "$ui/primitives/Dialog";
import { RadioGroup, RadioGroupItem } from "$ui/primitives/RadioGroup";
import { tokens } from "$ui/theme/tokens.stylex";
import type { SpecFilterMode, SpecFilterSelection } from "./spec-filter-selection";

const styles = create({
  sheet: {
    borderBlockEndWidth: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    bottom: 0,
    left: "50%",
    maxHeight: { default: "min(70vh, 42rem)", "@media (max-width: 42rem)": "80vh" },
    maxWidth: "64rem",
    padding: { default: "1.5rem 2rem", "@media (max-width: 42rem)": "1.25rem 1rem" },
    top: "auto",
    transform: "translateX(-50%)",
    width: { default: "calc(100vw - 3rem)", "@media (max-width: 42rem)": "100vw" },
  },
  header: {
    alignItems: "start",
    display: "flex",
    gap: "1rem",
    justifyContent: "space-between",
    paddingInlineEnd: "2.75rem",
  },
  count: {
    color: tokens.actionAccent,
    fontSize: "0.85rem",
    fontWeight: 700,
    margin: 0,
  },
  selectedList: {
    borderBlockStartColor: tokens.borderQuiet,
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "1px",
    display: "grid",
  },
  row: {
    alignItems: "center",
    borderBlockEndColor: tokens.borderQuiet,
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: {
      default: "minmax(10rem, 1fr) minmax(16rem, 1.4fr) auto",
      "@media (max-width: 42rem)": "minmax(0, 1fr) auto",
    },
    paddingBlock: "0.8rem",
  },
  identity: {
    display: "grid",
    gap: "0.2rem",
    minWidth: 0,
  },
  name: { fontWeight: 700 },
  value: { color: tokens.textSecondary, fontSize: "0.9rem" },
  modes: {
    alignItems: "center",
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: "0.35rem 1rem",
    gridColumn: { default: "auto", "@media (max-width: 42rem)": "1 / -1" },
  },
  modeLabel: {
    alignItems: "center",
    display: "inline-flex",
    gap: "0.35rem",
    minHeight: tokens.controlHeight,
  },
  remove: { color: tokens.textSecondary },
  footer: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem",
    justifyContent: "space-between",
  },
  footerActions: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem",
  },
});

export function SpecificationFilterDrawer({
  matchingHref,
  onOpenChange,
  onSelectionsChange,
  open,
  selections,
}: {
  matchingHref: string;
  onOpenChange(open: boolean): void;
  onSelectionsChange(selections: SpecFilterSelection[]): void;
  open: boolean;
  selections: readonly SpecFilterSelection[];
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent data-placement="bottom" style={styles.sheet}>
        <div {...props(styles.header)}>
          <div>
            <DialogTitle>Filter by selected specs</DialogTitle>
            <DialogDescription>
              Adjust the matching rule for each selected specification before opening the catalog.
            </DialogDescription>
          </div>
          <p {...props(styles.count)}>{selectionCountLabel(selections.length)}</p>
        </div>

        <div {...props(styles.selectedList)}>
          {selections.map((selection) => (
            <SelectedSpecRow
              key={selection.attributeId}
              onRemove={() =>
                onSelectionsChange(
                  selections.filter((item) => item.attributeId !== selection.attributeId),
                )
              }
              onModeChange={(mode) =>
                onSelectionsChange(
                  selections.map((item) =>
                    item.attributeId === selection.attributeId ? { ...item, mode } : item,
                  ),
                )
              }
              selection={selection}
            />
          ))}
        </div>

        <div {...props(styles.footer)}>
          <Button
            aria-label="Clear selected specs"
            onClick={() => onSelectionsChange([])}
            variant="ghost"
          >
            Clear
          </Button>
          <div {...props(styles.footerActions)}>
            <Button onClick={() => onOpenChange(false)} variant="secondary">
              Keep browsing specs
            </Button>
            <Button render={<a href={matchingHref} />}>Show matching products</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SelectedSpecRow({
  onModeChange,
  onRemove,
  selection,
}: {
  onModeChange(mode: SpecFilterMode): void;
  onRemove(): void;
  selection: SpecFilterSelection;
}) {
  return (
    <div {...props(styles.row)}>
      <div {...props(styles.identity)}>
        <span {...props(styles.name)}>{selection.displayName}</span>
        <span {...props(styles.value)}>{selectionValue(selection)}</span>
      </div>
      {selection.kind === "numeric" ? (
        <RadioGroup
          aria-label={`${selection.displayName} matching rule`}
          onValueChange={(value) => onModeChange(value as SpecFilterMode)}
          style={styles.modes}
          value={selection.mode}
        >
          {(["same", "at_least", "at_most"] as const).map((mode) => (
            <label key={mode} {...props(styles.modeLabel)}>
              <RadioGroupItem value={mode} />
              <span>{modeLabel(mode)}</span>
            </label>
          ))}
        </RadioGroup>
      ) : (
        <span {...props(styles.value)}>Exact match</span>
      )}
      <Button
        aria-label={`Remove ${selection.displayName}`}
        onClick={onRemove}
        size="icon"
        style={styles.remove}
        variant="ghost"
      >
        <XIcon aria-hidden size={16} />
      </Button>
    </div>
  );
}

function selectionCountLabel(count: number) {
  return `${count} ${count === 1 ? "spec" : "specs"} selected`;
}

function modeLabel(mode: SpecFilterMode) {
  if (mode === "at_least") return "At least";
  if (mode === "at_most") return "At most";
  return "Same";
}

function selectionValue(selection: SpecFilterSelection) {
  if (selection.kind === "boolean") {
    return selection.value ? "Yes" : "No";
  }

  return selection.kind === "numeric" && selection.unitSymbol
    ? `${selection.value} ${selection.unitSymbol}`
    : selection.value;
}
