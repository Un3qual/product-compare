import type { ReactNode } from "react";
import { create, props } from "@stylexjs/stylex";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../primitives/Tabs";
import { tokens } from "../../theme/tokens.stylex";

const styles = create({
  root: {
    display: "grid",
    gap: "1.25rem",
    minWidth: 0,
  },
  list: {
    maxWidth: "100%",
    overflowX: "auto",
    width: "fit-content",
  },
  trigger: {
    color: {
      default: tokens.textSecondary,
      ":hover": tokens.actionAccentHover,
      ":where([data-active])": tokens.actionAccent,
    },
    fontWeight: 700,
    minHeight: tokens.controlHeight,
    whiteSpace: "nowrap",
  },
  content: {
    minWidth: 0,
    outline: "none",
  },
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
  onValueChange,
}: {
  defaultValue?: string;
  items: readonly DetailTabItem[];
  label: string;
  onValueChange?: (value: string) => void;
  value?: string;
}) {
  return (
    <Tabs
      defaultValue={defaultValue ?? items[0]?.value}
      onValueChange={onValueChange}
      value={value}
      {...props(styles.root)}
    >
      <TabsList
        aria-label={label}
        data-slot="detail-tabs-list"
        variant="line"
        {...props(styles.list)}
      >
        {items.map((item) => (
          <TabsTrigger
            aria-label={item.label}
            data-slot="detail-tab"
            key={item.value}
            value={item.value}
            {...props(styles.trigger)}
          >
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map((item) => (
        <TabsContent key={item.value} value={item.value} {...props(styles.content)}>
          {item.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
