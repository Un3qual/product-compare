export function isAbortError(error: unknown) {
  return getErrorName(error) === "AbortError";
}

export function recoverRouteLoaderError<TFallback>(
  error: unknown,
  message: string,
  fallback: TFallback,
): TFallback {
  if (isAbortError(error)) {
    throw error;
  }

  console.error(message, { error });

  return fallback;
}

export function normalizeRouteLoaderThrownError(error: unknown, message: string) {
  if (isAbortError(error) || error instanceof Error) {
    return error;
  }

  const wrappedError = new Error(message) as Error & { cause?: unknown };
  wrappedError.cause = error;

  return wrappedError;
}

function getErrorName(error: unknown) {
  if (!error || typeof error !== "object" || !("name" in error)) {
    return null;
  }

  return error.name;
}
