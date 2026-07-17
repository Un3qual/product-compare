import { useId, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import { DataList, DataListItem } from "../../ui/components/data/DataList";
import { Button } from "../../ui/primitives/Button";
import { TextField } from "../../ui/primitives/TextField";
import { tokens } from "../../ui/theme/tokens.stylex";
import { buildComparePickerVisibleOptionsData } from "./compare-picker-data";

const styles = create({
  picker: {
    display: "grid",
    gap: "1rem"
  },
  title: {
    fontSize: "1.25rem",
    margin: 0
  },
  filter: {
    display: "grid",
    gap: "0.35rem",
    maxWidth: "24rem"
  },
  option: {
    display: "grid",
    gap: "0.35rem"
  },
  optionTitle: {
    margin: 0
  },
  metadata: {
    color: tokens.textSecondary,
    margin: 0
  }
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
  options
}: {
  heading: string;
  onShowMore: (() => void) | null;
  options: readonly CompareProductPickerOption[];
}) {
  const [filterText, setFilterText] = useState("");
  const filterInputId = useId();
  const filterLabelId = `${filterInputId}-label`;
  const visibleOptionsData = buildComparePickerVisibleOptionsData(options, filterText);

  return (
    <section {...props(styles.picker)}>
      <h2 {...props(styles.title)}>{heading}</h2>
      <div {...props(styles.filter)}>
        <span id={filterLabelId}>Filter loaded products</span>
        <TextField
          aria-labelledby={filterLabelId}
          autoComplete="off"
          id={filterInputId}
          onChange={(event) => setFilterText(event.currentTarget.value)}
          type="search"
          value={filterText}
        />
      </div>
      {visibleOptionsData.options.length === 0 ? (
        <p>{visibleOptionsData.emptyMessage}</p>
      ) : (
        <DataList label="Products available to compare">
          {visibleOptionsData.options.map((option) => (
            <DataListItem
              actions={
                <Button asChild variant="soft">
                  <Link to={option.href}>Compare {option.name}</Link>
                </Button>
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
        <Button onClick={onShowMore} type="button">
          Show more products
        </Button>
      ) : null}
    </section>
  );
}
