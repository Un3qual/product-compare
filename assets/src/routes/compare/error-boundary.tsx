import { useRouteError, isRouteErrorResponse } from "react-router-dom";
import { CompareShell } from "./compare-shell";

export function CompareErrorBoundary() {
  const error = useRouteError();

  let errorMessage = "Comparison unavailable.";
  let retryGuidance = "Please try again later.";

  if (isRouteErrorResponse(error)) {
    if (error.status >= 500) {
      errorMessage = "A server error occurred while loading the comparison.";
      retryGuidance = "Please try refreshing the page or come back later.";
    } else if (error.status === 404) {
      errorMessage = "The requested comparison could not be found.";
      retryGuidance = "Please check the URL and try again.";
    } else if (error.status === 401 || error.status === 403) {
      errorMessage = "You don't have permission to view this comparison.";
      retryGuidance = "Please sign in or contact support if you believe this is an error.";
    } else {
      errorMessage = "An error occurred while loading the comparison.";
      retryGuidance = "Please try refreshing the page.";
    }
  } else if (error instanceof Error) {
    if (
      error.message.toLowerCase().includes("network") ||
      error.message.toLowerCase().includes("fetch") ||
      error.name === "NetworkError" ||
      error.name === "TypeError"
    ) {
      errorMessage = "A network error occurred while loading the comparison.";
      retryGuidance = "Please check your internet connection and try again.";
    } else {
      errorMessage = "An unexpected error occurred while loading the comparison.";
      retryGuidance = "Please try refreshing the page or come back later.";
    }
  }

  return (
    <CompareShell title="Compare products">
      <div role="alert">
        <p>{errorMessage}</p>
        <p>{retryGuidance}</p>
      </div>
    </CompareShell>
  );
}