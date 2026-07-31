export type RouteErrorViewDataInput = {
  readonly error: RouteErrorContext;
  readonly resourceName: string;
};

export type RouteErrorContext =
  | { readonly kind: "error"; readonly error: Error }
  | { readonly kind: "response"; readonly status: number }
  | { readonly kind: "unknown" };

export type RouteErrorViewData = {
  errorMessage: string;
  retryGuidance: string;
};

export function getRouteErrorViewData({
  error,
  resourceName,
}: RouteErrorViewDataInput): RouteErrorViewData {
  if (error.kind === "response") {
    return routeResponseViewData(error.status, resourceName);
  }

  if (error.kind === "error") {
    return routeExceptionViewData(error.error, resourceName);
  }

  return {
    errorMessage: `${capitalizeResourceName(resourceName)} unavailable.`,
    retryGuidance: "Please try again later.",
  };
}

function routeResponseViewData(status: number, resourceName: string): RouteErrorViewData {
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

function routeExceptionViewData(error: Error, resourceName: string): RouteErrorViewData {
  const normalizedMessage = error.message.toLowerCase();
  const isNetworkError =
    normalizedMessage.includes("network") ||
    normalizedMessage.includes("fetch") ||
    error.name === "NetworkError";

  if (isNetworkError) {
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

function capitalizeResourceName(resourceName: string) {
  return `${resourceName.charAt(0).toUpperCase()}${resourceName.slice(1)}`;
}
