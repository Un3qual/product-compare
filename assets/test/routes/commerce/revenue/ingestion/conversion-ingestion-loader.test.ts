import { expect, test, vi } from "vitest";
import { createRelayEnvironment } from "../../../../../src/relay/environment";
import {
  createRelayRouterContext,
  preloadRouteQuery,
} from "../../../../../src/relay/route-preload";
import {
  SYNC_RUN_PAGE_SIZE,
  conversionIngestionLoader,
} from "../../../../../src/routes/commerce/revenue/ingestion/ConversionIngestionRoute";

vi.mock("../../../../../src/relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../../../src/relay/route-preload")>(
    "../../../../../src/relay/route-preload",
  );

  return { ...actual, preloadRouteQuery: vi.fn() };
});

const preloadRouteQueryMock = vi.mocked(preloadRouteQuery);

test("conversionIngestionLoader starts both preloads and returns after the overview", async () => {
  const environment = createRelayEnvironment();
  const overview = deferredPromise<{ __relayQuery: { operationName: string } }>();
  const runs = deferredPromise<{ __relayQuery: { operationName: string } }>();
  const request = new Request("https://app.example.test/commerce/revenue/ingestion");

  preloadRouteQueryMock
    .mockReturnValueOnce(overview.promise as never)
    .mockReturnValueOnce(runs.promise as never);

  const loaderResult = conversionIngestionLoader(buildLoaderArgs(environment, request));

  expect(preloadRouteQueryMock).toHaveBeenCalledTimes(2);
  expect(preloadRouteQueryMock).toHaveBeenNthCalledWith(
    2,
    environment,
    expect.anything(),
    { after: null, first: SYNC_RUN_PAGE_SIZE },
    { signal: request.signal },
  );

  overview.resolve({ __relayQuery: { operationName: "ConversionIngestionRouteQuery" } });
  const loaderData = await loaderResult;

  expect(loaderData).toMatchObject({
    status: "ready",
    overviewQuery: { __relayQuery: { operationName: "ConversionIngestionRouteQuery" } },
  });
  if (loaderData.status !== "ready") throw new Error("Expected ready loader data");

  const preservedRejection = expect(loaderData.runsQuery).rejects.toThrow(
    "run history unavailable",
  );
  runs.reject(new Error("run history unavailable"));
  await preservedRejection;
});

test("conversionIngestionLoader observes a history rejection while the overview remains pending", async () => {
  const environment = createRelayEnvironment();
  const overview = deferredPromise<{ __relayQuery: { operationName: string } }>();
  const runs = deferredPromise<{ __relayQuery: { operationName: string } }>();
  const unhandledRejections: unknown[] = [];
  const captureUnhandledRejection = (reason: unknown) => unhandledRejections.push(reason);

  preloadRouteQueryMock
    .mockReturnValueOnce(overview.promise as never)
    .mockReturnValueOnce(runs.promise as never);
  const observeHistoryRejection = vi.spyOn(runs.promise, "catch");
  process.on("unhandledRejection", captureUnhandledRejection);

  try {
    const loaderResult = conversionIngestionLoader(
      buildLoaderArgs(
        environment,
        new Request("https://app.example.test/commerce/revenue/ingestion"),
      ),
    );

    expect(observeHistoryRejection).toHaveBeenCalledTimes(1);
    runs.reject(new Error("run history unavailable before overview"));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(unhandledRejections).toEqual([]);

    overview.resolve({ __relayQuery: { operationName: "ConversionIngestionRouteQuery" } });
    const loaderData = await loaderResult;
    if (loaderData.status !== "ready") throw new Error("Expected ready loader data");
    await expect(loaderData.runsQuery).rejects.toThrow("run history unavailable before overview");
  } finally {
    process.off("unhandledRejection", captureUnhandledRejection);
  }
});

function buildLoaderArgs(environment: ReturnType<typeof createRelayEnvironment>, request: Request) {
  return {
    context: createRelayRouterContext(environment),
    params: {},
    pattern: "/commerce/revenue/ingestion",
    request,
    url: new URL(request.url),
  };
}

function deferredPromise<T>() {
  let reject!: (reason?: unknown) => void;
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
}
