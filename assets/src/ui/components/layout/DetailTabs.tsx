import {
  Content as TabsContent,
  List as TabsList,
  Root as TabsRoot,
  Trigger as TabsTrigger
} from "@radix-ui/react-tabs";
import type { ReactNode } from "react";
import { create, props } from "@stylexjs/stylex";
import { tokens } from "../../theme/tokens.stylex";

const styles = create({
  root: {
    display: "grid",
    gap: "1.25rem",
    minWidth: 0
  },
  list: {
    borderBlockEndColor: tokens.borderQuiet,
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
    display: "flex",
    gap: "0.25rem",
    overflowX: "auto"
  },
  trigger: {
    backgroundColor: "transparent",
    borderBlockEndColor: {
      default: "transparent",
      ":where([data-state='active'])": tokens.actionAccent
    },
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "2px",
    borderInline: 0,
    borderBlockStart: 0,
    color: {
      default: tokens.textSecondary,
      ":where([data-state='active'])": tokens.text
    },
    cursor: "pointer",
    font: "inherit",
    fontWeight: 700,
    padding: "0.75rem 1rem",
    whiteSpace: "nowrap"
  },
  content: {
    minWidth: 0,
    outline: "none"
  }
});

export type DetailTabItem = {
  content: ReactNode;
  label: string;
  value: string;
};

export function DetailTabs({
  defaultValue,
  items,
  label,
  value,
  onValueChange
}: {
  defaultValue?: string;
  items: readonly DetailTabItem[];
  label: string;
  onValueChange?: (value: string) => void;
  value?: string;
}) {
  return (
    <TabsRoot
      defaultValue={defaultValue ?? items[0]?.value}
      onValueChange={onValueChange}
      value={value}
      {...props(styles.root)}
    >
      <TabsList aria-label={label} {...props(styles.list)}>
        {items.map((item) => (
          <TabsTrigger key={item.value} value={item.value} {...props(styles.trigger)}>
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map((item) => (
        <TabsContent key={item.value} value={item.value} {...props(styles.content)}>
          {item.content}
        </TabsContent>
      ))}
    </TabsRoot>
  );
}
