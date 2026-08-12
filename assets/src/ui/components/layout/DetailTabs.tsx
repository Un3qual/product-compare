import { Tabs } from "@radix-ui/themes";
import type { ReactNode } from "react";
import { create, props } from "@stylexjs/stylex";
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
      ":where([data-state='active'])": tokens.actionAccent,
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
    <Tabs.Root
      defaultValue={defaultValue ?? items[0]?.value}
      onValueChange={onValueChange}
      value={value}
      {...props(styles.root)}
    >
      <Tabs.List
        aria-label={label}
        color="indigo"
        data-slot="detail-tabs-list"
        highContrast
        {...props(styles.list)}
      >
        {items.map((item) => (
          <Tabs.Trigger
            aria-label={item.label}
            data-slot="detail-tab"
            key={item.value}
            value={item.value}
            {...props(styles.trigger)}
          >
            {item.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {items.map((item) => (
        <Tabs.Content key={item.value} value={item.value} {...props(styles.content)}>
          {item.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
