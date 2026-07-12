import { DirectionProvider } from "@radix-ui/react-direction";
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
      <div {...props(styles.root)} data-theme="default">
        {children}
      </div>
    </DirectionProvider>
  );
}
