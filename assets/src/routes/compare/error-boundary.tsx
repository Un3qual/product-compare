import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import { CompareShell } from "./compare-shell";

type RouteErrorBoundaryProps = {
  resourceName?: string;
  title?: string;
};

export function RouteErrorBoundary({
  resourceName = "comparison",
  title = "Compare products"
}: RouteErrorBoundaryProps = {}) {
  const error = useRouteError();

  let errorMessage = `${capitalizeResourceName(resourceName)} unavailable.`;
  let retryGuidance = "Please try again later.";

  if (isRouteErrorResponse(error)) {
    if (error.status >= 500) {
      errorMessage = `A server error occurred while loading the ${resourceName}.`;
      retryGuidance = "Please try refreshing the page or come back later.";
    } else if (error.status === 404) {
      errorMessage = `The requested ${resourceName} could not be found.`;
      retryGuidance = "Please check the URL and try again.";
    } else if (error.status === 401 || error.status === 403) {
      errorMessage = `You don't have permission to view this ${resourceName}.`;
      retryGuidance = "Please sign in or contact support if you believe this is an error.";
    } else {
      errorMessage = `An error occurred while loading the ${resourceName}.`;
      retryGuidance = "Please try refreshing the page.";
    }
  } else if (error instanceof Error) {
    const normalizedMessage = error.message.toLowerCase();
    const isNetworkError =
      normalizedMessage.includes("network") ||
      normalizedMessage.includes("fetch") ||
      error.name === "NetworkError" ||
      (error.name === "TypeError" &&
        (normalizedMessage.includes("network") || normalizedMessage.includes("fetch")));

    if (isNetworkError) {
      errorMessage = `A network error occurred while loading the ${resourceName}.`;
      retryGuidance = "Please check your internet connection and try again.";
    } else {
      errorMessage = `An unexpected error occurred while loading the ${resourceName}.`;
      retryGuidance = "Please try refreshing the page or come back later.";
    }
  }

  return (
    <CompareShell title={title}>
      <div role="alert">
        <p>{errorMessage}</p>
        <p>{retryGuidance}</p>
      </div>
    </CompareShell>
  );
}

function capitalizeResourceName(resourceName: string) {
  return `${resourceName.charAt(0).toUpperCase()}${resourceName.slice(1)}`;
}
