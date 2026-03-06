import { AppShell } from "../ui/components/layout/app-shell";
import { AppProviders } from "../ui/providers/app-providers";

export function RootRoute() {
  return (
    <AppProviders>
      <AppShell>
        <h1>Product Compare</h1>
      </AppShell>
    </AppProviders>
  );
}
