import {
  fetchGraphQL,
  graphqlTransport,
  resolveGraphQLEndpoint,
} from "../../src/relay/fetch-graphql";

test("rejects Promise transport failures with the established public errors", async () => {
  await expect(
    graphqlTransport("query Viewer { viewer { id } }", {}, undefined, {
      endpoint: { apiBaseUrl: null, isDev: false },
    }),
  ).rejects.toThrow(
    "Network request failed: VITE_API_BASE_URL must be set outside local development",
  );

  await expect(
    graphqlTransport("query Viewer { viewer { id } }", { unsupported: 1n }, undefined, {
      fetch: vi.fn(),
    }),
  ).rejects.toThrow("Network request failed: Do not know how to serialize a BigInt");

  await expect(
    graphqlTransport("query Viewer { viewer { id } }", {}, undefined, {
      fetch: () => Promise.reject(new TypeError("offline")),
    }),
  ).rejects.toThrow("Network request failed: offline");

  await expect(
    graphqlTransport("query Viewer { viewer { id } }", {}, undefined, {
      fetch: () => Promise.resolve(new Response("maintenance", { status: 503 })),
    }),
  ).rejects.toThrow("GraphQL request failed (503): maintenance");
});

test("preserves malformed JSON, nonobject response, and abort identities at the Promise boundary", async () => {
  const decodingFailure = new SyntaxError("invalid GraphQL JSON");
  const nonobjectFailure = new TypeError("GraphQL response must be an object");
  const abortFailure = new DOMException("request aborted", "AbortError");

  await expect(
    graphqlTransport("query Viewer { viewer { id } }", {}, undefined, {
      fetch: () =>
        Promise.resolve({ ok: true, json: () => Promise.reject(decodingFailure) } as Response),
    }),
  ).rejects.toBe(decodingFailure);

  await expect(
    graphqlTransport("query Viewer { viewer { id } }", {}, undefined, {
      fetch: () => Promise.resolve(Response.json([])),
    }),
  ).rejects.toEqual(nonobjectFailure);

  await expect(
    graphqlTransport("query Viewer { viewer { id } }", {}, undefined, {
      fetch: () => Promise.reject(abortFailure),
    }),
  ).rejects.toBe(abortFailure);
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
