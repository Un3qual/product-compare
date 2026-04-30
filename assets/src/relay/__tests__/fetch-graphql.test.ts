import { fetchGraphQL, formatGraphQLErrorMessage, resolveGraphQLEndpoint } from "../fetch-graphql";

test("sends credentials for session auth", async () => {
  const originalFetch = globalThis.fetch;
  const calls: unknown[][] = [];

  globalThis.fetch = ((...args: unknown[]) => {
    calls.push(args);
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: {} })
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
    "http://localhost:4000/api/graphql"
  );
});

test("uses the current browser host for the local Phoenix endpoint during dev", () => {
  expect(
    resolveGraphQLEndpoint({ isDev: true, locationOrigin: "http://127.0.0.1:5173" })
  ).toBe("http://127.0.0.1:4000/api/graphql");

  expect(resolveGraphQLEndpoint({ isDev: true, locationOrigin: "http://localhost:5173" })).toBe(
    "http://localhost:4000/api/graphql"
  );
});

test("forwards SSR cookies to the GraphQL request", async () => {
  const originalFetch = globalThis.fetch;
  const calls: unknown[][] = [];

  globalThis.fetch = ((...args: unknown[]) => {
    calls.push(args);
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: {} })
    } as Response);
  }) as typeof fetch;

  try {
    await fetchGraphQL("query Viewer { viewer { id } }", {}, { cookieString: "session=abc" });

    expect(calls).toHaveLength(1);
    expect((calls[0][1] as RequestInit).credentials).toBeUndefined();
    expect((calls[0][1] as RequestInit).headers).toMatchObject({
      "content-type": "application/json",
      cookie: "session=abc"
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
      json: () => Promise.resolve({ data: {} })
    } as Response);
  }) as typeof fetch;

  try {
    await fetchGraphQL("query Viewer { viewer { id } }", {}, {
      request: new Request("https://app.example.com/products")
    });

    expect(calls).toHaveLength(1);
    expect((calls[0][1] as RequestInit).headers).toMatchObject({
      "content-type": "application/json",
      origin: "https://app.example.com"
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
      json: () => Promise.resolve({ data: {} })
    } as Response);
  }) as typeof fetch;

  try {
    await fetchGraphQL("query Viewer { viewer { id } }", {}, {
      signal: controller.signal
    });

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
      json: () => Promise.resolve({ data: {} })
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
    url: "https://app.example.com/products"
  } as Request;

  globalThis.fetch = ((...args: unknown[]) => {
    calls.push(args);
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: {} })
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

test("returns GraphQL top-level errors by default for manual response parsing", async () => {
  const originalFetch = globalThis.fetch;
  const graphQLResponse = {
    data: {
      login: null
    },
    errors: [{ message: "boom" }]
  };

  globalThis.fetch = (() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(graphQLResponse)
    } as Response)) as typeof fetch;

  try {
    await expect(fetchGraphQL("mutation Login { login { viewer { id } } }", {})).resolves.toBe(
      graphQLResponse
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rejects GraphQL top-level errors when requested by Relay query callers", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            product: null
          },
          errors: [{ message: "boom" }]
        })
    } as Response)) as typeof fetch;

  try {
    await expect(
      fetchGraphQL("query Product { product(slug: \"boom\") { id } }", {}, {
        rejectGraphQLErrors: true
      })
    ).rejects.toThrow("GraphQL response contained errors");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("formats all GraphQL top-level error messages", () => {
  expect(
    formatGraphQLErrorMessage({
      errors: [{ message: "first failure" }, { message: "second failure" }]
    })
  ).toBe("GraphQL response contained errors: first failure; second failure");
});

test("requires VITE_API_BASE_URL outside local dev", () => {
  expect(() => resolveGraphQLEndpoint({ isDev: false })).toThrow(
    "VITE_API_BASE_URL must be set outside local development"
  );
});
