import { useState, type PropsWithChildren, type ReactNode } from "react";
import { create, props } from "@stylexjs/stylex";
import { Button } from "../../primitives/Button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "../../primitives/Collapsible";
import { tokens } from "../../theme/tokens.stylex";

const styles = create({
  root: {
    borderBlockColor: tokens.borderQuiet,
    borderBlockStyle: "solid",
    borderBlockWidth: "1px",
    paddingBlock: "0.75rem"
  },
  trigger: {
    justifyContent: "space-between",
    width: "100%"
  },
  summary: {
    color: tokens.textSecondary,
    fontWeight: 500
  },
  content: {
    display: "grid",
    gap: "1rem",
    paddingBlockStart: "1rem"
  }
});

export function MobileContextPanel({
  children,
  defaultOpen = false,
  label,
  summary
}: PropsWithChildren<{
  defaultOpen?: boolean;
  label: string;
  summary?: ReactNode;
}>) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen} {...props(styles.root)}>
      <CollapsibleTrigger asChild>
        <Button variant="soft" {...props(styles.trigger)}>
          <span>{label}</span>
          {summary ? <span {...props(styles.summary)}>{summary}</span> : null}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent data-slot="mobile-context-content" {...props(styles.content)}>
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
