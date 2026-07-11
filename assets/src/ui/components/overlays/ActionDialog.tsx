import { Dialog } from "@radix-ui/themes";
import type { PropsWithChildren, ReactElement, ReactNode } from "react";
import { create, props } from "@stylexjs/stylex";
import { Button } from "../../primitives/Button";

const styles = create({
  content: {
    display: "grid",
    gap: "1rem"
  },
  actions: {
    display: "flex",
    justifyContent: "end"
  }
});

export function ActionDialog({
  children,
  description,
  title,
  trigger
}: PropsWithChildren<{
  description?: ReactNode;
  title: string;
  trigger: ReactElement;
}>) {
  return (
    <Dialog.Root>
      <Dialog.Trigger>{trigger}</Dialog.Trigger>
      <Dialog.Content maxWidth="36rem" {...props(styles.content)}>
        <Dialog.Title>{title}</Dialog.Title>
        {description ? <Dialog.Description>{description}</Dialog.Description> : null}
        {children}
        <div {...props(styles.actions)}>
          <Dialog.Close>
            <Button variant="soft">Close</Button>
          </Dialog.Close>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}
