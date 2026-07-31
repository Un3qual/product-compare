import * as Micro from "effect/Micro";
import { readdirSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import {
  fetchGraphQL,
  graphqlTransportEffect,
  resolveGraphQLEndpoint,
} from "../../src/relay/fetch-graphql";

test("models configuration, network, HTTP, and decoding failures as tagged Effect values", async () => {
  const failures = [
    await transportFailure({
      endpoint: { apiBaseUrl: null, isDev: false },
    }),
    await transportFailure({
      fetch: () => Promise.reject(new TypeError("offline")),
    }),
    await transportFailure({
      fetch: () => Promise.resolve(new Response("maintenance", { status: 503 })),
    }),
    await transportFailure({
      fetch: () => Promise.resolve(new Response("{not-json", { status: 200 })),
    }),
    await transportFailure({
      fetch: () => Promise.resolve(Response.json([])),
    }),
  ];

  expect(failures).toMatchObject([
    {
      _tag: "GraphQLConfigurationFailure",
      message: "VITE_API_BASE_URL must be set outside local development",
    },
    {
      _tag: "GraphQLNetworkFailure",
      message: "offline",
    },
    {
      _tag: "GraphQLHTTPFailure",
      body: "maintenance",
      status: 503,
    },
    {
      _tag: "GraphQLResponseDecodingFailure",
    },
    {
      _tag: "GraphQLResponseDecodingFailure",
      cause: expect.objectContaining({
        message: "GraphQL response must be an object",
      }),
    },
  ]);
});

test("captures request serialization errors as typed transport failures", async () => {
  const result = await Micro.runPromise(
    Micro.either(
      graphqlTransportEffect(
        "query Viewer { viewer { id } }",
        { unsupported: 1n },
        undefined,
        { fetch: vi.fn() }
      )
    )
  );

  expect(result).toMatchObject({
    _tag: "Left",
    left: {
      _tag: "GraphQLNetworkFailure"
    }
  });
});

test("preserves Promise adapter messages for network and HTTP failures", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = (() => Promise.reject(new TypeError("offline"))) as typeof fetch;

    await expect(fetchGraphQL("query Viewer { viewer { id } }", {})).rejects.toThrow(
      "Network request failed: offline",
    );

    globalThis.fetch = (() =>
      Promise.resolve(new Response("maintenance", { status: 503 }))) as typeof fetch;

    await expect(fetchGraphQL("query Viewer { viewer { id } }", {})).rejects.toThrow(
      "GraphQL request failed (503): maintenance",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("preserves malformed JSON and abort failure identity at the Promise boundary", async () => {
  const originalFetch = globalThis.fetch;
  const decodingFailure = new SyntaxError("invalid GraphQL JSON");
  const abortFailure = new DOMException("request aborted", "AbortError");

  try {
    globalThis.fetch = (() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.reject(decodingFailure),
      } as Response)) as typeof fetch;

    await expect(fetchGraphQL("query Viewer { viewer { id } }", {})).rejects.toBe(decodingFailure);

    globalThis.fetch = (() => Promise.reject(abortFailure)) as typeof fetch;

    await expect(fetchGraphQL("query Viewer { viewer { id } }", {})).rejects.toBe(abortFailure);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("sends credentials for session auth", async () => {
  const originalFetch = globalThis.fetch;
  const calls: unknown[][] = [];

  globalThis.fetch = ((...args: unknown[]) => {
    calls.push(args);
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: {} }),
    } as Response);
  }) as typeof fetch;

  try {
    await fetchGraphQL("query Viewer { viewer { id } }", {});
    expect(calls).toHaveLength(1);
    expect(String(calls[0][0])).toContain("/api/graphql");
    expect((calls[0][1] as RequestInit).credentials).toBe("include");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("uses the local Phoenix endpoint during dev when VITE_API_BASE_URL is unset", () => {
  expect(resolveGraphQLEndpoint({ isDev: true, locationOrigin: null })).toBe(
    "http://localhost:4000/api/graphql",
  );
});

test("uses the current browser host for the local Phoenix endpoint during dev", () => {
  expect(resolveGraphQLEndpoint({ isDev: true, locationOrigin: "http://127.0.0.1:5173" })).toBe(
    "http://127.0.0.1:4000/api/graphql",
  );

  expect(resolveGraphQLEndpoint({ isDev: true, locationOrigin: "http://localhost:5173" })).toBe(
    "http://localhost:4000/api/graphql",
  );
});

test("forwards SSR cookies to the GraphQL request", async () => {
  const originalFetch = globalThis.fetch;
  const calls: unknown[][] = [];

  globalThis.fetch = ((...args: unknown[]) => {
    calls.push(args);
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: {} }),
    } as Response);
  }) as typeof fetch;

  try {
    await fetchGraphQL("query Viewer { viewer { id } }", {}, { cookieString: "session=abc" });

    expect(calls).toHaveLength(1);
    expect((calls[0][1] as RequestInit).credentials).toBeUndefined();
    expect((calls[0][1] as RequestInit).headers).toMatchObject({
      "content-type": "application/json",
      cookie: "session=abc",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("derives and forwards a trusted origin for SSR requests", async () => {
  const originalFetch = globalThis.fetch;
  const calls: unknown[][] = [];

  globalThis.fetch = ((...args: unknown[]) => {
    calls.push(args);
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: {} }),
    } as Response);
  }) as typeof fetch;

  try {
    await fetchGraphQL(
      "query Viewer { viewer { id } }",
      {},
      {
        request: new Request("https://app.example.com/products"),
      },
    );

    expect(calls).toHaveLength(1);
    expect((calls[0][1] as RequestInit).headers).toMatchObject({
      "content-type": "application/json",
      origin: "https://app.example.com",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("forwards an AbortSignal for SSR requests when one is provided", async () => {
  const originalFetch = globalThis.fetch;
  const calls: unknown[][] = [];
  const controller = new AbortController();

  globalThis.fetch = ((...args: unknown[]) => {
    calls.push(args);
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: {} }),
    } as Response);
  }) as typeof fetch;

  try {
    await fetchGraphQL(
      "query Viewer { viewer { id } }",
      {},
      {
        signal: controller.signal,
      },
    );

    expect(calls).toHaveLength(1);
    expect((calls[0][1] as RequestInit).signal).toBe(controller.signal);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("forwards an AbortSignal without switching browser requests into SSR mode", async () => {
  const originalFetch = globalThis.fetch;
  const calls: unknown[][] = [];
  const controller = new AbortController();

  globalThis.fetch = ((...args: unknown[]) => {
    calls.push(args);
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: {} }),
    } as Response);
  }) as typeof fetch;

  try {
    await fetchGraphQL("query Viewer { viewer { id } }", {}, { signal: controller.signal });

    expect(calls).toHaveLength(1);
    expect((calls[0][1] as RequestInit).signal).toBe(controller.signal);
    expect((calls[0][1] as RequestInit).credentials).toBe("include");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("falls back to request.signal for SSR requests when no explicit signal is provided", async () => {
  const originalFetch = globalThis.fetch;
  const calls: unknown[][] = [];
  const controller = new AbortController();
  const request = {
    headers: new Headers(),
    signal: controller.signal,
    url: "https://app.example.com/products",
  } as Request;

  globalThis.fetch = ((...args: unknown[]) => {
    calls.push(args);
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: {} }),
    } as Response);
  }) as typeof fetch;

  try {
    await fetchGraphQL("query Viewer { viewer { id } }", {}, { request });

    expect(calls).toHaveLength(1);
    expect((calls[0][1] as RequestInit).signal).toBe(controller.signal);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("returns GraphQL top-level errors without route-specific parsing", async () => {
  const originalFetch = globalThis.fetch;
  const graphQLResponse = {
    data: {
      login: null,
    },
    errors: [{ message: "boom" }],
  };

  globalThis.fetch = (() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(graphQLResponse),
    } as Response)) as typeof fetch;

  try {
    await expect(fetchGraphQL("mutation Login { login { viewer { id } } }", {})).resolves.toBe(
      graphQLResponse,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("requires VITE_API_BASE_URL outside local dev", () => {
  expect(() => resolveGraphQLEndpoint({ isDev: false })).toThrow(
    "VITE_API_BASE_URL must be set outside local development",
  );
});

test("confines Effect imports to the GraphQL transport boundary", () => {
  const assetsRoot = process.cwd();

  const effectImports = ["src", "test"]
    .flatMap((directory) => sourceFiles(resolve(assetsRoot, directory)))
    .filter((path) =>
      /\b(?:from|import)\s*(?:\([^)]*)?["']effect(?:\/[^"']*)?["']/.test(
        readFileSync(path, "utf8"),
      ),
    )
    .map((path) => relative(assetsRoot, path))
    .sort();

  expect(effectImports).toEqual(["src/relay/fetch-graphql.ts", "test/relay/fetch-graphql.test.ts"]);
});

async function transportFailure(
  options: NonNullable<Parameters<typeof graphqlTransportEffect>[3]>,
) {
  const result = await Micro.runPromise(
    Micro.either(graphqlTransportEffect("query Viewer { viewer { id } }", {}, undefined, options)),
  );

  expect(result._tag).toBe("Left");

  if (result._tag === "Right") {
    throw new Error("expected GraphQL transport failure");
  }

  return result.left;
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);

    if (entry.isDirectory()) {
      return sourceFiles(path);
    }

    return /\.[cm]?[jt]sx?$/.test(entry.name) ? [path] : [];
  });
}
