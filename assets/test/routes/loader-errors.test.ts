import {
  isAbortError,
  normalizeRouteLoaderThrownError,
  recoverRouteLoaderError,
} from "../../src/routes/loader-errors";

test("isAbortError detects DOM and object-shaped abort errors", () => {
  expect(isAbortError(new DOMException("The operation was aborted.", "AbortError"))).toBe(true);
  expect(isAbortError({ name: "AbortError" })).toBe(true);
});

test("isAbortError ignores ordinary errors and non-error values", () => {
  expect(isAbortError(new Error("Network request failed"))).toBe(false);
  expect(isAbortError("AbortError")).toBe(false);
  expect(isAbortError(null)).toBe(false);
});

test("recoverRouteLoaderError logs recoverable errors and returns the fallback", () => {
  const error = new Error("Network request failed");
  const fallback = { status: "error" } as const;
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  try {
    expect(recoverRouteLoaderError(error, "Failed to preload route query.", fallback)).toBe(
      fallback,
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to preload route query.", { error });
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

test("recoverRouteLoaderError rethrows abort errors without logging", () => {
  const error = new DOMException("The operation was aborted.", "AbortError");
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  try {
    let thrownError: unknown;

    try {
      recoverRouteLoaderError(error, "Failed to preload route query.", { status: "error" });
    } catch (caughtError) {
      thrownError = caughtError;
    }

    expect(thrownError).toBe(error);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

test("normalizeRouteLoaderThrownError preserves abort and Error rejection reasons", () => {
  const abortError = { name: "AbortError", message: "The operation was aborted." };
  const ordinaryError = new Error("Network request failed");

  expect(normalizeRouteLoaderThrownError(abortError, "Failed to preload route query.")).toBe(
    abortError,
  );
  expect(normalizeRouteLoaderThrownError(ordinaryError, "Failed to preload route query.")).toBe(
    ordinaryError,
  );
});

test("normalizeRouteLoaderThrownError wraps non-error rejection reasons with the original cause", () => {
  const rejectionReason = "relay transport failed";
  const normalizedError = normalizeRouteLoaderThrownError(
    rejectionReason,
    "Failed to preload route query.",
  );

  expect(normalizedError).toBeInstanceOf(Error);
  expect((normalizedError as Error).message).toBe("Failed to preload route query.");
  expect((normalizedError as Error & { cause?: unknown }).cause).toBe(rejectionReason);
});
