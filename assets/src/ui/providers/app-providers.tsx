import { DirectionProvider } from "@radix-ui/react-direction";
import type { PropsWithChildren } from "react";
import "../theme/theme.css";
import { tokens } from "../theme/tokens.stylex";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <DirectionProvider dir="ltr">
      <div
        data-theme="default"
        style={{ backgroundColor: tokens.surface, color: tokens.text, minHeight: "100vh" }}
      >
        {children}
      </div>
    </DirectionProvider>
  );
}
