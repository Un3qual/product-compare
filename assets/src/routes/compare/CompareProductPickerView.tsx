import { useId, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import { DataList, DataListItem } from "$ui/components/data/DataList";
import { Button } from "$ui/primitives/Button";
import { Input } from "$ui/primitives/Input";
import { tokens } from "$ui/theme/tokens.stylex";

const styles = create({
  picker: {
    display: "grid",
    gap: "1rem",
  },
  title: {
    fontSize: "1.25rem",
    margin: 0,
  },
  filter: {
    display: "grid",
    gap: "0.35rem",
    maxWidth: "24rem",
  },
  option: {
    display: "grid",
    gap: "0.35rem",
  },
  optionTitle: {
    margin: 0,
  },
  metadata: {
    color: tokens.textSecondary,
    margin: 0,
  },
  compareLink: {
    alignItems: "center",
    color: tokens.actionAccent,
    display: "inline-flex",
    fontWeight: 700,
    minHeight: tokens.controlHeight,
    textDecoration: "none",
    textDecorationLine: { ":hover": "underline", default: "none" },
    textUnderlineOffset: "0.2em",
  },
});

export type CompareProductPickerOption = {
  brandName: string;
  href: string;
  id: string;
  name: string;
};

export function CompareProductPickerView({
  heading,
  onShowMore,
  options,
}: {
  heading: string;
  onShowMore: (() => void) | null;
  options: readonly CompareProductPickerOption[];
}) {
  const [filterText, setFilterText] = useState("");
  const filterInputId = useId();
  const filterLabelId = `${filterInputId}-label`;
  const normalizedFilterText = filterText.trim().toLowerCase();
  const visibleOptions = normalizedFilterText
    ? options.filter((option) => option.name.toLowerCase().includes(normalizedFilterText))
    : options;

  return (
    <section {...props(styles.picker)}>
      <h2 {...props(styles.title)}>{heading}</h2>
      <div {...props(styles.filter)}>
        <span id={filterLabelId}>Filter loaded products</span>
        <Input
          aria-labelledby={filterLabelId}
          autoComplete="off"
          id={filterInputId}
          onChange={(event) => setFilterText(event.currentTarget.value)}
          type="search"
          value={filterText}
        />
      </div>
      {visibleOptions.length === 0 ? (
        <p>
          {normalizedFilterText
            ? "No loaded products match this filter."
            : "No additional products are available on this page."}
        </p>
      ) : (
        <DataList label="Products available to compare">
          {visibleOptions.map((option) => (
            <DataListItem
              actions={
                <Link to={option.href} {...props(styles.compareLink)}>
                  Compare {option.name}&nbsp;<span aria-hidden="true">→</span>
                </Link>
              }
              key={option.id}
            >
              <div {...props(styles.option)}>
                <h3 {...props(styles.optionTitle)}>{option.name}</h3>
                <p {...props(styles.metadata)}>{option.brandName}</p>
              </div>
            </DataListItem>
          ))}
        </DataList>
      )}
      {onShowMore ? (
        <Button onClick={onShowMore} type="button" variant="link">
          Show more products
        </Button>
      ) : null}
    </section>
  );
}
