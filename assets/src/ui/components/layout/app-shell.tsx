import type { PropsWithChildren } from "react";
import { tokens } from "../../theme/tokens.stylex";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <>
      <nav
        aria-label="Primary"
        style={{ borderBottom: `1px solid ${tokens.border}`, padding: "12px 16px" }}
      >
        Product Compare
      </nav>
      <main>{children}</main>
    </>
  );
}
