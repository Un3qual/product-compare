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

  return new Error(message, { cause: error });
}

function getErrorName(error: unknown) {
  if (!error || typeof error !== "object" || !("name" in error)) {
    return null;
  }

  return error.name;
}
