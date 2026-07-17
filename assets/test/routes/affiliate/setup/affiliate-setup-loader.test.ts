import type { LoaderFunctionArgs } from "react-router-dom";
import { createRelayEnvironment } from "../../../../src/relay/environment";
import {
  createRelayRouterContext,
  preloadRouteQuery
} from "../../../../src/relay/route-preload";
import { affiliateSetupLoader } from "../../../../src/routes/affiliate/setup/loader";
import {
  affiliateSetupPagePath,
  buildAffiliateSetupPaginationData
} from "../../../../src/routes/affiliate/setup/pagination";

vi.mock("../../../../src/relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../../src/relay/route-preload")>(
    "../../../../src/relay/route-preload"
  );

  return {
    ...actual,
    preloadRouteQuery: vi.fn()
  };
});

const preloadRouteQueryMock = vi.mocked(preloadRouteQuery);

const AFFILIATE_SETUP_QUERY_TEXT =
  "query AffiliateSetupRouteQuery($first: Int, $after: String) { merchants(first: $first, after: $after) { edges { node { id } } } }";

beforeEach(() => {
  preloadRouteQueryMock.mockReset();
});

test("affiliateSetupLoader preloads the default merchant choices page", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.test/affiliate/setup");
  const descriptor = affiliateSetupQueryDescriptor({ first: 20, after: null });

  preloadRouteQueryMock.mockResolvedValue(descriptor);

  await expect(
    affiliateSetupLoader(buildAffiliateSetupLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    merchantPagination: {
      first: 20,
      after: null
    },
    merchantQuery: descriptor
  });

  expect(preloadRouteQueryMock).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    { first: 20, after: null },
    { signal: request.signal }
  );
});

test("affiliateSetupLoader preserves supported merchant cursor and page-size params", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.test/affiliate/setup?after=merchant-cursor&first=50"
  );
  const descriptor = affiliateSetupQueryDescriptor({ first: 50, after: "merchant-cursor" });

  preloadRouteQueryMock.mockResolvedValue(descriptor);

  await expect(
    affiliateSetupLoader(buildAffiliateSetupLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    merchantPagination: {
      first: 50,
      after: "merchant-cursor"
    },
    merchantQuery: descriptor
  });
});

test("affiliateSetupPagePath serializes normalized merchant pagination", () => {
  expect(
    affiliateSetupPagePath({
      first: 35,
      after: "merchant cursor/+"
    })
  ).toBe("/affiliate/setup?first=35&after=merchant+cursor%2F%2B");

  expect(
    affiliateSetupPagePath({
      first: 35,
      after: null
    })
  ).toBe("/affiliate/setup?first=35");
});

test("buildAffiliateSetupPaginationData returns page-size-preserving first and next paths", () => {
  expect(
    buildAffiliateSetupPaginationData({
      endCursor: "next cursor/+",
      hasNextPage: true,
      hasPreviousPage: true,
      pagination: {
        first: 35,
        after: "current-cursor"
      }
    })
  ).toEqual({
    firstHref: "/affiliate/setup?first=35",
    nextHref: "/affiliate/setup?first=35&after=next+cursor%2F%2B"
  });
});

test.each([
  [false, "current-cursor"],
  [true, null]
] as const)(
  "buildAffiliateSetupPaginationData hides incomplete first-page facts",
  (hasPreviousPage, after) => {
    expect(
      buildAffiliateSetupPaginationData({
        endCursor: null,
        hasNextPage: false,
        hasPreviousPage,
        pagination: { first: 20, after }
      }).firstHref
    ).toBeNull();
  }
);

test.each([
  [false, "next-cursor"],
  [true, null]
] as const)(
  "buildAffiliateSetupPaginationData hides incomplete next-page facts",
  (hasNextPage, endCursor) => {
    expect(
      buildAffiliateSetupPaginationData({
        endCursor,
        hasNextPage,
        hasPreviousPage: false,
        pagination: { first: 20, after: null }
      }).nextHref
    ).toBeNull();
  }
);

test("buildAffiliateSetupPaginationData does not mutate its input", () => {
  const input = Object.freeze({
    endCursor: "next-cursor",
    hasNextPage: true,
    hasPreviousPage: true,
    pagination: Object.freeze({ first: 50, after: "current-cursor" })
  });

  buildAffiliateSetupPaginationData(input);

  expect(input).toEqual({
    endCursor: "next-cursor",
    hasNextPage: true,
    hasPreviousPage: true,
    pagination: { first: 50, after: "current-cursor" }
  });
});

test("affiliateSetupLoader drops invalid merchant page-size params", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.test/affiliate/setup?after=merchant-cursor&first=500"
  );
  const descriptor = affiliateSetupQueryDescriptor({ first: 20, after: "merchant-cursor" });

  preloadRouteQueryMock.mockResolvedValue(descriptor);

  await expect(
    affiliateSetupLoader(buildAffiliateSetupLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    merchantPagination: {
      first: 20,
      after: "merchant-cursor"
    },
    merchantQuery: descriptor
  });
});

test("affiliateSetupLoader returns error state when merchant preloading fails", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    "https://app.example.test/affiliate/setup?after=merchant-cursor&first=30"
  );
  const preloadError = new Error("Network request failed: affiliate setup boom");
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  preloadRouteQueryMock.mockRejectedValue(preloadError);

  try {
    await expect(
      affiliateSetupLoader(buildAffiliateSetupLoaderArgs({ environment, request }))
    ).resolves.toEqual({
      status: "error",
      merchantPagination: {
        first: 30,
        after: "merchant-cursor"
      }
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to preload affiliate setup merchant choices.",
      {
        error: preloadError
      }
    );
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

function buildAffiliateSetupLoaderArgs({
  environment = createRelayEnvironment(),
  request = new Request("https://app.example.test/affiliate/setup")
}: {
  environment?: ReturnType<typeof createRelayEnvironment>;
  request?: Request;
} = {}): LoaderFunctionArgs {
  return {
    request,
    params: {},
    context: createRelayRouterContext(environment)
  } as LoaderFunctionArgs;
}

function affiliateSetupQueryDescriptor(variables: { first: number; after: string | null }) {
  return {
    __relayQuery: {
      operationName: "AffiliateSetupRouteQuery",
      text: AFFILIATE_SETUP_QUERY_TEXT,
      variables
    }
  };
}
