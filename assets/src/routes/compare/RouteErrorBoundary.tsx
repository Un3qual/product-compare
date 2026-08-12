import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import { FeedbackState } from "$ui/components/feedback/FeedbackState";
import { PageShell } from "$ui/components/layout/PageShell";
import { getRouteErrorViewData, type RouteErrorContext } from "./route-error-view-data";

type RouteErrorBoundaryProps = {
  resourceName?: string;
  title?: string;
};

export function RouteErrorBoundary({
  resourceName = "comparison",
  title = "Compare products",
}: RouteErrorBoundaryProps = {}) {
  const error = useRouteError();
  const { errorMessage, retryGuidance } = getRouteErrorViewData({
    error: normalizeRouteError(error),
    resourceName,
  });

  return (
    <PageShell eyebrow="Page unavailable" title={title}>
      <FeedbackState description={retryGuidance} kind="error" title={errorMessage} />
    </PageShell>
  );
}

function normalizeRouteError(error: unknown): RouteErrorContext {
  if (isRouteErrorResponse(error)) {
    return { kind: "response", status: error.status };
  }

  if (error instanceof Error) {
    return { kind: "error", error };
  }

  return { kind: "unknown" };
}
