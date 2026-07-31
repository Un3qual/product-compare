import { Theme } from "@radix-ui/themes";
import type { PropsWithChildren } from "react";
import { create, props } from "@stylexjs/stylex";
import "@radix-ui/themes/styles.css";
import "../theme/theme.css";
import { tokens } from "../theme/tokens.stylex";

const styles = create({
  root: {
    backgroundColor: tokens.surface,
    color: tokens.text,
    minHeight: "100vh",
  },
});

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <Theme
      accentColor="indigo"
      grayColor="slate"
      hasBackground={false}
      {...props(styles.root)}
      data-theme="default"
    >
      {children}
    </Theme>
  );
}
