import type { SSRContext } from "../../relay/fetch-graphql";

export function createServerRequest(url: string, ssrContext?: SSRContext) {
  const request = ssrContext?.request;
  const headers = new Headers(ssrContext?.headers);

  request?.headers.forEach((value, key) => {
    headers.set(key, value);
  });

  if (ssrContext?.cookieString) {
    headers.set("cookie", ssrContext.cookieString);
  }

  const signal = ssrContext?.signal ?? request?.signal;
  const serverRequest = new Request(resolveServerUrl(url, request?.url), {
    method: request?.method ?? "GET",
    headers,
  });

  if (signal) {
    // Avoid RequestInit cross-realm AbortSignal checks while preserving loader cancellation.
    Object.defineProperty(serverRequest, "signal", {
      value: bridgeAbortSignal(signal),
    });
  }

  return serverRequest;
}

function bridgeAbortSignal(signal: AbortSignal) {
  const controller = new AbortController();

  if (signal.aborted) {
    controller.abort(signal.reason);
  } else {
    signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });

    if (signal.aborted) {
      controller.abort(signal.reason);
    }
  }

  return controller.signal;
}

function resolveServerUrl(url: string, fallback?: string) {
  const baseUrl = fallback ?? "http://localhost";

  try {
    return new URL(url, baseUrl).toString();
  } catch (error) {
    console.error("Failed to resolve server URL", {
      url,
      baseUrl,
      error,
    });
    return "http://localhost/";
  }
}
