import { fetchGraphQL, resolveGraphQLEndpoint } from "../fetch-graphql";

test("sends credentials for session auth", async () => {
  const originalFetch = globalThis.fetch;
  const calls: unknown[][] = [];

  globalThis.fetch = (async (...args: unknown[]) => {
    calls.push(args);
    return {
      ok: true,
      json: async () => ({ data: {} })
    } as Response;
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

test("requires VITE_API_BASE_URL outside local dev", () => {
  expect(() => resolveGraphQLEndpoint({ isDev: false })).toThrow(
    "VITE_API_BASE_URL must be set outside local development"
  );
});
