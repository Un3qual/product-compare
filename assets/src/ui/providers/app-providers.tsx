import { DirectionProvider } from "@radix-ui/react-direction";
import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import type { PropsWithChildren } from "react";
import { create, props } from "@stylexjs/stylex";
import "../theme/theme.css";
import { tokens } from "../theme/tokens.stylex";

const styles = create({
  root: {
    backgroundColor: tokens.surface,
    color: tokens.text,
    minHeight: "100vh"
  }
});

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <DirectionProvider dir="ltr">
      <Theme
        accentColor="indigo"
        appearance="light"
        grayColor="slate"
        panelBackground="solid"
        radius="medium"
        scaling="100%"
      >
        <div {...props(styles.root)} data-theme="default">
          {children}
        </div>
      </Theme>
    </DirectionProvider>
  );
}
