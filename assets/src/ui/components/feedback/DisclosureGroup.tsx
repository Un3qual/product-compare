import {
  Content as AccordionContent,
  Header as AccordionHeader,
  Item as AccordionItem,
  Root as AccordionRoot,
  Trigger as AccordionTrigger
} from "@radix-ui/react-accordion";
import type { ReactNode } from "react";
import { create, props } from "@stylexjs/stylex";
import { tokens } from "../../theme/tokens.stylex";

const styles = create({
  root: {
    borderBlockStartColor: tokens.borderQuiet,
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "1px"
  },
  item: {
    borderBlockEndColor: tokens.borderQuiet,
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px"
  },
  header: {
    margin: 0
  },
  trigger: {
    alignItems: "center",
    backgroundColor: "transparent",
    border: 0,
    color: tokens.text,
    cursor: "pointer",
    display: "flex",
    font: "inherit",
    fontWeight: 750,
    justifyContent: "space-between",
    paddingBlock: "1rem",
    paddingInline: 0,
    textAlign: "start",
    width: "100%"
  },
  content: {
    color: tokens.textSecondary,
    lineHeight: 1.6,
    paddingBlockEnd: "1rem"
  }
});

export type DisclosureItem = {
  content: ReactNode;
  label: ReactNode;
  value: string;
};

export function DisclosureGroup({
  items,
  label
}: {
  items: readonly DisclosureItem[];
  label: string;
}) {
  return (
    <AccordionRoot aria-label={label} type="multiple" {...props(styles.root)}>
      {items.map((item) => (
        <AccordionItem key={item.value} value={item.value} {...props(styles.item)}>
          <AccordionHeader {...props(styles.header)}>
            <AccordionTrigger {...props(styles.trigger)}>{item.label}</AccordionTrigger>
          </AccordionHeader>
          <AccordionContent data-slot="disclosure-content" {...props(styles.content)}>
            {item.content}
          </AccordionContent>
        </AccordionItem>
      ))}
    </AccordionRoot>
  );
}
