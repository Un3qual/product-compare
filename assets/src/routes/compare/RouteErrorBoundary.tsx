import { isRouteErrorResponse } from "react-router";
import { FeedbackState } from "$ui/components/feedback/FeedbackState";
import { PageShell } from "$ui/components/layout/PageShell";

type RouteErrorBoundaryProps = {
  error?: unknown;
  resourceName?: string;
  title?: string;
};

type RouteErrorContext =
  | { readonly kind: "error"; readonly error: Error }
  | { readonly kind: "response"; readonly status: number }
  | { readonly kind: "unknown" };

export function RouteErrorBoundary({
  error,
  resourceName = "comparison",
  title = "Compare products",
}: RouteErrorBoundaryProps) {
  const { errorMessage, retryGuidance } = routeErrorViewData(normalizeRouteError(error), resourceName);

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

function routeErrorViewData(
  error: ReturnType<typeof normalizeRouteError>,
  resourceName: string,
) {
  if (error.kind === "response") {
    return responseErrorViewData(error.status, resourceName);
  }

  if (error.kind === "error") {
    if (isNetworkError(error.error)) {
      return {
        errorMessage: `A network error occurred while loading the ${resourceName}.`,
        retryGuidance: "Please check your internet connection and try again.",
      };
    }

    return {
      errorMessage: `An unexpected error occurred while loading the ${resourceName}.`,
      retryGuidance: "Please try refreshing the page or come back later.",
    };
  }

  return {
    errorMessage: `${capitalizeResourceName(resourceName)} unavailable.`,
    retryGuidance: "Please try again later.",
  };
}

function responseErrorViewData(status: number, resourceName: string) {
  if (status >= 500) {
    return {
      errorMessage: `A server error occurred while loading the ${resourceName}.`,
      retryGuidance: "Please try refreshing the page or come back later.",
    };
  }

  if (status === 404) {
    return {
      errorMessage: `The requested ${resourceName} could not be found.`,
      retryGuidance: "Please check the URL and try again.",
    };
  }

  if (status === 401 || status === 403) {
    return {
      errorMessage: `You don't have permission to view this ${resourceName}.`,
      retryGuidance: "Please sign in or contact support if you believe this is an error.",
    };
  }

  return {
    errorMessage: `An error occurred while loading the ${resourceName}.`,
    retryGuidance: "Please try refreshing the page.",
  };
}

function isNetworkError(error: Error) {
  const normalizedMessage = String(error.message).toLowerCase();

  return (
    normalizedMessage.includes("network") ||
    normalizedMessage.includes("fetch") ||
    error.name === "NetworkError"
  );
}

function capitalizeResourceName(resourceName: string) {
  return `${resourceName.charAt(0).toUpperCase()}${resourceName.slice(1)}`;
}
