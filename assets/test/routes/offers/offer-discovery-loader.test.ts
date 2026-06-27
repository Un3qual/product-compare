import type { LoaderFunctionArgs } from "react-router-dom";
import { createRelayEnvironment } from "../../../src/relay/environment";
import {
  createRelayRouterContext,
  preloadRouteQuery
} from "../../../src/relay/route-preload";
import { offerDiscoveryLoader } from "../../../src/routes/offers/loader";

vi.mock("../../../src/relay/route-preload", async () => {
  const actual = await vi.importActual<typeof import("../../../src/relay/route-preload")>(
    "../../../src/relay/route-preload"
  );

  return {
    ...actual,
    preloadRouteQuery: vi.fn()
  };
});

const preloadRouteQueryMock = vi.mocked(preloadRouteQuery);

const OFFER_DISCOVERY_QUERY_TEXT =
  "query OfferDiscoveryRouteQuery($input: MerchantProductsInput!) { merchantProducts(input: $input) { edges { node { id } } } }";

const PRODUCT_ID = "UHJvZHVjdDoxMjM=";
const MERCHANT_ID = "TWVyY2hhbnQ6NDU2";

beforeEach(() => {
  preloadRouteQueryMock.mockReset();
});

test("offerDiscoveryLoader asks for a product before preloading offers", async () => {
  const environment = createRelayEnvironment();
  const request = new Request("https://app.example.test/offers");

  await expect(
    offerDiscoveryLoader(buildOfferDiscoveryLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "missingProduct",
    filters: {
      activeOnly: true,
      after: null,
      first: 6,
      merchantId: null,
      productId: null
    }
  });

  expect(preloadRouteQueryMock).not.toHaveBeenCalled();
});

test("offerDiscoveryLoader preloads active offers for a product by default", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    `https://app.example.test/offers?productId=${encodeURIComponent(PRODUCT_ID)}`
  );
  const descriptor = offerDiscoveryQueryDescriptor({
    input: {
      activeOnly: true,
      first: 6,
      productId: PRODUCT_ID
    }
  });

  preloadRouteQueryMock.mockResolvedValue(descriptor);

  await expect(
    offerDiscoveryLoader(buildOfferDiscoveryLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    filters: {
      activeOnly: true,
      after: null,
      first: 6,
      merchantId: null,
      productId: PRODUCT_ID
    },
    query: descriptor
  });

  expect(preloadRouteQueryMock).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    {
      input: {
        activeOnly: true,
        first: 6,
        productId: PRODUCT_ID
      }
    },
    { signal: request.signal }
  );
});

test("offerDiscoveryLoader preserves supported filters and cursor params", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    `https://app.example.test/offers?productId=${encodeURIComponent(
      PRODUCT_ID
    )}&merchantId=${encodeURIComponent(MERCHANT_ID)}&activeOnly=false&first=12&after=cursor-1`
  );
  const descriptor = offerDiscoveryQueryDescriptor({
    input: {
      activeOnly: false,
      after: "cursor-1",
      first: 12,
      merchantId: MERCHANT_ID,
      productId: PRODUCT_ID
    }
  });

  preloadRouteQueryMock.mockResolvedValue(descriptor);

  await expect(
    offerDiscoveryLoader(buildOfferDiscoveryLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    filters: {
      activeOnly: false,
      after: "cursor-1",
      first: 12,
      merchantId: MERCHANT_ID,
      productId: PRODUCT_ID
    },
    query: descriptor
  });

  expect(preloadRouteQueryMock).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    {
      input: {
        activeOnly: false,
        after: "cursor-1",
        first: 12,
        merchantId: MERCHANT_ID,
        productId: PRODUCT_ID
      }
    },
    { signal: request.signal }
  );
});

test("offerDiscoveryLoader preserves inactive-only filter and page-size", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    `https://app.example.test/offers?productId=${encodeURIComponent(
      PRODUCT_ID
    )}&activeOnly=false&first=12`
  );
  const descriptor = offerDiscoveryQueryDescriptor({
    input: {
      activeOnly: false,
      first: 12,
      productId: PRODUCT_ID
    }
  });

  preloadRouteQueryMock.mockResolvedValue(descriptor);

  await expect(
    offerDiscoveryLoader(buildOfferDiscoveryLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    filters: {
      activeOnly: false,
      after: null,
      first: 12,
      merchantId: null,
      productId: PRODUCT_ID
    },
    query: descriptor
  });

  expect(preloadRouteQueryMock).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    {
      input: {
        activeOnly: false,
        first: 12,
        productId: PRODUCT_ID
      }
    },
    { signal: request.signal }
  );
});

test("offerDiscoveryLoader normalizes blank cursor values", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    `https://app.example.test/offers?productId=${encodeURIComponent(
      PRODUCT_ID
    )}&after=%20&first=12`
  );
  const descriptor = offerDiscoveryQueryDescriptor({
    input: {
      activeOnly: true,
      first: 12,
      productId: PRODUCT_ID
    }
  });

  preloadRouteQueryMock.mockResolvedValue(descriptor);

  await expect(
    offerDiscoveryLoader(buildOfferDiscoveryLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    filters: {
      activeOnly: true,
      after: null,
      first: 12,
      merchantId: null,
      productId: PRODUCT_ID
    },
    query: descriptor
  });

  expect(preloadRouteQueryMock).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    {
      input: {
        activeOnly: true,
        first: 12,
        productId: PRODUCT_ID
      }
    },
    { signal: request.signal }
  );
});

test("offerDiscoveryLoader drops invalid page-size and active-only params", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    `https://app.example.test/offers?productId=${encodeURIComponent(
      PRODUCT_ID
    )}&activeOnly=maybe&first=500`
  );
  const descriptor = offerDiscoveryQueryDescriptor({
    input: {
      activeOnly: true,
      first: 6,
      productId: PRODUCT_ID
    }
  });

  preloadRouteQueryMock.mockResolvedValue(descriptor);

  await expect(
    offerDiscoveryLoader(buildOfferDiscoveryLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    filters: {
      activeOnly: true,
      after: null,
      first: 6,
      merchantId: null,
      productId: PRODUCT_ID
    },
    query: descriptor
  });
});

test("offerDiscoveryLoader drops malformed page-size params", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    `https://app.example.test/offers?productId=${encodeURIComponent(
      PRODUCT_ID
    )}&first=12abc`
  );
  const descriptor = offerDiscoveryQueryDescriptor({
    input: {
      activeOnly: true,
      first: 6,
      productId: PRODUCT_ID
    }
  });

  preloadRouteQueryMock.mockResolvedValue(descriptor);

  await expect(
    offerDiscoveryLoader(buildOfferDiscoveryLoaderArgs({ environment, request }))
  ).resolves.toEqual({
    status: "ready",
    filters: {
      activeOnly: true,
      after: null,
      first: 6,
      merchantId: null,
      productId: PRODUCT_ID
    },
    query: descriptor
  });

  expect(preloadRouteQueryMock).toHaveBeenCalledWith(
    environment,
    expect.anything(),
    {
      input: {
        activeOnly: true,
        first: 6,
        productId: PRODUCT_ID
      }
    },
    { signal: request.signal }
  );
});

test("offerDiscoveryLoader returns error state when route preloading fails", async () => {
  const environment = createRelayEnvironment();
  const request = new Request(
    `https://app.example.test/offers?productId=${encodeURIComponent(
      PRODUCT_ID
    )}&after=cursor-2&first=3`
  );
  const preloadError = new Error("Network request failed: offers boom");
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  preloadRouteQueryMock.mockRejectedValue(preloadError);

  try {
    await expect(
      offerDiscoveryLoader(buildOfferDiscoveryLoaderArgs({ environment, request }))
    ).resolves.toEqual({
      status: "error",
      filters: {
        activeOnly: true,
        after: "cursor-2",
        first: 3,
        merchantId: null,
        productId: PRODUCT_ID
      }
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to preload offer discovery route query.",
      {
        error: preloadError
      }
    );
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

test("offerDiscoveryLoader rethrows aborted preloads", async () => {
  const environment = createRelayEnvironment();
  const request = {
    signal: new AbortController().signal,
    url: `https://app.example.test/offers?productId=${encodeURIComponent(PRODUCT_ID)}`
  } as Request;
  const abortError = new DOMException("The operation was aborted.", "AbortError");
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  preloadRouteQueryMock.mockRejectedValue(abortError);

  try {
    await expect(
      offerDiscoveryLoader(buildOfferDiscoveryLoaderArgs({ environment, request }))
    ).rejects.toBe(abortError);

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  } finally {
    consoleErrorSpy.mockRestore();
  }
});

function buildOfferDiscoveryLoaderArgs({
  environment = createRelayEnvironment(),
  request = new Request("https://app.example.test/offers")
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

function offerDiscoveryQueryDescriptor(variables: {
  input: {
    activeOnly: boolean;
    after?: string;
    first: number;
    merchantId?: string;
    productId: string;
  };
}) {
  return {
    __relayQuery: {
      operationName: "OfferDiscoveryRouteQuery",
      text: OFFER_DISCOVERY_QUERY_TEXT,
      variables
    }
  };
}
