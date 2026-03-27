import { useRouteError } from "react-router-dom";
import { CompareShell } from "./compare-shell";

export function CompareErrorBoundary() {
  useRouteError();

  return (
    <CompareShell title="Compare products">
      <p>Comparison unavailable.</p>
    </CompareShell>
  );
}
