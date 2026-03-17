import { DirectionProvider } from "@radix-ui/react-direction";
import type { PropsWithChildren } from "react";
import * as stylex from "@stylexjs/stylex";
import "../theme/theme.css";
import { tokens } from "../theme/tokens.stylex";

const styles = stylex.create({
  root: {
    backgroundColor: tokens.surface,
    color: tokens.text,
    minHeight: "100vh"
  }
});

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <DirectionProvider dir="ltr">
      <div {...stylex.props(styles.root)} data-theme="default">
        {children}
      </div>
    </DirectionProvider>
  );
}
